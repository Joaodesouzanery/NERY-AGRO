// Extrator determinístico de "romaneio/apontamento" a partir de texto livre do
// WhatsApp (+ foto anexada à parte). Sem IA: usa rótulos ("Placa:", "Pivô:",
// "Total de caixas:", "peso líquido X kg média Y", "beg"/"cxs") e regex tolerante
// a acento. A saída SEMPRE passa por conferência humana antes de virar registro.
//
// Reusa `dateValue` de import-parsing; usa um parser numérico BR próprio porque
// os apontamentos misturam "19.178" (milhar) com "21.7"/"24,33" (decimal).

import { dateValue } from "@/lib/import-parsing";

export type Confianca = "alta" | "media" | "baixa";

export type RomaneioKind =
  | "remessa"
  | "corte"
  | "carregamento"
  | "diarias"
  | "caixas-vazias"
  | "desconhecido";

// Uma linha de mão de obra: diária (comum/alojamento/fertirrigação) ou hora (HN/HE).
export type MaoObraItem = {
  tipo: string; // "diaria" | "HN" | "HE"
  qtd: number;
  valor_unit: number;
  total: number;
  categoria?: string; // p/ diárias: alojamento, fertirrigação, ...
};

export type ParsedRomaneio = {
  kind: RomaneioKind;
  fields: Record<string, string>;
  confidence: Record<string, Confianca>;
  warnings: string[];
  raw: string;
};

/**
 * Divide um texto colado em vários apontamentos, quando houver um separador
 * explícito (linha só de `---`/`===`/`***`/`___`) ou um espaço grande (2+ linhas
 * em branco). Conservador de propósito: um único apontamento multi-linha (com no
 * máx. uma linha em branco no meio) NÃO é dividido. Sempre retorna ≥ 1 bloco.
 */
export function splitApontamentos(text: string): string[] {
  const blocks = text
    .split(/\n[ \t]*[-—=*_]{3,}[ \t]*\n|\n[ \t]*\n[ \t]*\n+/g)
    .map((block) => block.trim())
    .filter(Boolean);
  return blocks.length ? blocks : [text.trim()].filter(Boolean);
}

// Número no padrão BR/misto: "19.178" -> 19178 (milhar), "21.7" -> 21.7 (decimal),
// "24,33" -> 24.33, "2.632" -> 2632, "438,5" -> 438.5, "R$1,70" -> 1.7.
export function numBr(raw: string): string {
  if (!raw) return "";
  let s = raw.replace(/[^\d.,]/g, "");
  if (!s) return "";
  // Remove ponto de milhar (ponto seguido de exatamente 3 dígitos e não-dígito/fim).
  s = s.replace(/\.(?=\d{3}(\D|$))/g, "");
  // Vírgula é decimal.
  s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? String(n) : "";
}

function grab(text: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1] != null && m[1].trim() !== "") return m[1].trim();
  }
  return undefined;
}

