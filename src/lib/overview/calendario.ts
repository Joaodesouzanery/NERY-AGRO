import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  GanttChartSquare,
  GitBranch,
  MapPinned,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  Users,
  Wallet,
  Wand2,
  Wheat,
} from "lucide-react";
import { chartColors } from "@/lib/chart-theme";
import {
  computeKpis,
  costWithinDays,
  dayKey,
  delayImpact,
  effectiveStatusId,
  formatDay,
  groupCost,
  groupCount,
  isEventActive,
  isOverdue,
} from "@/features/campo-calendar/lib/derive";
import {
  calendarPriorities,
  eventTypeLabels,
  priorityLabels,
  type CalendarAlert,
  type CalendarEvent,
  type CalendarPriority,
} from "@/features/campo-calendar/types/domain";
import type { CalendarModel } from "@/features/campo-calendar/api/services";
import { barras, rosca } from "@/lib/overview/helpers";
import type { ModuleOverviewSpec } from "@/lib/overview/types";

// Calendário de Campo — 6 subabas além da própria visão geral. A tela já tinha
// KPIs bons (computeKpis) mas nenhum gráfico: status e desembolso eram listas de
// barras CSS e as abas Linha do Tempo, Modelos e Relatórios não apareciam no
// resumo. Aqui tudo vem das MESMAS funções puras de features/campo-calendar/lib/
// derive.ts que as abas usam — a visão geral não recalcula nada por conta.
//
// Clima fica DE FORA de propósito: features/campo-calendar/lib/weather.ts é um
// mock que não respeita o modo DEMO, então KPI/gráfico em cima de previsão seria
// número inventado em modo REAL. Só entram alertas de regras determinísticas
// (atraso, janela de ciclo, sobreposição), listadas em REGRAS_DE_CRONOGRAMA.

const ABAS = [
  { id: "calendario", label: "Calendário" },
  { id: "linha-tempo", label: "Linha do Tempo" },
  { id: "tarefas", label: "Tarefas" },
  { id: "decisoes", label: "Decisões" },
  { id: "modelos", label: "Modelos de Ciclo" },
  { id: "relatorios", label: "Relatórios" },
];

/** Regras de computeCalendarAlerts que nascem de registro, não da previsão mockada. */
const REGRAS_DE_CRONOGRAMA = new Set([
  "tarefa-atrasada",
  "critica-sem-responsavel",
  "decisao-vencendo",
  "janela-plantio-encerrando",
  "tarefa-fora-da-janela",
  "sobreposicao-de-ciclos",
]);

/** Janela do gráfico de carga: 12 meses ancorados no mês corrente. */
const JANELA_MESES = 12;

const CICLO_STATUS: Array<{ label: string; cor: string }> = [
  { label: "Planejado", cor: chartColors.c1 },
  { label: "Em andamento", cor: chartColors.primary },
  { label: "Concluído", cor: chartColors.success },
  { label: "Cancelado", cor: chartColors.mutedFg },
];

const COR_PRIORIDADE: Record<CalendarPriority, string> = {
  baixa: chartColors.c1,
  normal: chartColors.primary,
  alta: chartColors.warning,
  critica: chartColors.destructive,
};

/** Semáforo de status — mesma leitura do badge da lista (statusBadgeClass). */
const COR_STATUS: Record<string, string> = {
  planejada: chartColors.c1,
  pendente: chartColors.warning,
  "em-andamento": chartColors.primary,
  concluida: chartColors.success,
  atrasada: chartColors.destructive,
  cancelada: chartColors.mutedFg,
};

