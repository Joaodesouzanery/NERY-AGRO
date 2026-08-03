import {
  AlertTriangle,
  Gauge,
  Heart,
  Layers,
  MapPinned,
  QrCode,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { chartColors } from "@/lib/chart-theme";
import { barras, rosca } from "@/lib/overview/helpers";
import type { ModuleOverviewSpec } from "@/lib/overview/types";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import {
  CATEGORIA_LABEL,
  arrobasCarcaca,
  custoPorArroba,
  margemPorArroba,
  type CategoriaCusto,
} from "@/features/pecuaria/lib/custos";
import {
  DIAS_PESAGEM_ATRASADA,
  diasDesde,
  emCarencia,
  faixaLotacao,
  gmdMedio,
  idadeMeses,
  lotacaoRecomendadaUAha,
  lotacaoUAha,
  ultimoPeso,
} from "@/features/pecuaria/lib/derived";
import {
  PROTOCOLO_LABEL,
  avaliarConformidade,
  coberturaProtocolo,
  ehAnabolizante,
  riscoEmArrobas,
  type Conformidade,
  type Protocolo,
} from "@/features/pecuaria/lib/conformidade";
import {
  dgPendente,
  iepMedioDias,
  nascimentosPorMes,
  previsoesParto,
  taxaPrenhez,
  type EventoRepro,
} from "@/features/pecuaria/lib/reproducao";
import {
  DEFAULT_PEC_CONFIG,
  NDVI_DISPONIVEL,
  type PecConfigPayload,
} from "@/features/pecuaria/lib/apartacao-config";
import { areaHaDoTalhao } from "@/features/pecuaria/lib/pastos";
import type { RentabilidadeLote } from "@/features/pecuaria/hooks/use-rentabilidade";
import {
  FASE_LABEL,
  STATUS_LABEL,
  type Fase,
  type GmdAnimal,
  type PecAnimal,
  type PecEventoReprodutivo,
  type PecEventoSanitario,
  type PecLote,
  type PecMovimentacaoGta,
  type PecOcupacao,
  type PecPesagem,
  type PecProducao,
  type StatusAnimal,
} from "@/features/pecuaria/types/domain";

// Pecuária — 6 abas. A visão geral trazia 4 KPIs (cabeças, lotes, GMD, carência)
// e nenhuma leitura de DINHEIRO, de lotação ou de conformidade: custo/@, margem/@,
// UA/ha e @ fora do prêmio só existiam dentro das respectivas abas. Aqui elas
// sobem para a frente REUSANDO as libs puras do módulo — nada é recalculado:
// custos.ts (custo/@, margem/@, @ de carcaça), derived.ts (GMD, lotação, faixa,
// carência), reproducao.ts (prenhez, IEP, curva de nascimentos) e
// conformidade.ts (cobertura por protocolo, arrobas em risco).
//
// Diferente dos outros módulos, a Pecuária não vive em operation_records: as
// tabelas são normalizadas (pec_*), então o builder recebe as linhas tipadas já
// carregadas pela página. Continua PURO — sem React, sem Supabase.

const ABAS = [
  { id: "lotes", label: "Lotes" },
  { id: "manejo", label: "Manejo" },
  { id: "pastos", label: "Pastos" },
  { id: "rebanho", label: "Rebanho" },
  { id: "resultados", label: "Resultados" },
  { id: "rastreabilidade", label: "Rastreab." },
];

const PROTOCOLOS: Protocolo[] = ["sisbov", "pnib", "eudr", "boi_china", "estradiol"];

export type PecuariaOverviewInput = {
  lotes?: PecLote[];
  animais?: PecAnimal[];
  /** Pesagens já agrupadas por animal (`groupPesagensByAnimal`, em use-pecuaria). */
  pesagensPorAnimal?: Map<string, PecPesagem[]>;
  /** animal_id → linha de v_gmd_animal (`gmdByAnimal`). Sem a view, o GMD sai das pesagens. */
  gmdPorAnimal?: Map<string, GmdAnimal>;
  /** animal_id → libera_em da carência ativa (`carenciaByAnimal`). */
  carenciaPorAnimal?: Map<string, string>;
  sanitarios?: PecEventoSanitario[];
  reprodutivos?: PecEventoReprodutivo[];
  producao?: PecProducao[];
  gta?: PecMovimentacaoGta[];
  ocupacoes?: PecOcupacao[];
  talhoes?: TalhaoRecord[];
  /** Rentabilidade por lote (`useRentabilidadeLotes`) — já traz @, custo/@ e margem/@. */
  rentabilidade?: Map<string, RentabilidadeLote>;
  config?: PecConfigPayload;
  /** Data de referência ISO (default: hoje). Existe para o teste ser determinístico. */
  hoje?: string;
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const nbr = (v: number, casas = 0) => v.toLocaleString("pt-BR", { maximumFractionDigits: casas });

function media(valores: number[]): number | null {
  if (!valores.length) return null;
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

/**
 * `contaPor`/`somaPor` (helpers.ts) só servem a registros com `payload`; aqui as
 * linhas são tipadas (pec_*), então o agrupador recebe o acessor.
 */
function contar<T>(
  itens: T[],
  chave: (item: T) => string,
): Array<{ label: string; total: number }> {
  const mapa = new Map<string, number>();
  for (const item of itens) {
    const k = chave(item).trim() || "Sem informação";
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
}

function somarPor<T>(
  itens: T[],
  chave: (item: T) => string,
  valor: (item: T) => number,
): Array<{ label: string; valor: number }> {
  const mapa = new Map<string, number>();
  for (const item of itens) {
    const k = chave(item).trim() || "Sem informação";
    mapa.set(k, (mapa.get(k) ?? 0) + valor(item));
  }
  return [...mapa.entries()]
    .map(([label, valor]) => ({ label, valor }))
    .filter((x) => x.valor !== 0)
    .sort((a, b) => b.valor - a.valor);
}

/**
 * Donut de semáforo. `DonutChart` pinta a fatia `i` com `colors[i]`, então a
 * ordem do dado É a ordem das cores — ordenar por tamanho (como `contar` faz)
 * pintaria "Em dia" de vermelho. Aqui a ordem é fixa e as fatias zeradas somem
 * junto com a sua cor.
 */
function semaforo(itens: Array<{ label: string; total: number; cor: string }>): {
  data: Array<{ label: string; total: number }>;
  colors: string[];
} {
  const visiveis = itens.filter((i) => i.total > 0);
  return {
    data: visiveis.map(({ label, total }) => ({ label, total })),
    colors: visiveis.map((i) => i.cor),
  };
}

/** "2027-03" → "03/2027" (mesmo formato de mês das outras visões gerais). */
function mesBr(mes: string): string {
  return /^\d{4}-\d{2}$/.test(mes) ? `${mes.slice(5)}/${mes.slice(0, 4)}` : mes;
}

export function buildPecuariaOverview(
  input: PecuariaOverviewInput,
  demoMode: boolean,
): ModuleOverviewSpec {
  const lotes = input.lotes ?? [];
  const animais = input.animais ?? [];
  const pesagensPorAnimal = input.pesagensPorAnimal ?? new Map<string, PecPesagem[]>();
  const gmdPorAnimal = input.gmdPorAnimal ?? new Map<string, GmdAnimal>();
  const carenciaPorAnimal = input.carenciaPorAnimal ?? new Map<string, string>();
  const sanitarios = input.sanitarios ?? [];
  const producao = input.producao ?? [];
  const gta = input.gta ?? [];
  const ocupacoes = input.ocupacoes ?? [];
  const talhoes = input.talhoes ?? [];
  const rentabilidade = input.rentabilidade ?? new Map<string, RentabilidadeLote>();
  const cfg = input.config ?? DEFAULT_PEC_CONFIG;
  const ref = input.hoje ? new Date(`${input.hoje}T00:00:00Z`) : new Date();

  // GMD por animal: prefere a view (v_gmd_animal); sem ela, cai na função pura
  // que calcula a média dos intervalos das pesagens.
  const gmdDoAnimal = (id: string): number | null =>
    gmdPorAnimal.get(id)?.gmd_medio ?? gmdMedio(pesagensPorAnimal.get(id) ?? []);
  const pesoDoAnimal = (id: string): number | null => ultimoPeso(pesagensPorAnimal.get(id) ?? []);

  // ── Rebanho ───────────────────────────────────────────────────────────────
  const ativos = animais.filter((a) => a.status === "ativo");
  const gmdRebanho = media(
    ativos.map((a) => gmdDoAnimal(a.id)).filter((v): v is number => v !== null),
  );
  const pesoMedio = media(
    ativos.map((a) => pesoDoAnimal(a.id)).filter((v): v is number => v !== null),
  );
  const bloqueados = ativos.filter((a) =>
    emCarencia(carenciaPorAnimal.get(a.id) ?? null, ref),
  ).length;

  const faseDoLote = new Map(lotes.map((l) => [l.id, (l.fase as Fase | null) ?? null]));
  const rebanhoPorFase = contar(ativos, (a) => {
    const fase = a.lote_id ? (faseDoLote.get(a.lote_id) ?? null) : null;
    return fase ? FASE_LABEL[fase] : "Sem fase";
  });
  const rebanhoPorCategoria = contar(ativos, (a) => a.categoria ?? "");
  const rebanhoPorStatus = contar(
    animais,
    (a) => STATUS_LABEL[a.status as StatusAnimal] ?? a.status,
  );

  // ── Lotes ─────────────────────────────────────────────────────────────────
  const linhasLote = lotes.map((lote) => {
    const doLote = animais.filter((a) => a.lote_id === lote.id);
    const ativosDoLote = doLote.filter((a) => a.status === "ativo");
    const temCarencia = doLote.some((a) => emCarencia(carenciaPorAnimal.get(a.id) ?? null, ref));
    const ultimaPesagem = doLote
      .flatMap((a) => pesagensPorAnimal.get(a.id) ?? [])
      .map((p) => p.data)
      .sort()
      .at(-1);
    const diasUltimaPesagem = ultimaPesagem ? diasDesde(ultimaPesagem, ref) : null;
    const pesagemAtrasada =
      doLote.length > 0 && (!ultimaPesagem || (diasUltimaPesagem ?? 0) > DIAS_PESAGEM_ATRASADA);
    return {
      lote,
      cabecas: ativosDoLote.length,
      gmd: media(ativosDoLote.map((a) => gmdDoAnimal(a.id)).filter((v): v is number => v !== null)),
      pesagemAtrasada,
      status: temCarencia ? "Carência ativa" : pesagemAtrasada ? "Pesagem atrasada" : "Em dia",
      rent: rentabilidade.get(lote.id) ?? null,
    };
  });
  const lotesAtivos = lotes.filter((l) => !l.encerrado_em).length;
  // O KPI conta o ATRASO em si; no donut o mesmo lote aparece como "Carência
  // ativa" (situações são exclusivas lá), e um lote pode estar nas duas.
  const lotesPesagemAtrasada = linhasLote.filter((l) => l.pesagemAtrasada).length;
  const contarStatus = (status: string) => linhasLote.filter((l) => l.status === status).length;
  const situacaoLotes = semaforo([
    {
      label: "Carência ativa",
      total: contarStatus("Carência ativa"),
      cor: chartColors.destructive,
    },
    {
      label: "Pesagem atrasada",
      total: contarStatus("Pesagem atrasada"),
      cor: chartColors.warning,
    },
    { label: "Em dia", total: contarStatus("Em dia"), cor: chartColors.success },
  ]);

  // ── Resultados (rentabilidade já calculada com custos.ts) ─────────────────
  const rents = [...rentabilidade.values()];
  const totalArrobas = rents.reduce((s, l) => s + l.arrobas, 0);
  const totalCusto = rents.reduce((s, l) => s + l.custoTotal, 0);
  const totalResultado = rents.reduce((s, l) => s + (l.resultado ?? 0), 0);
  const custoMedioArroba = custoPorArroba(totalCusto, totalArrobas);
  const margemMediaArroba = margemPorArroba(cfg.precoArrobaVenda, custoMedioArroba);
  const custoPorCategoria = (Object.keys(CATEGORIA_LABEL) as CategoriaCusto[])
    .map((cat) => ({
      label: CATEGORIA_LABEL[cat],
      total: rents.reduce((s, l) => s + l.porCategoria[cat], 0),
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // ── Pastos (lotação: derived.ts) ──────────────────────────────────────────
  const recomendada = lotacaoRecomendadaUAha(
    cfg.ofertaForragemKgMsHaMes,
    cfg,
    cfg.diasPastejoPeriodo,
  );
  const linhasTalhao = talhoes.map((talhao) => {
    const area = areaHaDoTalhao(talhao);
    const aberta = ocupacoes.find((o) => o.talhao_id === talhao.id && !o.data_saida) ?? null;
    const lote = aberta ? (lotes.find((l) => l.id === aberta.lote_id) ?? null) : null;
    const doLote = lote ? animais.filter((a) => a.lote_id === lote.id && a.status === "ativo") : [];
    const pesoVivoKg = doLote.reduce((s, a) => s + (pesoDoAnimal(a.id) ?? 0), 0);
    const uaHa = area && pesoVivoKg > 0 ? lotacaoUAha(pesoVivoKg, area, cfg.pesoUAkg) : null;
    const cultura = (talhao.payload.cultura ?? "").toLowerCase();
    return {
      talhao,
      area,
      ocupado: Boolean(aberta),
      uaHa,
      emLavoura: !aberta && cultura !== "" && !cultura.includes("past"),
    };
  });
  const ocupados = linhasTalhao.filter((l) => l.ocupado);
  const superlotados = ocupados.filter((l) => faixaLotacao(l.uaHa).id === "superlotado").length;
  const lotacaoMedia = media(ocupados.map((l) => l.uaHa).filter((v): v is number => v !== null));
  const areaEmPasto = ocupados.reduce((s, l) => s + (l.area ?? 0), 0);
  // Mesmas cores da legenda do mapa da aba Pastos (pasto verde, lavoura âmbar,
  // descanso cinza) — por isso a ordem é fixa, não a do maior para o menor.
  const usoDoSolo = semaforo([
    { label: "Pasto (ocupado)", total: ocupados.length, cor: chartColors.success },
    {
      label: "Lavoura",
      total: linhasTalhao.filter((l) => l.emLavoura).length,
      cor: chartColors.warning,
    },
    {
      label: "Descanso",
      total: linhasTalhao.filter((l) => !l.ocupado && !l.emLavoura).length,
      cor: chartColors.mutedFg,
    },
  ]);

  // ── Manejo: sanidade + reprodução + produção ──────────────────────────────
  const eventosRepro: EventoRepro[] = (input.reprodutivos ?? []).map((e) => ({
    animal_id: e.animal_id,
    tipo: e.tipo,
    resultado: e.resultado,
    data: e.data,
  }));
  const prenhez = taxaPrenhez(eventosRepro);
  const dgsPendentes = dgPendente(eventosRepro).length;
  const iep = iepMedioDias(eventosRepro);
  // `nascimentosPorMes` devolve o mês em ISO ("2027-03") já ordenado; a tela
  // mostra em pt-BR, como os outros módulos.
  const curvaNascimentos = nascimentosPorMes(previsoesParto(eventosRepro)).map((n) => ({
    mes: mesBr(n.mes),
    total: n.total,
  }));
  const carenciasAtivas = sanitarios.filter((e) => emCarencia(e.libera_em, ref)).length;
  const sanidadePorTipo = contar(sanitarios, (e) => e.tipo ?? "");
  const producaoPorProduto = somarPor(
    producao,
    (r) => r.produto,
    (r) => r.quantidade,
  );

  // ── Rastreabilidade (conformidade.ts) ─────────────────────────────────────
  const comAnabolizante = new Set<string>();
  for (const e of sanitarios) {
    if (e.animal_id && ehAnabolizante(e.produto)) comAnabolizante.add(e.animal_id);
  }
  const avaliacoes = animais
    .filter((a) => a.status === "ativo" || a.status === "apto_abate")
    .map((animal) => {
      const peso = pesoDoAnimal(animal.id);
      return {
        conformidade: avaliarConformidade(animal, {
          temAnabolizante: comAnabolizante.has(animal.id),
          idadeMesesNoAbate: idadeMeses(animal.nascimento, ref),
        }),
        arrobas: peso ? arrobasCarcaca(peso, cfg.rendimentoCarcacaPct) : 0,
      };
    });
  const conformidades: Conformidade[] = avaliacoes.map((a) => a.conformidade);
  const riscos = riscoEmArrobas(avaliacoes);
  const arrobasEmRisco = riscos.reduce((s, r) => s + r.arrobas, 0);
  // `riscos` soma POR PROTOCOLO: o mesmo animal pendente em SISBOV e EUDR conta
  // duas vezes (mesma leitura da aba Rastreabilidade). Somar `r.animais` daria
  // mais "animais" do que o rebanho tem — o hint conta cabeças distintas.
  const pendenciasTotal = riscos.reduce((s, r) => s + r.animais, 0);
  const animaisComPendencia = conformidades.filter((c) =>
    PROTOCOLOS.some((p) => c[p] === "pendente"),
  ).length;
  const gtaSemNfe = gta.filter((g) => !g.nfe_vinculada?.trim()).length;
  const coberturas = PROTOCOLOS.map((p) => ({ p, c: coberturaProtocolo(conformidades, p) }))
    .filter((x) => x.c.total > 0)
    .map((x) => ({ label: PROTOCOLO_LABEL[x.p], valor: Math.round(x.c.pct * 1000) / 10 }));

  return {
    moduleId: "pecuaria",
    moduleLabel: "Pecuária",
    tabs: ABAS,
    demoMode,
    kpis: [
      {
        label: "Resultado do período",
        value: brl(totalResultado),
        icon: Wallet,
        hint: `${nbr(totalArrobas, 1)} @ produzidas`,
        trendDir: totalResultado >= 0 ? "up" : "down",
        tabId: "resultados",
      },
      {
        label: "Custo/@",
        value: custoMedioArroba !== null ? brl(custoMedioArroba) : "—",
        icon: Gauge,
        hint: `${brl(totalCusto)} acumulados`,
        tabId: "resultados",
      },
      {
        label: "Margem/@",
        value: margemMediaArroba !== null ? brl(margemMediaArroba) : "—",
        icon: TrendingUp,
        hint:
          cfg.precoArrobaVenda === null
            ? "Informe o preço da arroba em Configurações"
            : `@ a ${brl(cfg.precoArrobaVenda)}`,
        trendDir: margemMediaArroba === null ? undefined : margemMediaArroba >= 0 ? "up" : "down",
        tabId: "resultados",
      },
      {
        label: "Cabeças ativas",
        value: nbr(ativos.length),
        icon: QrCode,
        hint: pesoMedio !== null ? `${nbr(pesoMedio)} kg de peso médio` : undefined,
        tabId: "rebanho",
      },
      {
        label: "GMD médio do rebanho",
        value: gmdRebanho !== null ? `${nbr(gmdRebanho, 2)} kg/dia` : "—",
        icon: TrendingUp,
        tabId: "rebanho",
      },
      { label: "Lotes ativos", value: lotesAtivos, icon: Layers, tabId: "lotes" },
      {
        label: "Lotes sem pesagem recente",
        value: lotesPesagemAtrasada,
        icon: AlertTriangle,
        hint: `mais de ${DIAS_PESAGEM_ATRASADA} dias sem pesar`,
        trendDir: lotesPesagemAtrasada ? "down" : "up",
        tabId: "lotes",
      },
      {
        label: "Bloqueados por carência",
        value: bloqueados,
        icon: Heart,
        hint: carenciasAtivas ? `${carenciasAtivas} protocolos em carência` : "nenhum bloqueio",
        trendDir: bloqueados ? "down" : "up",
        tabId: "manejo",
      },
      {
        label: "Taxa de prenhez",
        value: prenhez !== null ? `${nbr(prenhez * 100, 1)}%` : "—",
        icon: Heart,
        hint:
          iep !== null
            ? `IEP médio ${nbr(iep)} dias`
            : dgsPendentes
              ? `${dgsPendentes} DG pendentes`
              : undefined,
        tabId: "manejo",
      },
      {
        label: "Talhões superlotados",
        value: superlotados,
        icon: Sprout,
        hint: `${ocupados.length} de ${talhoes.length} talhões ocupados`,
        trendDir: superlotados ? "down" : "up",
        tabId: "pastos",
      },
      {
        label: "Lotação média",
        value: lotacaoMedia !== null ? `${nbr(lotacaoMedia, 2)} UA/ha` : "—",
        icon: MapPinned,
        // A recomendada vem da oferta de forragem INFORMADA pelo gestor, não de
        // NDVI (não existe fonte no sistema). A aba Pastos carimba "estimativa"
        // no mesmo número — o dashboard não pode prometer mais que a aba.
        hint:
          recomendada !== null
            ? `recomendada ${nbr(recomendada, 2)} UA/ha${
                NDVI_DISPONIVEL ? "" : " (estimativa)"
              } · ${nbr(areaEmPasto)} ha em pasto`
            : `${nbr(areaEmPasto)} ha em pasto`,
        tabId: "pastos",
      },
      {
        label: "@ fora do prêmio",
        value: nbr(arrobasEmRisco),
        icon: ShieldCheck,
        hint: `${nbr(pendenciasTotal)} pendências em ${nbr(animaisComPendencia)} animais`,
        trendDir: arrobasEmRisco ? "down" : "up",
        tabId: "rastreabilidade",
      },
      {
        label: "GTA sem NF-e",
        value: gtaSemNfe,
        icon: Truck,
        hint: "NT 2024.003",
        trendDir: gtaSemNfe ? "down" : "up",
        tabId: "rastreabilidade",
      },
    ],
    charts: [
      barras({
        id: "pecuaria-resultado-lote",
        tabId: "resultados",
        title: "Resultado por lote",
        description: "Margem/@ × @ produzidas, lote a lote",
        featured: true,
        layout: "vertical",
        format: "brl",
        nome: "Resultado",
        limite: 10,
        data: linhasLote
          .filter((l) => l.rent !== null && l.rent.resultado !== null)
          .map((l) => ({ label: l.lote.nome, valor: l.rent?.resultado ?? 0 }))
          .sort((a, b) => b.valor - a.valor),
      }),
      rosca({
        id: "pecuaria-rebanho-fase",
        tabId: "rebanho",
        title: "Rebanho por fase",
        description: "Cabeças ativas por fase do lote",
        featured: true,
        nome: "Cabeças",
        data: rebanhoPorFase,
      }),
      barras({
        id: "pecuaria-lotacao-talhao",
        tabId: "pastos",
        title: "Lotação por talhão ocupado",
        description: "UA/ha atual — acima de 1,9 é superlotação",
        featured: true,
        layout: "vertical",
        nome: "UA/ha",
        limite: 10,
        data: ocupados
          .filter((l) => l.uaHa !== null)
          .map((l) => ({
            label: l.talhao.payload.talhao ?? "Sem nome",
            valor: Math.round((l.uaHa as number) * 100) / 100,
          }))
          .sort((a, b) => b.valor - a.valor),
      }),
      rosca({
        id: "pecuaria-custo-categoria",
        tabId: "resultados",
        title: "Custo por categoria",
        description: "Onde o dinheiro do rebanho é gasto",
        format: "brl",
        nome: "Custo",
        data: custoPorCategoria,
      }),
      barras({
        id: "pecuaria-gmd-lote",
        tabId: "lotes",
        title: "GMD médio por lote",
        description: "Ganho médio diário dos animais ativos",
        layout: "vertical",
        nome: "kg/dia",
        limite: 10,
        data: linhasLote
          .filter((l) => l.gmd !== null)
          .map((l) => ({ label: l.lote.nome, valor: Math.round((l.gmd as number) * 100) / 100 }))
          .sort((a, b) => b.valor - a.valor),
      }),
      rosca({
        id: "pecuaria-lotes-status",
        tabId: "lotes",
        title: "Lotes por situação",
        description: "Carência ativa, pesagem atrasada ou em dia",
        nome: "Lotes",
        colors: situacaoLotes.colors,
        data: situacaoLotes.data,
      }),
      barras({
        id: "pecuaria-sanidade-tipo",
        tabId: "manejo",
        title: "Protocolos sanitários por tipo",
        layout: "vertical",
        nome: "Eventos",
        limite: 8,
        data: sanidadePorTipo.map((c) => ({ label: c.label, valor: c.total })),
      }),
      {
        id: "pecuaria-nascimentos",
        tabId: "manejo",
        title: "Nascimentos previstos por mês",
        description: "DG positivo + 285 dias de gestação",
        kind: "trend",
        area: true,
        xKey: "mes",
        series: [{ key: "total", name: "Bezerros previstos" }],
        data: curvaNascimentos,
        emptyTitle: "Sem gestação confirmada",
        emptyDescription: "Registre DG positivo em Manejo → Reprodução.",
      },
      barras({
        id: "pecuaria-producao-produto",
        tabId: "manejo",
        title: "Produção por produto",
        description: "Leite, ovos, mel — acumulado registrado",
        layout: "vertical",
        nome: "Quantidade",
        limite: 8,
        data: producaoPorProduto,
      }),
      barras({
        id: "pecuaria-rebanho-categoria",
        tabId: "rebanho",
        title: "Cabeças por categoria",
        layout: "vertical",
        nome: "Cabeças",
        limite: 8,
        data: rebanhoPorCategoria.map((c) => ({ label: c.label, valor: c.total })),
      }),
      rosca({
        id: "pecuaria-rebanho-status",
        tabId: "rebanho",
        title: "Rebanho por status",
        description: "Ativo, apto ao abate, vendido e morto",
        nome: "Animais",
        data: rebanhoPorStatus,
      }),
      rosca({
        id: "pecuaria-uso-solo",
        tabId: "pastos",
        title: "Talhões por uso do solo",
        nome: "Talhões",
        colors: usoDoSolo.colors,
        data: usoDoSolo.data,
      }),
      barras({
        id: "pecuaria-conformidade",
        tabId: "rastreabilidade",
        title: "Cobertura por protocolo",
        description: "% de animais conformes (ignora os não avaliáveis)",
        layout: "vertical",
        format: "pct",
        nome: "Conformes",
        data: coberturas,
      }),
      barras({
        id: "pecuaria-risco-arrobas",
        tabId: "rastreabilidade",
        title: "@ em risco por protocolo",
        description: "Arrobas de carcaça que ficam fora do mercado premium",
        layout: "vertical",
        nome: "@",
        data: riscos.map((r) => ({
          label: PROTOCOLO_LABEL[r.protocolo],
          valor: Math.round(r.arrobas),
        })),
      }),
    ],
    tables: [
      ...(rents.length
        ? [
            {
              id: "pecuaria-detalhe-lote",
              tabId: "resultados",
              title: "Detalhe por lote",
              description: "Cabeças, arrobas produzidas, custo/@ e resultado",
              // "Cabeças ativas" (e não "Cabeças") de propósito: a tabela da aba
              // Resultados conta TODO animal que passou pelo lote. Rótulos
              // diferentes evitam dois números divergentes sob o mesmo nome.
              head: ["Lote", "Cabeças ativas", "@ produzidas", "Custo/@", "Resultado"],
              body: linhasLote
                .filter((l) => l.rent !== null)
                .sort((a, b) => (b.rent?.resultado ?? 0) - (a.rent?.resultado ?? 0))
                .slice(0, 8)
                .map((l) => [
                  l.lote.nome,
                  l.cabecas,
                  nbr(l.rent?.arrobas ?? 0, 1),
                  l.rent?.custoArroba !== null && l.rent?.custoArroba !== undefined
                    ? brl(l.rent.custoArroba)
                    : "—",
                  l.rent?.resultado !== null && l.rent?.resultado !== undefined
                    ? brl(l.rent.resultado)
                    : "—",
                ]),
            },
          ]
        : []),
      ...(riscos.length
        ? [
            {
              id: "pecuaria-pendencias",
              tabId: "rastreabilidade",
              title: "Pendências de conformidade",
              description: "O que recuperar para voltar ao prêmio",
              head: ["Protocolo", "Animais", "@ em risco"],
              body: riscos.map((r) => [PROTOCOLO_LABEL[r.protocolo], r.animais, nbr(r.arrobas, 1)]),
            },
          ]
        : []),
    ],
  };
}