// Limpa cauda de "!!!", pontuação e espaços de um valor rotulado.
function tidy(value: string): string {
  return value
    .replace(/[!.;,]+\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// "11.30" / "11:30" / "11h30" / "1121" -> "HH:MM".
function toTime(h: string, m: string): string {
  const hh = String(Math.min(23, Number(h))).padStart(2, "0");
  const mm = (m ?? "00").padStart(2, "0").slice(0, 2);
  return `${hh}:${mm}`;
}

// Número de DOCUMENTO (nº do romaneio, nº da pesagem): é identificador, não
// quantidade — preserva zeros à esquerda ("016417"). Nunca use numBr aqui.
function docNum(raw: string): string {
  return raw.replace(/\D/g, "");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

const KNOWN_VARIEDADES = ["taila", "vale sul", "vale-sul", "buccaneer", "optima", "regia"];

const CULTURAS = [
  "cebola",
  "alho",
  "tomate",
  "batata",
  "cenoura",
  "beterraba",
  "repolho",
  "alface",
  "melancia",
  "milho",
  "soja",
  "trigo",
  "sorgo",
];

// Rótulos do formulário impresso: quando o campo vem em branco, a regex pega o
// rótulo seguinte como se fosse valor. Estes nunca são valor de Cultura/Variedade.
const LABEL_WORDS = new Set([
  "variedade",
  "cultura",
  "data",
  "hora",
  "peso",
  "tara",
  "qtd",
  "talhao",
  "fazenda",
  "preencher",
  "lavoura",
]);

/**
 * "Chapas:06" → "06". Não atravessa quebra de linha nem casa linha de preço:
 * em "Carregamento chapa\n500 R$ 0,22" o 500 é quantidade de CAIXAS, não de
 * chapas — e o `[:\s]*` da versão antiga engolia o `\n` e gravava chapas=500.
 */
function grabChapas(raw: string): string | undefined {
  for (const m of raw.matchAll(/chapas?[ \t]*:?[ \t]*([0-9]{1,3})(?!\d)/gi)) {
    const at = m.index ?? 0;
    const start = raw.lastIndexOf("\n", at) + 1;
    const end = raw.indexOf("\n", at);
    if (/r\$/i.test(raw.slice(start, end === -1 ? raw.length : end))) continue;
    return m[1];
  }
  return undefined;
}

// Uma linha de carregamento sem nº de chapas: "500 R$ 0,22 =R$ 110,00".
export type CarregamentoItem = { caixas: number; preco: number; total: number };

/**
 * Formato de carregamento que informa CAIXAS × preço em vez do nº de chapas:
 * "Carregamento chapa / 500 R$ 0.22 =R$ 110.00 / 500 R$ 0.33 =R$ 165.00".
 * Exige o `R$` logo após a quantidade, para não capturar diárias
 * ("06 diárias:R$90,00") nem carretas ("04 carretas de caixas vazias: R$30,00").
 */
export function parseCarregamentoItens(raw: string): CarregamentoItem[] {
  const items: CarregamentoItem[] = [];
  const re =
    /^[ \t]*(\d{2,5})[ \t]*(?:cxs?|caixas?)?[ \t]*r\$[ \t]*([\d.,]+)(?:[ \t]*=[ \t]*r?\$?[ \t]*([\d.,]+))?/gim;
  for (const m of raw.matchAll(re)) {
    const caixas = Number(numBr(m[1]));
    const preco = Number(numBr(m[2]));
    if (!(caixas > 0) || !(preco > 0)) continue;
    const explicito = m[3] ? Number(numBr(m[3])) : NaN;
    const total =
      Number.isFinite(explicito) && explicito > 0
        ? explicito
        : Math.round(caixas * preco * 100) / 100;
    items.push({ caixas, preco, total });
  }
  return items;
}

// A linha inteira em CAIXA ALTA é cabeçalho pré-impresso do formulário
// ("CONTROLE DE REMESSA... FAZENDA MATRICE"), não valor preenchido.
function linhaDe(raw: string, at: number): string {
  const start = raw.lastIndexOf("\n", at) + 1;
  const end = raw.indexOf("\n", at);
  return raw.slice(start, end === -1 ? raw.length : end);
}

function ehCabecalhoImpresso(line: string): boolean {
  return /[A-ZÀ-Ú]/.test(line) && line === line.toUpperCase();
}

// Regex única de "Fazenda": rotulada com dois-pontos ou em início de linha.
const FAZENDA_RE =
  /^[ \t]*fazenda[ \t]*:?[ \t]*([a-zà-ú0-9 ]{2,40})|fazenda[ \t]*:[ \t]*([a-zà-ú0-9 ]{2,40})/gim;

/**
 * Nome da fazenda, ignorando o cabeçalho pré-impresso: numa foto do romaneio
 * de papel o OCR lê "FAZENDA MATRICE" (o destino, impresso no topo) antes de
 * "Fazenda Sato" (a origem, preenchida à mão) — e o destino vencia.
 */
function grabFazenda(raw: string): string | undefined {
  for (const m of raw.matchAll(FAZENDA_RE)) {
    const valor = m[1] ?? m[2];
    if (!valor) continue;
    if (ehCabecalhoImpresso(linhaDe(raw, m.index ?? 0))) continue;
    return valor;
  }
  return undefined;
}

/**
 * Detecta dois apontamentos colados no mesmo bloco (duas fazendas / talhões /
 * pivôs). Dividir automaticamente é arriscado — então avisamos e a conferência
 * humana decide.
 */
export function detectarMultiContexto(raw: string): string[] {
  const avisos: string[] = [];
  const distintos = (re: RegExp, pick: (m: RegExpMatchArray) => string | undefined) =>
    new Set(
      Array.from(raw.matchAll(re), (m) => {
        const v = pick(m);
        if (!v) return "";
        if (ehCabecalhoImpresso(linhaDe(raw, m.index ?? 0))) return "";
        return tidy(v)
          .toLowerCase()
          .replace(/^0+(?=\d)/, "");
      }).filter(Boolean),
    );
  const talhoes = distintos(/talh[aã]o[:\s]*n?[º°]?\s*([0-9]{1,3})/gi, (m) => m[1]);
  const pivos = distintos(/piv[oôó][:\s]*n?[º° o]*\s*([0-9]{1,3})/gi, (m) => m[1]);
  const fazendas = distintos(FAZENDA_RE, (m) => m[1] ?? m[2]);
  const separe = "separe em apontamentos diferentes antes de salvar.";
  if (fazendas.size > 1) avisos.push(`Este bloco cita ${fazendas.size} fazendas — ${separe}`);
  if (talhoes.size > 1) avisos.push(`Este bloco cita ${talhoes.size} talhões — ${separe}`);
  else if (pivos.size > 1) avisos.push(`Este bloco cita ${pivos.size} pivôs — ${separe}`);
  return avisos;
}

// Extrai as linhas de mão de obra do apontamento: diárias ("06 diárias:R$90,00",
// "02 diária alojamento R$90 =R$180", "01 diária fertilirigação R$100") e horas
// ("02 HN R$ 11.25 =R$ 22.5", "01 HE R$ 16.87"). Quando o total explícito (=R$…)
// não vem, calcula qtd × valor unitário. Puro/testável.
export function parseMaoObra(raw: string): MaoObraItem[] {
  const items: MaoObraItem[] = [];
  // A categoria exige 3+ letras: com `[a-zà-ú]+` o "R" de "R$" virava categoria
  // em "01 diária R$ 100,00".
  const diariaRe =
    /(\d{1,3})\s*di[áa]rias?\s*([a-zà-ú]{3,})?[:\s]*r?\$?\s*([\d.,]+)(?:\s*=\s*r?\$?\s*([\d.,]+))?/gi;
  for (const m of raw.matchAll(diariaRe)) {
    const qtd = Number(m[1]);
    const unit = Number(numBr(m[3]));
    if (!(qtd > 0) || !(unit > 0)) continue;
    const total = m[4] ? Number(numBr(m[4])) : qtd * unit;
    const categoria = m[2] ? m[2].toLowerCase() : undefined;
    items.push({
      tipo: "diaria",
      qtd,
      valor_unit: unit,
      total,
      ...(categoria ? { categoria } : {}),
    });
  }
  const horaRe = /(\d{1,3})\s*(HN|HE)\s*r?\$?\s*([\d.,]+)(?:\s*=\s*r?\$?\s*([\d.,]+))?/gi;
  for (const m of raw.matchAll(horaRe)) {
    const qtd = Number(m[1]);
    const unit = Number(numBr(m[3]));
    if (!(qtd > 0) || !(unit > 0)) continue;
    const total = m[4] ? Number(numBr(m[4])) : qtd * unit;
    items.push({ tipo: m[2].toUpperCase(), qtd, valor_unit: unit, total });
  }
  return items;
}

export function parseRomaneio(text: string): ParsedRomaneio {
  const raw = text ?? "";
  const fields: Record<string, string> = {};
  const confidence: Record<string, Confianca> = {};
  const warnings: string[] = [];
  const set = (key: string, value: string | undefined, conf: Confianca) => {
    if (value == null || value === "") return;
    fields[key] = value;
    confidence[key] = conf;
  };
  const lower = raw.toLowerCase();

  // ---- Data ----
  const dataLabel = grab(raw, [/\bdata\b[:\s]*([0-3]?\d\/[0-1]?\d\/\d{2,4})/i]);
  const dataLoose = grab(raw, [/([0-3]?\d\/[0-1]?\d\/\d{4})/]);
  const dataRaw = dataLabel ?? dataLoose;
  if (dataRaw) set("data", dateValue(dataRaw), dataLabel ? "alta" : "media");

  // ---- Fazenda ----
  const fazenda =
    grabFazenda(raw) ??
    grab(raw, [/fazenda[:\s]+([a-zà-ú0-9 ]{2,40})/i]) ??
    grab(raw, [/(?:sa[ií]da\s+para|chegou\s+em)\s+([a-zà-ú ]{3,30})/i]);
  // Corta cauda "… às" (ex.: "saída para Sato às 11:21" → "Sato").
  if (fazenda)
    set(
      "fazenda",
      tidy(fazenda).replace(/\s+[àáa]s$/i, ""),
      /fazenda[:\s]/i.test(raw) ? "alta" : "media",
    );

  // ---- Pivô / Talhão ----
  const pivo = grab(raw, [/piv[oôó][:\s]*n?[º° o]*\s*([0-9]{1,3})/i, /\bpv[:\s]*([0-9]{1,3})/i]);
  if (pivo) set("pivo", pivo, "alta");
  const talhao = grab(raw, [/talh[aã]o[:\s]*n?[º°]?\s*([0-9]{1,3})/i]);
  if (talhao) set("talhao", talhao, "alta");

  // ---- Cultura / Variedade ----
  const cultLabelRaw = grab(raw, [/cultura[:\s]*([a-zà-ú]{3,20})/i]);
  const cultLabel =
    cultLabelRaw && !LABEL_WORDS.has(cultLabelRaw.toLowerCase()) ? cultLabelRaw : undefined;
  const cultKnown = CULTURAS.find((c) => new RegExp(`\\b${c}\\b`, "i").test(raw));
  const cultura = cultLabel ?? cultKnown;
  if (cultura) set("cultura", capitalize(cultura), cultLabel ? "alta" : "media");

  const varLabelRaw = grab(raw, [/variedade[:\s]*([a-zà-ú -]{3,25})/i]);
  const varLabel =
    varLabelRaw && !LABEL_WORDS.has(tidy(varLabelRaw).toLowerCase()) ? varLabelRaw : undefined;
  const varKnown = KNOWN_VARIEDADES.find((v) => lower.includes(v));
  // Fallback p/ variedade fora da lista fixa: token em CAIXA ALTA logo depois da
  // cultura ("881 cxs cebola TAILA"). Confiança baixa — a conferência confirma.
  let varCaps: string | undefined;
  if (cultura) {
    const tok = raw
      .match(new RegExp(`\\b${cultura}\\b\\s+(\\S+)`, "i"))?.[1]
      ?.replace(/[^A-Za-zÀ-Ú]/g, "");
    if (tok && tok.length >= 3 && tok.length <= 15 && tok === tok.toUpperCase()) varCaps = tok;
  }
  if (varLabel) set("variedade", tidy(varLabel), "alta");
  else if (varKnown) set("variedade", varKnown === "vale-sul" ? "vale sul" : varKnown, "media");
  else if (varCaps) set("variedade", varCaps, "baixa");

  // ---- Motorista + Placa ----
  const plateRe = /\b([A-Z]{3}[-\s]?\d[A-Z0-9]\d{2})\b/;
  const mp = raw.match(/([A-Za-zà-ú]{3,})\s+plac?a\s*[-:]?\s*([A-Z]{3}[-\s]?\d[A-Z0-9]\d{2})/i);
  if (mp) {
    set("motorista", tidy(mp[1]), "media");
    set("placa", mp[2].toUpperCase().replace(/\s/g, "-"), "alta");
  } else {
    const plate = grab(raw, [plateRe]);
    if (plate) set("placa", plate.toUpperCase().replace(/\s/g, "-"), "media");
    const mot = grab(raw, [/^([A-Za-zà-ú]{3,})\s+plac?a/im]);
    if (mot) set("motorista", tidy(mot), "baixa");
  }

  // ---- Horários (chegada / saída) ----
  const cheg = raw.match(/chegou\D{0,20}?(\d{1,2})[:.h](\d{2})/i);
  if (cheg) set("hora_chegada", toTime(cheg[1], cheg[2]), "alta");
  const said = raw.match(/sa[ií]da\D{0,20}?(\d{1,2})[:.h](\d{2})/i);
  if (said) set("hora_saida", toTime(said[1], said[2]), "alta");

  // ---- Quantidade + unidade (caixas / beg) ----
  // "Total de caixas:219" (WhatsApp) e "Qtd. Caixas 881" (romaneio impresso).
  const qtdTotal = grab(raw, [
    /total\s+de\s+caixas[:\s]*([\d.,]+)/i,
    /qtd\.?\s*(?:de\s*)?caixas?[:\s]*([\d.,]+)/i,
  ]);
  const qtdInline = raw.match(
    /(?:com|carregan\w*|foi\s+carregan\w*)?\D{0,6}?(\d{2,5})\s*(cxs?|caixas?|beg)/i,
  );
  if (qtdTotal) {
    set("qtd_caixas", numBr(qtdTotal), "alta");
    set("unidade", "cx", "media");
  } else if (qtdInline) {
    set("qtd_caixas", numBr(qtdInline[1]), "alta");
    set("unidade", /beg/i.test(qtdInline[2]) ? "beg" : "cx", "alta");
  }

  // ---- Pesos / média ----
  const pl = grab(raw, [/peso\s*l[ií]quido\D{0,10}?([\d.,]+)/i]);
  if (pl) set("peso_liquido", numBr(pl), "alta");
  const pb = grab(raw, [/peso\s*bruto\D{0,10}?([\d.,]+)/i]);
  if (pb) set("peso_bruto", numBr(pb), "alta");
  // Tara = peso das caixas plásticas vazias (rótulo do romaneio impresso).
  const taraRaw = grab(raw, [
    /\btara\b\D{0,10}?([\d.,]+)/i,
    /peso\s*caixas?\s*pl[áa]sticas?\D{0,10}?([\d.,]+)/i,
  ]);
  if (taraRaw) set("tara", numBr(taraRaw), "alta");
  const media = grab(raw, [/m[eé]dia\D{0,10}?([\d.,]+)/i]);
  if (media) set("media", numBr(media), "alta");

  // ---- Ficou na lavoura ----
  const ficou = grab(raw, [/ficou\s+na\s+lavoura\D{0,10}?(\d{1,5})/i]);
  if (ficou) set("ficou_na_lavoura", numBr(ficou), "alta");

  // ---- Ordem de produção ----
  const ordem = grab(raw, [/ordem\s+de\s+produ[çc][aã]o\D{0,8}?([a-z0-9 ]{3,30})/i]);
  if (ordem) set("ordem_producao", tidy(ordem).toUpperCase(), "media");

  // ---- Números de documento (romaneio impresso e ticket da balança) ----
  // São os identificadores naturais da carga — é por eles que a conciliação
  // amarra a mensagem do WhatsApp, a foto do papel e o ticket na MESMA carga.
  const romaneioLabel = grab(raw, [
    /(?:romaneio|documento)\s*n?[º°o]?\.?[:\s-]*(\d{3,8})/i,
    /n[º°o]\.?\s*d[oe]\s*(?:romaneio|documento)[:\s-]*(\d{3,8})/i,
  ]);
  if (romaneioLabel) set("romaneio_num", docNum(romaneioLabel), "alta");
  else if (/controle\s+de\s+remessa/i.test(raw)) {
    // No formulário pré-impresso o nº fica solto no canto, sem rótulo.
    const solto = Array.from(raw.matchAll(/(?:^|[^\d/.,])(\d{4})(?![\d/.,])/g), (m) => m[1]).find(
      (n) => !/^(19|20)\d{2}$/.test(n),
    );
    if (solto) set("romaneio_num", solto, "baixa");
  }
  const pesagem = grab(raw, [/pesagem\s*n?[º°o]?\.?[:\s-]*(\d{3,8})/i]);
  if (pesagem) set("pesagem_num", docNum(pesagem), "alta");
  const codEntrada = grab(raw, [/cod\.?\s*entrada\s*n?[º°o]?\.?[:\s-]*(\d{1,6})/i]);
  if (codEntrada) set("cod_entrada", docNum(codEntrada), "alta");

  // ---- Ticket impresso da balança ----
  const pesoEntrada = grab(raw, [/peso\s*(?:de\s*)?entrada\D{0,10}?([\d.,]+)/i]);
  if (pesoEntrada) set("peso_entrada", numBr(pesoEntrada), "alta");
  const pesoSaida = grab(raw, [/peso\s*(?:de\s*)?sa[ií]da\D{0,10}?([\d.,]+)/i]);
  if (pesoSaida) set("peso_saida", numBr(pesoSaida), "alta");
  const plFinal = grab(raw, [/peso\s*l[ií]quido\s*final\D{0,10}?([\d.,]+)/i]);
  if (plFinal) set("peso_liquido_final", numBr(plFinal), "alta");
  // "Nº ENTRADA: 08/07/2026 09h54h45" (ticket) ou "Entrada 09:56" (romaneio).
  const entBal =
    raw.match(/n[º°o]\.?\s*entrada[\s\S]{0,30}?(\d{1,2})[h:](\d{2})/i) ??
    raw.match(/\bentrada\b\D{0,8}?(\d{1,2})[h:](\d{2})/i);
  if (entBal) set("hora_entrada_balanca", toTime(entBal[1], entBal[2]), "alta");
  const saiBal = raw.match(/n[º°o]\.?\s*sa[ií]da[\s\S]{0,30}?(\d{1,2})[h:](\d{2})/i);
  if (saiBal) set("hora_saida_balanca", toTime(saiBal[1], saiBal[2]), "alta");

  // ---- Local de descarga ----
  const descarga = grab(raw, [/local\s+d[ae]\s+descarga[:\s]*([a-zà-ú0-9 .-]{3,40})/i]);
  if (descarga) set("local_descarga", tidy(descarga).replace(/^fz\.?\s*/i, "Fazenda "), "alta");

  // ---- Corte / turma / cortadores ----
  const turma = grab(raw, [/turma[^:\n]*:\s*([a-zà-ú ]{3,30})/i]);
  if (turma) set("turma", tidy(turma), "alta");
  const cortadores = grab(raw, [/cortadores?[:\s]*([0-9]{1,4})/i]);
  if (cortadores) set("cortadores", cortadores, "alta");
  const cargaH = raw.match(
    /carga\s+hor[aá]ria\D{0,4}?(\d{1,2})\s*(?:as|às|a)\s*(\d{1,2})[:.h]?(\d{0,2})/i,
  );
  if (cargaH)
    set(
      "carga_horaria",
      `${toTime(cargaH[1], "00")} às ${toTime(cargaH[2], cargaH[3] || "00")}`,
      "media",
    );
  const preco = grab(raw, [/pre[çc]o\s*(?:por|p\/?)?\s*caixa[:\s]*r?\$?\s*([\d.,]+)/i]);
  if (preco) set("preco_caixa", numBr(preco), "alta");
  // Total (R$) do bloco: primeiro "Total…" que NÃO seja "Total de caixas".
  const total = grab(raw, [/total(?!\s+de\s+caixas)[:\s]*r?\$?\s*([\d.,]+)/i]);
  if (total) set("total", numBr(total), "media");

  // ---- Carregamento / chapas / carretas de vazias ----
  const chapas = grabChapas(raw);
  if (chapas) set("chapas", chapas, "alta");
  // Variante sem nº de chapas: as linhas trazem CAIXAS × preço = total.
  const cargaItens = parseCarregamentoItens(raw);
  if (cargaItens.length) {
    const caixasItens = cargaItens.reduce((s, i) => s + i.caixas, 0);
    const totalItens = Math.round(cargaItens.reduce((s, i) => s + i.total, 0) * 100) / 100;
    set("carregamento_itens", JSON.stringify(cargaItens), "media");
    set("carregamento_caixas", String(caixasItens), "media");
    set("carregamento_total", String(totalItens), "media");
    if (!fields.qtd_caixas) set("qtd_caixas", String(caixasItens), "media");
    if (!fields.total) set("total", String(totalItens), "media");
  }
  const carretas = grab(raw, [/(\d{1,3})\s*carretas?\s+de\s+caixas\s+vazias/i]);
  if (carretas) set("carretas_vazias", carretas, "alta");
  // Frete das carretas de vazias: "04 carretas de caixas vazias: R$30,00 / Total:R$120,00".
  const carretaVal = raw.match(
    /carretas?\s+de\s+caixas\s+vazias[:\s]*r?\$?\s*([\d.,]+)(?:[\s\S]{0,20}?total[:\s]*r?\$?\s*([\d.,]+))?/i,
  );
  if (carretaVal) {
    set("preco_carreta", numBr(carretaVal[1]), "media");
    if (carretaVal[2]) set("total_carretas", numBr(carretaVal[2]), "media");
  }

  // ---- Caixas vazias soltas com valor: "02 caixas vazias R$30.00 =R$ 60.00" ----
  const vaziasVal = raw.match(
    /(\d{1,4})\s*caixas?\s*vazias?\D{0,4}r?\$?\s*([\d.,]+)(?:\s*=\s*r?\$?\s*([\d.,]+))?/i,
  );
  if (vaziasVal) {
    set("preco_unit", numBr(vaziasVal[2]), "media");
    if (vaziasVal[3]) set("valor", numBr(vaziasVal[3]), "media");
  }

  // ---- Mão de obra (diárias / HN / HE) ----
  const maoObra = parseMaoObra(raw);
  if (maoObra.length) {
    const totalMO = Math.round(maoObra.reduce((s, i) => s + i.total, 0) * 100) / 100;
    set("mao_obra", JSON.stringify(maoObra), "media");
    set("total_mao_obra", String(totalMO), "media");
  }

  // ---- Detecção do tipo (kind) ----
  // corte/carregamento têm prioridade (mão de obra pode aparecer DENTRO deles e
  // viaja no payload); um bloco só de diárias/horas vira "diarias".
  let kind: RomaneioKind = "desconhecido";
  if (/cortadores?|turma\s/i.test(raw)) kind = "corte";
  else if (/chapas?|carretas?\s+de\s+caixas\s+vazias/i.test(raw) || cargaItens.length)
    kind = "carregamento";
  else if (maoObra.length) kind = "diarias";
  else if (/vazi[ao]s?|plástica|plastica/i.test(raw) && !fields.peso_liquido)
    kind = "caixas-vazias";
  else if (fields.placa || fields.qtd_caixas || fields.peso_liquido) kind = "remessa";
  fields.tipo = kind;

  // ---- Validações (avisos, não bloqueiam; conferência decide) ----
  const q = Number(fields.qtd_caixas);
  const p = Number(fields.peso_liquido);
  const m = Number(fields.media);
  if (q > 0 && p > 0 && m > 0) {
    const esperada = p / q;
    if (Math.abs(esperada - m) / m > 0.05) {
      warnings.push(
        `Média informada (${m}) ≠ peso líquido ÷ caixas (${esperada.toFixed(2)}). Confira os números.`,
      );
    }
  }
  const pbn = Number(fields.peso_bruto);
  const tara = Number(fields.tara);
  if (pbn > 0 && p > 0 && tara > 0 && Math.abs(pbn - tara - p) > Math.max(50, p * 0.02)) {
    warnings.push("Peso líquido ≠ bruto − tara. Confira a balança.");
  }
  // Ticket da balança: entrada − saída deve fechar com o líquido.
  const pe = Number(fields.peso_entrada);
  const ps = Number(fields.peso_saida);
  if (pe > 0 && ps > 0 && p > 0 && Math.abs(pe - ps - p) > Math.max(50, p * 0.02)) {
    warnings.push("Peso líquido ≠ entrada − saída do ticket. Confira a pesagem.");
  }
  // Rasura: o ticket impresso costuma vir com o líquido corrigido à mão.
  if (
    fields.peso_liquido &&
    fields.peso_liquido_final &&
    fields.peso_liquido !== fields.peso_liquido_final
  ) {
    warnings.push("Ticket com correção manual — peso líquido e líquido final divergem. Confira.");
  }
  // Dois apontamentos colados no mesmo bloco: avisa e força a conferência.
  const multi = detectarMultiContexto(raw);
  if (multi.length) {
    warnings.push(...multi);
    for (const k of ["fazenda", "talhao", "pivo"]) if (confidence[k]) confidence[k] = "baixa";
  }
  if (kind === "desconhecido")
    warnings.push("Não deu para identificar o tipo — selecione manualmente.");
  if (!fields.data) warnings.push("Sem data — informe.");

  return { kind, fields, confidence, warnings, raw };
}
