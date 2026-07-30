import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  ClipboardList,
  Package,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { chartColors } from "@/lib/chart-theme";
import {
  buildTalhaoInsumosResumo,
  custoMovimentacao,
  custoUnitarioMedio,
  formatDate,
  formatQtd,
  num,
  reservaAtiva,
} from "@/features/insumos/lib/estoque";
import {
  movimentacaoTipoLabel,
  type InsumosModel,
  type LoteRecord,
  type LoteResumo,
  type MovimentacaoRecord,
  type MovimentacaoTipo,
} from "@/features/insumos/types/domain";
import { barras, contaPor, rosca } from "@/lib/overview/helpers";
import type { ModuleOverviewSpec, OverviewTable } from "@/lib/overview/types";

// Insumos — a página não tem abas, tem painéis; as "abas" aqui são as seções que
// ela já mostra. Nenhum número é recalculado: buildInsumosModel já devolve
// saldo/reservado/disponível/valor por lote e os alertas, custoMovimentacao
// resolve o custo de cada baixa e buildTalhaoInsumosResumo separa previsto
// (reserva) de realizado (saída) por talhão. Aqui só se agrega e se dá formato.

const ABAS = [
  { id: "estoque", label: "Estoque por insumo" },
  { id: "lotes", label: "Lotes e validade" },
  { id: "reservas", label: "Reservas ativas" },
  { id: "categorias", label: "Valor por categoria" },
  { id: "talhoes", label: "Custo por talhão" },
  { id: "movimentacoes", label: "Movimentações" },
  { id: "alertas", label: "Alertas" },
];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const arredonda = (v: number) => Math.round(v * 100) / 100;

/** Página monta o spec antes de saber se a consulta voltou — módulo vazio é estado válido. */
const MODELO_VAZIO: InsumosModel = {
  insumos: [],
  movimentacoes: [],
  alertas: [],
  valorEmEstoque: 0,
  valorReservado: 0,
  lotesAVencer: 0,
  lotesVencidos: 0,
};

// Faixas de validade em ordem de urgência. O corte de 30 dias é o mesmo que
// buildAlertas usa para "validade crítica" — as duas leituras têm de bater.
const FAIXAS_VALIDADE = [
  { label: "Vencido", ate: -1 },
  { label: "≤ 30 dias", ate: 30 },
  { label: "31–90 dias", ate: 90 },
  { label: "91–180 dias", ate: 180 },
  { label: "180+ dias", ate: Infinity },
];

/** Capital parado em cada faixa de validade — o que está prestes a virar perda. */
function valorPorValidade(lotes: LoteResumo[]): Array<{ label: string; valor: number }> {
  const mapa = new Map<string, number>();
  let semValidade = 0;
  for (const item of lotes) {
    const dias = item.diasParaVencer;
    if (dias === undefined) {
      semValidade += item.valorEmEstoque;
      continue;
    }
    // A última faixa é Infinity, então sempre casa.
    const faixa = FAIXAS_VALIDADE.find((f) => dias <= f.ate);
    if (faixa) mapa.set(faixa.label, (mapa.get(faixa.label) ?? 0) + item.valorEmEstoque);
  }
  const faixas = FAIXAS_VALIDADE.map((f) => ({
    label: f.label,
    valor: arredonda(mapa.get(f.label) ?? 0),
  }));
  if (semValidade > 0) faixas.push({ label: "Sem validade", valor: arredonda(semValidade) });
  return faixas.filter((f) => f.valor > 0);
}

// Prefixo sentinela do talhão que só tem nome. belongsToTalhao compara
// `payload.talhao_id === talhao.id`, e o formulário grava talhao_id "" quando
// não há talhão — um id vazio casaria com TODA movimentação sem talhão.
const TALHAO_SEM_ID = "insumos-talhao-sem-id:";