const MODELO_VAZIO: CalendarModel = {
  events: [],
  templates: [],
  statuses: [],
  talhoes: [],
  cycles: [],
  fazendas: [],
  safras: [],
  responsaveis: [],
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export type CalendarioOverviewInput = {
  /** Modelo consolidado da página (eventos, ciclos, talhões, modelos, status). */
  model?: CalendarModel;
  /** Eventos já filtrados pelos filtros globais; padrão = todos os do modelo. */
  events?: CalendarEvent[];
  /** Alertas já calculados pela página (computeCalendarAlerts). */
  alerts?: CalendarAlert[];
  /** "Hoje" — injetável para o teste não depender do relógio. */
  now?: Date;
};

/** Carga de trabalho por mês: quantas tarefas caem no mês e quantas fecharam. */
function cargaPorMes(events: CalendarEvent[], now: Date) {
  const mapa = new Map<string, { tarefas: number; concluidas: number }>();
  for (const event of events) {
    const mes = event.startsAt.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(mes)) continue;
    const atual = mapa.get(mes) ?? { tarefas: 0, concluidas: 0 };
    atual.tarefas += 1;
    if (event.statusId === "concluida") atual.concluidas += 1;
    mapa.set(mes, atual);
  }
  const meses = [...mapa.keys()].sort();
  // Ancorar no mês corrente (com 3 meses de retrovisor) evita que uma tarefa
  // solta em 2030 estique o eixo e achate o que interessa.
  const mesAtual = dayKey(now).slice(0, 7);
  const alvo = meses.findIndex((mes) => mes >= mesAtual);
  const inicio = alvo < 0 ? Math.max(0, meses.length - JANELA_MESES) : Math.max(0, alvo - 3);
  return meses.slice(inicio, inicio + JANELA_MESES).map((mes) => {
    const item = mapa.get(mes) ?? { tarefas: 0, concluidas: 0 };
    return { mes: `${mes.slice(5)}/${mes.slice(0, 4)}`, ...item };
  });
}

