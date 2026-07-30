import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  FileText,
  MapPinned,
  Package,
  Sprout,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { chartColors } from "@/lib/chart-theme";
import { barras, num, rosca } from "@/lib/overview/helpers";
import type { ModuleOverviewSpec } from "@/lib/overview/types";
import type { TalhaoInsumosResumo } from "@/features/insumos/lib/estoque";
import {
  CADASTRO_SECTIONS,
  cadastroSectionFilled,
} from "@/features/talhao-360/lib/cadastro-sections";
import { REPORT_MODELS, type ReportModelId } from "@/features/talhao-360/lib/report-models";
import { normalizeFarmName } from "@/features/talhao-360/lib/farm-name";
import { parsePolygon, polygonAreaHa, polygonPoints } from "@/features/talhao-360/map/geometry";
import type {
  FieldAlert,
  Talhao360Model,
  TalhaoCycle,
  TimelineEvent,
} from "@/features/talhao-360/types/domain";

// Talhão 360° — aqui a "visão geral" é de UM talhão, não do módulo inteiro: as
// abas são as seções do 360 (cadastro, safras, insumos, mapa, timeline, alertas,
// relatórios). A tela antiga mostrava 4 cartões e três painéis de texto; os
// números que decidem manejo (produtividade realizada × esperada, custo/ha
// realizado × plano, custo de insumo por categoria, alerta crítico em aberto)
// ficavam cada um escondido dentro da sua aba.
//
// Nada é recalculado: ciclos vêm de parseCycles (services), insumos de
// buildTalhaoInsumosResumo (features/insumos), área do polígono de
// polygonAreaHa (map/geometry), o preenchimento do cadastro de
// CADASTRO_SECTIONS e as linhas de relatório de REPORT_MODELS.

const ABAS = [
  { id: "registration", label: "Cadastro" },
  { id: "cycles", label: "Safras" },
  { id: "insumos", label: "Insumos" },
  { id: "map", label: "Mapa" },
  { id: "timeline", label: "Timeline" },
  { id: "alerts", label: "Alertas" },
  { id: "reports", label: "Relatórios" },
];

const SEVERIDADES: FieldAlert["severity"][] = ["Crítico", "Atenção", "Informativo", "Recomendação"];

const COR_SEVERIDADE: Record<FieldAlert["severity"], string> = {
  Crítico: chartColors.destructive,
  Atenção: chartColors.warning,
  Informativo: chartColors.primary,
  Recomendação: chartColors.c1,
};