/** Previsto (reservas) × realizado (saídas) por talhão, via buildTalhaoInsumosResumo. */
function custoPorTalhao(model: InsumosModel, lotes: LoteRecord[]) {
  const comId = new Map<string, string | undefined>();
  const nomesComId = new Set<string>();
  const soNome = new Set<string>();
  for (const mov of model.movimentacoes) {
    const id = (mov.payload.talhao_id ?? "").trim();
    const nome = (mov.payload.talhao ?? "").trim();
    if (id) {
      // Guarda o primeiro nome NÃO VAZIO do id (`get` também cobre "ainda não
      // existe"). Se o grupo ficasse sem nome, belongsToTalhao não reconheceria
      // as movimentações que só têm o nome — e elas já não formam grupo próprio,
      // por causa de nomesComId. O custo delas sumiria do gráfico.
      if (!comId.get(id)) comId.set(id, nome || undefined);
      if (nome) nomesComId.add(nome);
    } else if (nome) {
      soNome.add(nome);
    }
  }
  const alvos = [
    ...[...comId.entries()].map(([id, nome]) => ({ id, nome })),
    // Nome já coberto por um grupo com id contaria duas vezes: belongsToTalhao
    // aceita o nome quando a movimentação não tem id.
    ...[...soNome]
      .filter((nome) => !nomesComId.has(nome))
      .map((nome) => ({ id: TALHAO_SEM_ID + nome, nome })),
  ];
  return alvos
    .map((talhao) => {
      const resumo = buildTalhaoInsumosResumo(model, lotes, talhao);
      return {
        label: talhao.nome || talhao.id.slice(0, 8),
        previsto: arredonda(resumo.custoPrevisto),
        realizado: arredonda(resumo.custoRealizado),
      };
    })
    .filter((t) => t.previsto > 0 || t.realizado > 0)
    .sort((a, b) => b.realizado + b.previsto - (a.realizado + a.previsto));
}