export function buildCalendarioOverview(
  input: CalendarioOverviewInput,
  demoMode: boolean,
): ModuleOverviewSpec {
  const model = input.model ?? MODELO_VAZIO;
  const events = input.events ?? model.events;
  const alerts = input.alerts ?? [];
  const now = input.now ?? new Date();

  // A mesma função que alimenta a faixa de KPIs da aba — nada recalculado aqui.
  const k = computeKpis(events, model.talhoes, now);
  const ativos = events.filter(isEventActive);
  const atrasados = events.filter((event) => isOverdue(event, now));
  const concluidas = events.filter((event) => event.statusId === "concluida").length;
  const conclusaoPct = events.length ? Math.round((concluidas / events.length) * 100) : 0;
  const semResponsavel = ativos.filter((event) => !event.responsibleName).length;
  const impactoAtraso = delayImpact(events, now);

  const conflitos = alerts.filter((alert) => REGRAS_DE_CRONOGRAMA.has(alert.rule));
  const decisoesVencendo = alerts.filter((alert) => alert.rule === "decisao-vencendo").length;

  const decisoes = events.filter((event) => event.eventType === "decisao");
  const decisoesDecididas = decisoes.filter((event) => event.decisionSelected).length;
  const modelosAtivos = model.templates.filter((template) => template.ativo);
  // Só os itens dos modelos ATIVOS: o número acompanha o KPI ao lado, senão um
  // modelo arquivado com 20 tarefas infla a contagem do que está em uso.
  const itensDeModelo = modelosAtivos.reduce((soma, template) => soma + template.itens.length, 0);
  const ciclosEmAndamento = model.cycles.filter((cycle) => cycle.status === "Em andamento").length;

  // Status usa o rótulo personalizado do módulo e o status EFETIVO (vencido vira
  // "atrasada"), exatamente como a lista de tarefas mostra. Agrupa pelo id e só
  // depois traduz: dois status distintos com o mesmo rótulo não se fundem, e o
  // id é o que dá a cor do semáforo.
  const porStatus = groupCount(events, (event) => effectiveStatusId(event, now)).map(
    ({ label: statusId, value }) => ({
      statusId,
      label: model.statuses.find((status) => status.id === statusId)?.label ?? statusId,
      total: value,
    }),
  );
  const porTipo = groupCount(events, (event) => eventTypeLabels[event.eventType]);
  const porResponsavel = groupCount(
    events.filter((event) => event.responsibleName),
    (event) => event.responsibleName,
  );
  const porTalhao = groupCount(
    events.filter((event) => event.talhaoName),
    (event) => event.talhaoName,
  );
  const custoPorTalhao = groupCost(events, (event) => event.talhaoName ?? "Fazenda toda");
  const custoPorTipo = groupCost(events, (event) => eventTypeLabels[event.eventType]);

  // Prioridade e situação da decisão são semáforo: ordem fixa para a cor da
  // fatia não trocar de significado quando a contagem muda.
  const prioridades = calendarPriorities
    .map((priority) => ({
      priority,
      total: ativos.filter((event) => event.priority === priority).length,
    }))
    .filter((item) => item.total > 0);
  const situacaoDecisoes = [
    { label: "Pendentes", total: decisoes.length - decisoesDecididas, cor: chartColors.warning },
    { label: "Decididas", total: decisoesDecididas, cor: chartColors.success },
  ].filter((item) => item.total > 0);
  // O status do ciclo vem do JSON do Talhão 360 sem validação: o balde "Outro"
  // garante que a rosca some o total de ciclos do KPI, em vez de sumir com um
  // ciclo cujo status não esteja na lista canônica.
  const statusDeCiclo = new Set(CICLO_STATUS.map((status) => status.label));
  const ciclosPorStatus = [
    ...CICLO_STATUS.map((status) => ({
      label: status.label,
      cor: status.cor,
      total: model.cycles.filter((cycle) => cycle.status === status.label).length,
    })),
    {
      label: "Outro",
      cor: chartColors.c2,
      total: model.cycles.filter((cycle) => !statusDeCiclo.has(cycle.status)).length,
    },
  ].filter((item) => item.total > 0);

  const nomeDoModelo = new Map(model.templates.map((template) => [template.id, template.nome]));
  // Excluir um modelo mantém as tarefas já geradas (ModelosTab avisa isso), então
  // o templateId órfão é rotina — sem o fallback o gráfico exibiria o id cru.
  const tarefasPorModelo = groupCount(
    events.filter((event) => event.templateId),
    (event) =>
      event.templateId ? (nomeDoModelo.get(event.templateId) ?? "Modelo removido") : undefined,
  );
  const custoPadraoPorModelo = model.templates
    .map((template) => ({
      label: template.nome,
      valor: template.itens.reduce((soma, item) => soma + (item.custoEstimado ?? 0), 0),
    }))
    .filter((item) => item.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  // Desembolso previsto: as três janelas que a aba já mostra (7/15/30 dias).
  const horizonte = [
    { label: "7 dias", valor: costWithinDays(events, now, 7) },
    { label: "15 dias", valor: costWithinDays(events, now, 15) },
    { label: "30 dias", valor: costWithinDays(events, now, 30) },
  ];

  return {
    moduleId: "campo-calendario",
    moduleLabel: "Calendário de Campo",
    tabs: ABAS,
    demoMode,
    kpis: [
      { label: "Tarefas hoje", value: k.hoje, icon: CalendarDays, tabId: "calendario" },
      {
        label: "Próximos 7 dias",
        value: k.proximos7,
        icon: CalendarClock,
        hint: "Tarefas que começam na semana",
        tabId: "calendario",
      },
      {
        label: "Próxima colheita",
        value: k.proximaColheita ? formatDay(k.proximaColheita) : "—",
        icon: Wheat,
        tabId: "calendario",
      },
      {
        label: "Atrasadas",
        value: k.atrasadas,
        icon: AlertTriangle,
        trend: k.atrasadas ? "replanejar" : "ok",
        trendDir: k.atrasadas ? "down" : "up",
        tabId: "tarefas",
      },
      {
        label: "Conclusão",
        value: `${conclusaoPct}%`,
        icon: CheckCircle2,
        hint: `${concluidas} de ${events.length} tarefa(s)`,
        trendDir: conclusaoPct >= 80 ? "up" : "neutral",
        tabId: "tarefas",
      },
      {
        label: "Sem responsável",
        value: semResponsavel,
        icon: Users,
        hint: "Tarefas ativas sem dono definido",
        trendDir: semResponsavel ? "down" : "up",
        tabId: "tarefas",
      },
      {
        label: "Compras na agenda",
        value: k.comprasPendentes,
        icon: ShoppingCart,
        hint: "Ação de compra — não é conta a pagar",
        tabId: "tarefas",
      },
      {
        label: "Área programada",
        value: `${k.areaProgramadaHa.toLocaleString("pt-BR")} ha`,
        icon: MapPinned,
        hint: "Talhões com tarefa nos próximos 30 dias",
        tabId: "linha-tempo",
      },
      {
        label: "Ciclos em andamento",
        value: ciclosEmAndamento,
        icon: GanttChartSquare,
        hint: `${model.cycles.length} ciclo(s) no Talhão 360`,
        tabId: "linha-tempo",
      },
      {
        label: "Conflitos de cronograma",
        value: conflitos.length,
        icon: AlertTriangle,
        hint: "Atraso, janela de ciclo e sobreposição",
        trendDir: conflitos.length ? "down" : "up",
        tabId: "linha-tempo",
      },
      {
        label: "Decisões pendentes",
        value: k.decisoesPendentes,
        icon: GitBranch,
        tabId: "decisoes",
      },
      {
        label: "Decisões vencendo",
        value: decisoesVencendo,
        icon: AlertTriangle,
        hint: "Prazo em até 3 dias",
        trendDir: decisoesVencendo ? "down" : "up",
        tabId: "decisoes",
      },
      {
        label: "Modelos ativos",
        value: modelosAtivos.length,
        icon: Sparkles,
        hint: `${itensDeModelo} tarefa(s) padrão nos modelos ativos`,
        tabId: "modelos",
      },
      {
        label: "Tarefas geradas por modelo",
        value: events.filter((event) => event.templateId).length,
        icon: Wand2,
        tabId: "modelos",
      },
      {
        label: "Custo previsto (30 dias)",
        value: brl(k.custo30),
        icon: Wallet,
        hint: "Estimativa de planejamento",
        tabId: "relatorios",
      },
      {
        label: "Impacto de atraso",
        value: brl(impactoAtraso),
        icon: TrendingDown,
        hint: "Custo de atraso das tarefas vencidas",
        trendDir: impactoAtraso ? "down" : "up",
        tabId: "relatorios",
      },
    ],
    charts: [
      {
        id: "calendario-carga-mes",
        tabId: "calendario",
        title: "Carga de tarefas por mês",
        description: "Onde o cronograma concentra trabalho",
        featured: true,
        kind: "trend",
        xKey: "mes",
        series: [
          { key: "tarefas", name: "Tarefas" },
          { key: "concluidas", name: "Concluídas", color: chartColors.success },
        ],
        data: cargaPorMes(events, now),
      },
      rosca({
        id: "tarefas-status",
        tabId: "tarefas",
        title: "Tarefas por status",
        description: "Status efetivo — vencida conta como atrasada",
        featured: true,
        nome: "Tarefas",
        colors: porStatus.map((item) => COR_STATUS[item.statusId] ?? chartColors.c2),
        data: porStatus.map((item) => ({ label: item.label, total: item.total })),
      }),
      barras({
        id: "relatorios-custo-talhao",
        tabId: "relatorios",
        title: "Custo estimado por talhão",
        description: "Planejado — informativo, não gera lançamento",
        featured: true,
        layout: "vertical",
        format: "brl",
        nome: "Custo",
        limite: 8,
        data: custoPorTalhao.map((item) => ({ label: item.label, valor: item.value })),
      }),
      rosca({
        id: "calendario-tipo",
        tabId: "calendario",
        title: "Tarefas por tipo",
        nome: "Tarefas",
        data: porTipo.map((item) => ({ label: item.label, total: item.value })),
      }),
      barras({
        id: "linha-tempo-talhao",
        tabId: "linha-tempo",
        title: "Tarefas por talhão",
        description: "Cada linha da timeline é um talhão",
        layout: "vertical",
        nome: "Tarefas",
        limite: 8,
        data: porTalhao.map((item) => ({ label: item.label, valor: item.value })),
      }),
      rosca({
        id: "linha-tempo-ciclos",
        tabId: "linha-tempo",
        title: "Ciclos por status",
        description: "Faixas do Talhão 360 na linha do tempo",
        nome: "Ciclos",
        colors: ciclosPorStatus.map((item) => item.cor),
        data: ciclosPorStatus.map((item) => ({ label: item.label, total: item.total })),
      }),
      barras({
        id: "tarefas-responsavel",
        tabId: "tarefas",
        title: "Tarefas por responsável",
        layout: "vertical",
        nome: "Tarefas",
        limite: 8,
        data: porResponsavel.map((item) => ({ label: item.label, valor: item.value })),
      }),
      rosca({
        id: "tarefas-prioridade",
        tabId: "tarefas",
        title: "Prioridade das tarefas ativas",
        nome: "Tarefas",
        colors: prioridades.map((item) => COR_PRIORIDADE[item.priority]),
        data: prioridades.map((item) => ({
          label: priorityLabels[item.priority],
          total: item.total,
        })),
      }),
      rosca({
        id: "decisoes-situacao",
        tabId: "decisoes",
        title: "Decisões pendentes × decididas",
        nome: "Decisões",
        colors: situacaoDecisoes.map((item) => item.cor),
        data: situacaoDecisoes.map((item) => ({ label: item.label, total: item.total })),
      }),
      barras({
        id: "decisoes-impacto",
        tabId: "decisoes",
        title: "Impacto estimado por decisão",
        description: "Custo de adiar cada decisão",
        layout: "vertical",
        format: "brl",
        nome: "Impacto",
        limite: 8,
        data: decisoes
          .filter((event) => (event.delayCost ?? 0) > 0)
          .map((event) => ({ label: event.title, valor: event.delayCost ?? 0 }))
          .sort((a, b) => b.valor - a.valor),
      }),
      barras({
        id: "modelos-geracao",
        tabId: "modelos",
        title: "Tarefas geradas por modelo",
        description: "Quanto do cronograma nasce padronizado",
        layout: "vertical",
        nome: "Tarefas",
        limite: 8,
        data: tarefasPorModelo.map((item) => ({ label: item.label, valor: item.value })),
      }),
      barras({
        id: "modelos-custo",
        tabId: "modelos",
        title: "Custo padrão por hectare (modelo)",
        description: "Soma dos itens do modelo, por hectare",
        layout: "vertical",
        format: "brl",
        nome: "Custo/ha",
        limite: 8,
        data: custoPadraoPorModelo,
      }),
      barras({
        id: "relatorios-custo-tipo",
        tabId: "relatorios",
        title: "Custo estimado por tipo",
        layout: "vertical",
        format: "brl",
        nome: "Custo",
        limite: 8,
        data: custoPorTipo.map((item) => ({ label: item.label, valor: item.value })),
      }),
      barras({
        id: "relatorios-horizonte",
        tabId: "relatorios",
        title: "Desembolso previsto",
        description: "Tarefas ativas que começam na janela",
        format: "brl",
        nome: "Custo",
        // Sem nenhum custo informado o gráfico entra vazio — três barras zeradas
        // dariam a impressão falsa de que o planejamento financeiro existe.
        data: horizonte.some((item) => item.valor > 0) ? horizonte : [],
      }),
    ],
    tables: atrasados.length
      ? [
          {
            id: "tarefas-atrasadas",
            tabId: "tarefas",
            title: "Tarefas atrasadas",
            description: "Prazo vencido e ainda em aberto",
            head: ["Tarefa", "Tipo", "Talhão", "Prazo", "Responsável"],
            body: [...atrasados]
              .sort((a, b) => (a.endsAt || a.startsAt).localeCompare(b.endsAt || b.startsAt))
              .slice(0, 8)
              .map((event) => [
                event.title,
                eventTypeLabels[event.eventType],
                event.talhaoName ?? "—",
                formatDay(event.endsAt || event.startsAt),
                event.responsibleName ?? "sem responsável",
              ]),
          },
        ]
      : undefined,
  };
}