// Campos que cada modelo de relatório imprime (mesmas linhas de reports-tab).
const CAMPOS_SOLO = [
  "tipo_solo",
  "textura_solo",
  "ph",
  "materia_organica",
  "aptidao_agricola",
  "cultura_recomendada",
];
const CAMPOS_AREA = ["area_ha", "area_util", "perimetro_km", "geometry_geojson"];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const ha = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha`;
/** Sacas por hectare aceitam fração — em pt-BR isso é vírgula, não ponto. */
const sc = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const desvio = (v: number) => `${v > 0 ? "+" : ""}${v}% vs. plano`;
const plural = (n: number, um: string, muitos: string) => `${n} ${n === 1 ? um : muitos}`;

/**
 * Conta por chave derivada — ciclos/eventos/alertas não são registros de
 * payload. A chave pode vir vazia: os ciclos saem de `ciclos_json`, JSON livre
 * que o parseCycles não valida campo a campo.
 */
function contar<T>(
  itens: T[],
  chave: (item: T) => string | undefined,
  rotuloVazio = "Sem informação",
): Array<{ label: string; total: number }> {
  const mapa = new Map<string, number>();
  for (const item of itens) {
    const k = (chave(item) ?? "").trim() || rotuloVazio;
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
}

/** Dias entre duas datas ISO; null quando alguma não é data de verdade. */
function diasEntre(deISO: string, ateISO: string): number | null {
  const de = Date.parse(deISO);
  const ate = Date.parse(ateISO);
  if (!Number.isFinite(de) || !Number.isFinite(ate)) return null;
  return Math.max(0, Math.round((ate - de) / 86_400_000));
}

/**
 * "Hoje" no fuso do usuário. `toISOString()` puro devolveria o dia SEGUINTE a
 * partir das 21h no Brasil (UTC−3) e o KPI de dias sem registro andaria um dia.
 */
function hojeLocal(): string {
  const agora = new Date();
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** Mês de verdade (01–12): a data vem de payload de outros módulos. */
const MES_VALIDO = /^\d{4}-(0[1-9]|1[0-2])/;

/** Eventos por mês (MM/AA), em ordem cronológica — os 12 últimos meses com registro. */
export function eventosPorMes(eventos: TimelineEvent[]): Array<{ label: string; eventos: number }> {
  const mapa = new Map<string, number>();
  for (const evento of eventos) {
    if (!MES_VALIDO.test(evento.date)) continue;
    const chave = evento.date.slice(0, 7);
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([chave, total]) => ({
      label: `${chave.slice(5, 7)}/${chave.slice(2, 4)}`,
      eventos: total,
    }));
}

/** Rótulo curto do ciclo no eixo: "Safra 1 · 2025/26". */
function rotuloCiclo(ciclo: TalhaoCycle) {
  return [ciclo.nome, ciclo.safra].filter(Boolean).join(" · ");
}

export function buildTalhao360Overview(
  model: Talhao360Model,
  demoMode: boolean,
  /** Resumo de insumos do talhão (buildTalhaoInsumosResumo); ausente = aba ainda não carregada. */
  insumos?: TalhaoInsumosResumo,
  hojeISO = hojeLocal(),
): ModuleOverviewSpec {
  const payload = model.talhao.payload;
  const ciclo = model.selectedCycle;
  // `?? ""`: ciclos_json é texto livre no payload — um ciclo antigo sem data de
  // início não pode derrubar a aba que abre por padrão.
  const ciclos = [...model.cycles].sort((a, b) => (a.inicio ?? "").localeCompare(b.inicio ?? ""));

  // Área: a útil manda no custo por hectare; a calculada é a do cadastro/mapa.
  const areaCadastro = num(payload.area_ha);
  const areaUtil = num(payload.area_util) || areaCadastro;
  const geometria = parsePolygon(payload.geometry_geojson);
  const areaMapa = geometria ? polygonAreaHa(polygonPoints(geometria)) : 0;

  // Ciclo corrente: o número do ciclo manda; sem ciclo, cai no cadastro.
  const prodEsperada = ciclo?.produtividadeEsperada ?? num(payload.produtividade_esperada);
  const prodRealizada = ciclo?.produtividadeRealizada ?? num(payload.produtividade_realizada);
  const prodDesvio =
    prodEsperada > 0 && prodRealizada > 0
      ? Math.round((prodRealizada / prodEsperada - 1) * 100)
      : null;
  const custoPlanejadoHa = ciclo?.custoPrevistoHa ?? num(payload.custo_planejado_ha);
  const custoRealizadoHa = ciclo?.custoRealizadoHa ?? num(payload.custo_realizado_ha);
  const custoDesvio =
    custoPlanejadoHa > 0 && custoRealizadoHa > 0
      ? Math.round((custoRealizadoHa / custoPlanejadoHa - 1) * 100)
      : null;
  const margemHa = ciclo?.margemEstimadaHa ?? num(payload.margem_estimada_ha);

  // Insumos: custo realizado (saídas executadas) e reservado (operação futura).
  const custoInsumosHa = insumos && areaUtil > 0 ? insumos.custoRealizado / areaUtil : 0;

  // Alertas: só o que ainda exige ação — resolvido/ignorado não é fila.
  const abertos = model.alerts.filter((a) => a.status === "Aberto" || a.status === "Em análise");
  const criticos = abertos.filter((a) => a.severity === "Crítico").length;
  const porSeveridade = SEVERIDADES.map((severity) => ({
    label: severity,
    total: abertos.filter((a) => a.severity === severity).length,
  })).filter((s) => s.total > 0);

  // Timeline: talhão sem apontamento há semanas é talhão sem gestão. A data vem
  // de payload de outros módulos, então só conta a que o Date entende — senão o
  // KPI viraria "NaN". Evento no futuro é plano, não apontamento: a timeline
  // vem em ordem decrescente, e um evento agendado zeraria o KPI (o Math.max de
  // diasEntre esconderia o sinal de que ninguém aponta nada há um mês).
  const ultimo = model.events.find((e) => {
    if (!/^\d{4}-\d{2}-\d{2}/.test(e.date)) return false;
    const dia = e.date.slice(0, 10);
    return dia <= hojeISO && diasEntre(dia, hojeISO) != null;
  });
  const diasSemRegistro = ultimo ? diasEntre(ultimo.date.slice(0, 10), hojeISO) : null;

  // Cadastro: mesma régua da aba (seção só conta quando está inteira).
  const secoes = CADASTRO_SECTIONS.map((section) => {
    const preenchidos = cadastroSectionFilled(section, payload);
    return {
      label: section.title,
      valor: Math.round((preenchidos / section.fields.length) * 100),
      completa: preenchidos === section.fields.length,
    };
  });
  const secoesCompletas = secoes.filter((s) => s.completa).length;
  const pctCadastro = Math.round((secoesCompletas / CADASTRO_SECTIONS.length) * 100);

  // Relatórios: quantas linhas cada modelo levaria hoje — modelo em zero sai em branco.
  const preenchidos = (chaves: string[]) =>
    chaves.filter((chave) => String(payload[chave] ?? "").trim() !== "").length;
  const linhasPorModelo: Record<ReportModelId, number> = {
    geral: model.cycles.length + model.events.length + model.alerts.length,
    custos: model.cycles.length,
    produtividade: model.cycles.length,
    agronomico: preenchidos(CAMPOS_SOLO),
    alertas: model.alerts.length,
    mapa: preenchidos(CAMPOS_AREA),
  };
  const relatoriosComDados = REPORT_MODELS.filter((m) => linhasPorModelo[m.id] > 0).length;

  // Mapa: onde este talhão fica no portfólio da fazenda. A fazenda é texto
  // livre, então usa a MESMA régua do perímetro (normalizeFarmName).
  const fazenda = (payload.fazenda ?? "").trim();
  const fazendaChave = normalizeFarmName(payload.fazenda);
  const areaPorTalhao = model.talhoes
    .filter((t) => normalizeFarmName(t.payload.fazenda) === fazendaChave)
    .map((t) => ({ label: t.payload.talhao || "Sem nome", valor: num(t.payload.area_ha) }))
    .filter((t) => t.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  return {
    moduleId: "talhao-360",
    moduleLabel: `Talhão 360° · ${payload.talhao || "Talhão"}`,
    tabs: ABAS,
    demoMode,
    // "Sem safra" é o rótulo que o model usa quando não há safra: não vira
    // "Safra Sem safra" no carimbo do export.
    periodLabel: [
      model.seasons.includes(model.selectedSeason) ? `Safra ${model.selectedSeason}` : "Sem safra",
      ciclo?.nome,
    ]
      .filter(Boolean)
      .join(" · "),
    kpis: [
      {
        label: "Área",
        value: areaCadastro ? ha(areaCadastro) : "—",
        icon: MapPinned,
        hint: geometria ? `desenho no mapa: ${ha(areaMapa)}` : "sem geometria desenhada no mapa",
        tabId: "map",
      },
      {
        label: "Produtividade",
        value: prodRealizada || prodEsperada ? `${sc(prodRealizada || prodEsperada)} sc/ha` : "—",
        icon: TrendingUp,
        hint: prodRealizada ? "realizada" : prodEsperada ? "esperada" : undefined,
        trend: prodDesvio == null ? undefined : desvio(prodDesvio),
        trendDir: prodDesvio == null ? undefined : prodDesvio >= 0 ? "up" : "down",
        tabId: "cycles",
      },
      {
        label: "Custo realizado/ha",
        value: custoRealizadoHa ? brl(custoRealizadoHa) : "—",
        icon: Wallet,
        hint: custoPlanejadoHa ? `plano ${brl(custoPlanejadoHa)}/ha` : "sem plano informado",
        trend: custoDesvio == null ? undefined : desvio(custoDesvio),
        trendDir: custoDesvio == null ? undefined : custoDesvio <= 0 ? "up" : "down",
        tabId: "cycles",
      },
      {
        label: "Margem estimada/ha",
        value: margemHa ? brl(margemHa) : "—",
        icon: Sprout,
        trendDir: margemHa ? (margemHa > 0 ? "up" : "down") : undefined,
        tabId: "cycles",
      },
      {
        label: "Custo de insumos",
        value: insumos ? brl(insumos.custoRealizado) : "—",
        icon: Package,
        hint: custoInsumosHa ? `${brl(custoInsumosHa)}/ha` : "aplicações executadas",
        tabId: "insumos",
      },
      {
        label: "Insumo reservado",
        value: insumos ? brl(insumos.custoPrevisto) : "—",
        icon: Package,
        hint: insumos
          ? plural(insumos.reservas.length, "reserva ativa", "reservas ativas")
          : undefined,
        tabId: "insumos",
      },
      {
        label: "Alertas abertos",
        value: abertos.length,
        icon: AlertTriangle,
        hint: plural(
          model.alerts.length - abertos.length,
          "resolvido ou ignorado",
          "resolvidos ou ignorados",
        ),
        trendDir: abertos.length ? "down" : "up",
        tabId: "alerts",
      },
      {
        label: "Alertas críticos",
        value: criticos,
        icon: AlertTriangle,
        trendDir: criticos ? "down" : "up",
        tabId: "alerts",
      },
      {
        label: "Dias sem registro",
        value: diasSemRegistro == null ? "—" : diasSemRegistro,
        icon: CalendarClock,
        hint: plural(model.events.length, "evento na timeline", "eventos na timeline"),
        trendDir: diasSemRegistro != null && diasSemRegistro > 15 ? "down" : "up",
        tabId: "timeline",
      },
      {
        label: "Cadastro preenchido",
        value: `${pctCadastro}%`,
        icon: ClipboardList,
        hint: `${secoesCompletas} de ${CADASTRO_SECTIONS.length} seções completas`,
        trendDir: pctCadastro === 100 ? "up" : "down",
        tabId: "registration",
      },
      {
        label: "Relatórios com dados",
        value: `${relatoriosComDados} de ${REPORT_MODELS.length}`,
        icon: FileText,
        hint: "Modelos que já sairiam preenchidos",
        tabId: "reports",
      },
    ],
    charts: [
      {
        id: "talhao-produtividade-ciclo",
        tabId: "cycles",
        title: "Produtividade por ciclo",
        description: "Esperada × realizada, em sacas por hectare",
        featured: true,
        kind: "bars",
        xKey: "label",
        series: [
          { key: "esperada", name: "Esperada", color: chartColors.primary },
          { key: "realizada", name: "Realizada", color: chartColors.success },
        ],
        data: ciclos
          .filter((c) => c.produtividadeEsperada || c.produtividadeRealizada)
          .map((c) => ({
            label: rotuloCiclo(c),
            esperada: c.produtividadeEsperada ?? 0,
            realizada: c.produtividadeRealizada ?? 0,
          })),
      },
      {
        id: "talhao-custo-ciclo",
        tabId: "cycles",
        title: "Custo por hectare, ciclo a ciclo",
        description: "Previsto × realizado",
        featured: true,
        kind: "bars",
        format: "brl",
        xKey: "label",
        series: [
          { key: "previsto", name: "Previsto", color: chartColors.primary },
          { key: "realizado", name: "Realizado", color: chartColors.c1 },
        ],
        data: ciclos
          .filter((c) => c.custoPrevistoHa || c.custoRealizadoHa)
          .map((c) => ({
            label: rotuloCiclo(c),
            previsto: c.custoPrevistoHa ?? 0,
            realizado: c.custoRealizadoHa ?? 0,
          })),
      },
      barras({
        id: "talhao-insumo-categoria",
        tabId: "insumos",
        title: "Custo de insumo por categoria",
        description: "Aplicações executadas na safra selecionada",
        featured: true,
        layout: "vertical",
        format: "brl",
        nome: "Custo",
        limite: 8,
        data: (insumos?.custoPorCategoria ?? []).map((c) => ({ label: c.label, valor: c.value })),
      }),
      rosca({
        id: "talhao-alertas-severidade",
        tabId: "alerts",
        title: "Alertas abertos por severidade",
        description: "Fila de ação do talhão",
        nome: "Alertas",
        colors: porSeveridade.map((s) => COR_SEVERIDADE[s.label]),
        data: porSeveridade,
      }),
      barras({
        id: "talhao-alertas-tipo",
        tabId: "alerts",
        title: "Alertas abertos por tipo",
        layout: "vertical",
        nome: "Alertas",
        limite: 8,
        data: contar(abertos, (a) => a.type).map((c) => ({ label: c.label, valor: c.total })),
      }),
      {
        id: "talhao-eventos-mes",
        tabId: "timeline",
        title: "Eventos por mês",
        description: "Ritmo de apontamento no talhão",
        kind: "trend",
        area: true,
        xKey: "label",
        series: [{ key: "eventos", name: "Eventos" }],
        data: eventosPorMes(model.events),
      },
      barras({
        id: "talhao-eventos-tipo",
        tabId: "timeline",
        title: "Eventos por tipo",
        layout: "vertical",
        nome: "Eventos",
        limite: 8,
        data: contar(model.events, (e) => e.type).map((c) => ({ label: c.label, valor: c.total })),
      }),
      rosca({
        id: "talhao-ciclos-status",
        tabId: "cycles",
        title: "Ciclos por status",
        nome: "Ciclos",
        data: contar(model.cycles, (c) => c.status),
      }),
      barras({
        id: "talhao-area-fazenda",
        tabId: "map",
        title: "Área por talhão da fazenda",
        description: fazenda ? `Portfólio de ${fazenda}` : "Portfólio da fazenda",
        layout: "vertical",
        nome: "Hectares",
        limite: 10,
        data: areaPorTalhao,
      }),
      barras({
        id: "talhao-cadastro-secoes",
        tabId: "registration",
        title: "Preenchimento por seção do cadastro",
        description: "Onde falta informação para o 360 fechar",
        format: "pct",
        nome: "Preenchido",
        data: secoes.map((s) => ({ label: s.label, valor: s.valor })),
      }),
      barras({
        id: "talhao-relatorios-linhas",
        tabId: "reports",
        title: "Linhas disponíveis por relatório",
        description: "Modelo em zero sai em branco no PDF",
        layout: "vertical",
        nome: "Linhas",
        data: REPORT_MODELS.map((m) => ({ label: m.nome, valor: linhasPorModelo[m.id] })).filter(
          (m) => m.valor > 0,
        ),
      }),
    ],
    tables: [
      ...(ciclos.length
        ? [
            {
              id: "talhao-historico-ciclos",
              tabId: "cycles",
              title: "Histórico por ciclo",
              description: "Produtividade, custo e margem por safra",
              head: ["Ciclo", "Safra", "Prod. (sc/ha)", "Custo/ha", "Margem/ha"],
              body: [...ciclos]
                .reverse()
                .slice(0, 6)
                .map((c) => {
                  const prod = c.produtividadeRealizada ?? c.produtividadeEsperada;
                  return [
                    c.nome,
                    c.safra,
                    prod == null ? "—" : sc(prod),
                    c.custoRealizadoHa || c.custoPrevistoHa
                      ? brl(c.custoRealizadoHa ?? c.custoPrevistoHa ?? 0)
                      : "—",
                    c.margemEstimadaHa ? brl(c.margemEstimadaHa) : "—",
                  ];
                }),
            },
          ]
        : []),
      ...(abertos.length
        ? [
            {
              id: "talhao-alertas-prioritarios",
              tabId: "alerts",
              title: "Alertas prioritários",
              description: "Do mais grave para o menos grave",
              head: ["Severidade", "Alerta", "Prazo", "Status"],
              body: [...abertos]
                .sort((a, b) => SEVERIDADES.indexOf(a.severity) - SEVERIDADES.indexOf(b.severity))
                .slice(0, 6)
                .map((a) => [a.severity, a.title, a.dueOn ?? "—", a.status]),
            },
          ]
        : []),
    ],
  };
}
