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

const KNOWN_VARIEDADES = ["taila", "vale sul", "vale-sul", "buccaneer", "optima", "regia"];

// Extrai as linhas de mão de obra do apontamento: diárias ("06 diárias:R$90,00",
// "02 diária alojamento R$90 =R$180", "01 diária fertilirigação R$100") e horas
// ("02 HN R$ 11.25 =R$ 22.5", "01 HE R$ 16.87"). Quando o total explícito (=R$…)
// não vem, calcula qtd × valor unitário. Puro/testável.
export function parseMaoObra(raw: string): MaoObraItem[] {
  const items: MaoObraItem[] = [];
  const diariaRe =
    /(\d{1,3})\s*di[áa]rias?\s*([a-zà-ú]+)?[:\s]*r?\$?\s*([\d.,]+)(?:\s*=\s*r?\$?\s*([\d.,]+))?/gi;
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
  if (/\bcebola\b/i.test(raw)) set("cultura", "Cebola", "media");
  const varLabel = grab(raw, [/variedade[:\s]*([a-zà-ú -]{3,25})/i]);
  const varKnown = KNOWN_VARIEDADES.find((v) => lower.includes(v));
  if (varLabel) set("variedade", tidy(varLabel), "alta");
  else if (varKnown) set("variedade", varKnown === "vale-sul" ? "vale sul" : varKnown, "media");

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
  const qtdTotal = grab(raw, [/total\s+de\s+caixas[:\s]*([\d.,]+)/i]);
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
  const chapas = grab(raw, [/chapas?[:\s]*([0-9]{1,3})/i]);
  if (chapas) set("chapas", chapas, "alta");
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
  else if (/chapas?|carretas?\s+de\s+caixas\s+vazias/i.test(raw)) kind = "carregamento";
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
  if (kind === "desconhecido")
    warnings.push("Não deu para identificar o tipo — selecione manualmente.");
  if (!fields.data) warnings.push("Sem data — informe.");

  return { kind, fields, confidence, warnings, raw };
}