/** Consumo (saídas) por mês — a única leitura de tendência que o módulo tem. */
function consumoMensal(
  aplicacoes: MovimentacaoRecord[],
  custo: (mov: MovimentacaoRecord) => number,
) {
  const mapa = new Map<string, number>();
  for (const mov of aplicacoes) {
    const mes = String(mov.payload.data ?? "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(mes)) continue;
    mapa.set(mes, (mapa.get(mes) ?? 0) + custo(mov));
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([mes, valor]) => ({
      label: `${mes.slice(5)}/${mes.slice(0, 4)}`,
      valor: arredonda(valor),
    }));
}

/** Soma valores já calculados agrupando por rótulo (categoria, local…). */
function agrupar(items: Array<{ label: string; valor: number }>) {
  const mapa = new Map<string, number>();
  for (const item of items) {
    if (item.valor <= 0) continue;
    mapa.set(item.label, (mapa.get(item.label) ?? 0) + item.valor);
  }
  return [...mapa.entries()]
    .map(([label, valor]) => ({ label, valor: arredonda(valor) }))
    .sort((a, b) => b.valor - a.valor);
}

const rotuloTipo = (tipo: string) => movimentacaoTipoLabel[tipo as MovimentacaoTipo] ?? tipo;

export function buildInsumosOverview(
  model: InsumosModel | null,
  lotes: LoteRecord[],
  demoMode: boolean,
): ModuleOverviewSpec {
  const m = model ?? MODELO_VAZIO;
  const reservas = m.movimentacoes.filter(reservaAtiva);
  const aplicacoes = m.movimentacoes.filter((mov) => mov.payload.tipo === "saida");
  const perdas = m.movimentacoes.filter((mov) => mov.payload.tipo === "perda");

  // custoMovimentacao cai no custo médio do insumo quando a baixa não tem lote.
  const custoMedio = new Map(m.insumos.map((r) => [r.insumo.id, custoUnitarioMedio(r)]));
  const custo = (mov: MovimentacaoRecord) =>
    custoMovimentacao(mov, lotes, custoMedio.get(mov.payload.insumo_id));

  const custoAplicado = aplicacoes.reduce((s, mov) => s + custo(mov), 0);
  const valorPerdido = perdas.reduce((s, mov) => s + custo(mov), 0);
  const emFalta = m.insumos.filter((r) => r.abaixoDoMinimo);
  const criticos = m.alertas.filter((a) => a.severidade === "critico").length;

  const lotesComSaldo = m.insumos.flatMap((r) => r.lotes).filter((i) => i.saldoFisico > 0);
  const vencidos = lotesComSaldo.filter((i) => i.vencido);
  const valorVencido = vencidos.reduce((s, i) => s + i.valorEmEstoque, 0);

  const porCategoria = agrupar(
    m.insumos.map((r) => ({
      label: r.insumo.payload.categoria || "Outros",
      valor: r.valorEmEstoque,
    })),
  );
  const porLocal = agrupar(
    lotesComSaldo.map((i) => ({
      label: i.lote.payload.local || "Sem local",
      valor: i.valorEmEstoque,
    })),
  );
  const porInsumo = agrupar(
    m.insumos.map((r) => ({ label: r.insumo.payload.nome, valor: r.valorEmEstoque })),
  );
  // Cobertura = disponível em % do mínimo. Percentual porque os insumos têm
  // unidades diferentes (L, sc, t) — comparar quantidade crua não diz nada.
  const cobertura = m.insumos
    .filter((r) => num(r.insumo.payload.estoque_minimo) > 0)
    .map((r) => ({
      label: r.insumo.payload.nome,
      valor: arredonda((r.disponivel / num(r.insumo.payload.estoque_minimo)) * 100),
    }))
    .sort((a, b) => a.valor - b.valor);

  const talhoes = custoPorTalhao(m, lotes);
  const severidades = [
    { label: "Críticos", total: criticos, cor: chartColors.destructive },
    { label: "Atenção", total: m.alertas.length - criticos, cor: chartColors.warning },
  ].filter((s) => s.total > 0);

  const tabelas: OverviewTable[] = [];
  if (emFalta.length) {
    tabelas.push({
      id: "insumos-ruptura",
      tabId: "estoque",
      title: "Ruptura iminente",
      description: "Disponível abaixo do mínimo — quanto falta comprar",
      head: ["Insumo", "Disponível", "Mínimo", "Comprar"],
      body: emFalta
        .map((r) => {
          const minimo = num(r.insumo.payload.estoque_minimo);
          const unidade = r.insumo.payload.unidade || "un";
          return {
            falta: minimo - r.disponivel,
            linha: [
              r.insumo.payload.nome,
              `${formatQtd(r.disponivel)} ${unidade}`,
              `${formatQtd(minimo)} ${unidade}`,
              `${formatQtd(arredonda(minimo - r.disponivel))} ${unidade}`,
            ] as string[],
          };
        })
        .sort((a, b) => b.falta - a.falta)
        .slice(0, 8)
        .map((x) => x.linha),
    });
  }
  if (vencidos.length) {
    tabelas.push({
      id: "insumos-vencidos",
      tabId: "lotes",
      title: "Lotes vencidos com saldo",
      description: "Estoque a bloquear ou descartar",
      head: ["Lote", "Validade", "Saldo", "Valor"],
      body: vencidos
        .slice()
        .sort((a, b) => b.valorEmEstoque - a.valorEmEstoque)
        .slice(0, 8)
        .map((i) => [
          i.lote.payload.numero || i.lote.id.slice(0, 8),
          formatDate(i.lote.payload.validade),
          formatQtd(i.saldoFisico),
          brl(i.valorEmEstoque),
        ]),
    });
  }

  return {
    moduleId: "insumos",
    moduleLabel: "Insumos",
    tabs: ABAS,
    demoMode,
    kpis: [
      {
        label: "Valor em estoque",
        value: brl(m.valorEmEstoque),
        icon: Wallet,
        hint: `${m.insumos.length} insumos no catálogo`,
        tabId: "estoque",
      },
      {
        label: "Abaixo do mínimo",
        value: emFalta.length,
        icon: AlertTriangle,
        hint: "Risco de parar a operação",
        trendDir: emFalta.length ? "down" : "up",
        tabId: "estoque",
      },
      {
        label: "Reservado",
        value: brl(m.valorReservado),
        icon: ClipboardList,
        hint: `${reservas.length} reservas ativas`,
        tabId: "reservas",
      },
      {
        label: "Lotes a vencer",
        value: m.lotesAVencer,
        icon: CalendarClock,
        trend: m.lotesAVencer ? "≤30 dias" : "ok",
        trendDir: m.lotesAVencer ? "down" : "up",
        tabId: "lotes",
      },
      {
        label: "Valor vencido",
        value: brl(valorVencido),
        icon: AlertTriangle,
        hint: `${m.lotesVencidos} lotes com saldo`,
        trendDir: valorVencido ? "down" : "up",
        tabId: "lotes",
      },
      {
        label: "Alertas críticos",
        value: criticos,
        icon: AlertTriangle,
        hint: `${m.alertas.length} alertas no total`,
        trendDir: criticos ? "down" : "up",
        tabId: "alertas",
      },
      {
        label: "Custo aplicado",
        value: brl(custoAplicado),
        icon: Package,
        hint: `${aplicacoes.length} saídas para o campo`,
        tabId: "talhoes",
      },
      {
        label: "Capital concentrado",
        value: porCategoria[0]?.label ?? "—",
        icon: Boxes,
        hint: porCategoria[0] ? brl(porCategoria[0].valor) : "Sem estoque valorado",
        tabId: "categorias",
      },
      {
        label: "Perdas registradas",
        value: brl(valorPerdido),
        icon: TrendingDown,
        hint: `${perdas.length} baixas por perda/avaria`,
        trendDir: valorPerdido ? "down" : "up",
        tabId: "movimentacoes",
      },
    ],
    charts: [
      barras({
        id: "insumos-validade",
        tabId: "lotes",
        title: "Capital em estoque por validade",
        description: "Quanto dinheiro está prestes a vencer",
        featured: true,
        format: "brl",
        nome: "Valor",
        data: valorPorValidade(lotesComSaldo),
      }),
      {
        id: "insumos-talhao-custo",
        tabId: "talhoes",
        title: "Custo de insumo por talhão",
        description: "Reservado (previsto) × aplicado (realizado)",
        featured: true,
        kind: "bars",
        layout: "vertical",
        format: "brl",
        xKey: "label",
        series: [
          { key: "realizado", name: "Aplicado", color: chartColors.primary },
          { key: "previsto", name: "Reservado", color: chartColors.warning },
        ],
        data: talhoes.slice(0, 8),
      },
      rosca({
        id: "insumos-valor-categoria",
        tabId: "categorias",
        title: "Capital parado por categoria",
        description: "Onde o dinheiro do estoque está",
        featured: true,
        format: "brl",
        nome: "Valor",
        data: porCategoria.slice(0, 8).map((c) => ({ label: c.label, total: c.valor })),
      }),
      barras({
        id: "insumos-cobertura-minimo",
        tabId: "estoque",
        title: "Cobertura do estoque mínimo",
        description: "Disponível em % do mínimo — abaixo de 100% é ruptura",
        layout: "vertical",
        format: "pct",
        nome: "Cobertura",
        limite: 8,
        data: cobertura,
      }),
      barras({
        id: "insumos-valor-insumo",
        tabId: "estoque",
        title: "Valor em estoque por insumo",
        layout: "vertical",
        format: "brl",
        nome: "Valor",
        limite: 8,
        data: porInsumo,
      }),
      barras({
        id: "insumos-valor-local",
        tabId: "lotes",
        title: "Valor por local de armazenamento",
        layout: "vertical",
        format: "brl",
        nome: "Valor",
        limite: 8,
        data: porLocal,
      }),
      rosca({
        id: "insumos-reservas-operacao",
        tabId: "reservas",
        title: "Reservas ativas por operação",
        nome: "Reservas",
        data: contaPor(reservas, "operacao", "Sem operação"),
      }),
      rosca({
        id: "insumos-alertas-severidade",
        tabId: "alertas",
        title: "Alertas por severidade",
        nome: "Alertas",
        colors: severidades.map((s) => s.cor),
        data: severidades.map((s) => ({ label: s.label, total: s.total })),
      }),
      rosca({
        id: "insumos-mov-tipo",
        tabId: "movimentacoes",
        title: "Movimentações por tipo",
        nome: "Movimentações",
        data: contaPor(m.movimentacoes, "tipo").map((c) => ({
          label: rotuloTipo(c.label),
          total: c.total,
        })),
      }),
      {
        id: "insumos-consumo-mes",
        tabId: "movimentacoes",
        title: "Consumo mensal",
        description: "Custo das saídas para o campo",
        kind: "trend",
        area: true,
        format: "brl",
        xKey: "label",
        series: [{ key: "valor", name: "Consumo" }],
        data: consumoMensal(aplicacoes, custo),
      },
    ],
    tables: tabelas.length ? tabelas : undefined,
  };
}
