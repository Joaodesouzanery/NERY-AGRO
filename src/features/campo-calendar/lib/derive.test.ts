import { describe, expect, it } from "vitest";
import {
  agendaGroups,
  applyFilters,
  applyStatusTransition,
  computeCalendarAlerts,
  computeKpis,
  costWithinDays,
  dayKey,
  delayImpact,
  effectiveStatusId,
  eventOccursOn,
  generateFromTemplate,
  isOverdue,
  monthMatrix,
  reuseCycleTasks,
} from "@/features/campo-calendar/lib/derive";
import type {
  CalendarCycle,
  CalendarEvent,
  CalendarTalhao,
  CycleTemplate,
} from "@/features/campo-calendar/types/domain";
import type { DailyForecast } from "@/features/campo-calendar/lib/weather";

const NOW = new Date(2026, 6, 10, 12, 0, 0); // 2026-07-10 local

function event(patch: Partial<CalendarEvent> & { id: string }): CalendarEvent {
  return {
    title: "Tarefa",
    eventType: "operacao",
    startsAt: "2026-07-10",
    allDay: true,
    statusId: "planejada",
    priority: "normal",
    source: "manual",
    visibility: "equipe",
    ...patch,
  };
}

const cycle: CalendarCycle = {
  id: "cycle-1",
  talhaoId: "t3",
  talhaoName: "Talhão 03",
  safra: "2025/2026",
  nome: "Soja Verão",
  cultura: "Soja",
  tipo: "Produção",
  inicio: "2026-07-01",
  fimPrevisto: "2026-11-20",
  status: "Em andamento",
  areaHa: 40,
};

describe("Calendário — atraso e status efetivo", () => {
  it("marca como atrasada tarefa vencida e ativa, sem destruir o status persistido", () => {
    const vencida = event({ id: "a", startsAt: "2026-07-05", statusId: "pendente" });
    expect(isOverdue(vencida, NOW)).toBe(true);
    expect(effectiveStatusId(vencida, NOW)).toBe("atrasada");
    expect(vencida.statusId).toBe("pendente");
  });

  it("não considera atraso para concluída/cancelada nem multi-dia em andamento", () => {
    expect(isOverdue(event({ id: "b", startsAt: "2026-07-01", statusId: "concluida" }), NOW)).toBe(
      false,
    );
    expect(isOverdue(event({ id: "c", startsAt: "2026-07-08", endsAt: "2026-07-12" }), NOW)).toBe(
      false,
    );
  });

  it("carimba completedAt/cancelledAt e limpa ao reabrir", () => {
    const base = event({ id: "d" });
    const done = applyStatusTransition(base, "concluida", "2026-07-10T12:00:00Z");
    expect(done.completedAt).toBe("2026-07-10T12:00:00Z");
    const reopened = applyStatusTransition(done, "pendente", "2026-07-11T12:00:00Z");
    expect(reopened.completedAt).toBeUndefined();
    expect(reopened.cancelledAt).toBeUndefined();
  });
});

describe("Calendário — filtros globais", () => {
  const events = [
    event({ id: "1", talhaoId: "t3", responsibleName: "João", eventType: "compra" }),
    event({ id: "2", talhaoId: "t1", priority: "critica", safra: "2025/2026" }),
    event({ id: "3", startsAt: "2026-07-01", statusId: "pendente" }),
  ];

  it("filtra por talhão, tipo, responsável e prioridade", () => {
    expect(applyFilters(events, { fieldId: "t3" }, NOW)).toHaveLength(1);
    expect(applyFilters(events, { eventType: "compra" }, NOW)[0].id).toBe("1");
    expect(applyFilters(events, { responsible: "João" }, NOW)).toHaveLength(1);
    expect(applyFilters(events, { priority: "critica" }, NOW)[0].id).toBe("2");
  });

  it("filtro de status usa o status efetivo (atrasada é visual)", () => {
    expect(applyFilters(events, { status: "atrasada" }, NOW)[0].id).toBe("3");
    expect(applyFilters(events, { status: "pendente" }, NOW)).toHaveLength(0);
  });
});

describe("Calendário — grades e agenda", () => {
  it("mês cobre todas as semanas de domingo a sábado", () => {
    const weeks = monthMatrix(NOW);
    expect(weeks.length).toBeGreaterThanOrEqual(5);
    expect(weeks[0][0].getDay()).toBe(0);
    expect(weeks.flat().some((day) => dayKey(day) === "2026-07-01")).toBe(true);
    expect(weeks.flat().some((day) => dayKey(day) === "2026-07-31")).toBe(true);
  });

  it("evento multi-dia ocorre em todos os dias do intervalo", () => {
    const multi = event({ id: "m", startsAt: "2026-07-09", endsAt: "2026-07-12" });
    expect(eventOccursOn(multi, new Date(2026, 6, 9))).toBe(true);
    expect(eventOccursOn(multi, new Date(2026, 6, 11))).toBe(true);
    expect(eventOccursOn(multi, new Date(2026, 6, 13))).toBe(false);
  });

  it("agenda agrupa apenas dias com eventos", () => {
    const groups = agendaGroups([event({ id: "g", startsAt: "2026-07-12" })], NOW, 30);
    expect(groups).toHaveLength(1);
    expect(dayKey(groups[0].date)).toBe("2026-07-12");
  });
});

describe("Calendário — KPIs e custos", () => {
  const talhoes: CalendarTalhao[] = [
    { id: "t3", nome: "Talhão 03", areaHa: 42.8 },
    { id: "t1", nome: "Talhão 01", areaHa: 58.2 },
  ];
  const events = [
    event({ id: "hoje", startsAt: "2026-07-10", talhaoId: "t3", estimatedCost: 100 }),
    event({ id: "amanha", startsAt: "2026-07-11", estimatedCost: 50 }),
    event({ id: "d20", startsAt: "2026-07-30", estimatedCost: 500 }),
    event({ id: "vencida", startsAt: "2026-07-01", delayCost: 900 }),
    event({ id: "decisao", eventType: "decisao", startsAt: "2026-07-12" }),
    event({ id: "compra", eventType: "compra", startsAt: "2026-07-15", estimatedCost: 200 }),
    event({ id: "colheita", eventType: "colheita", startsAt: "2026-08-01", talhaoId: "t1" }),
    event({ id: "feita", startsAt: "2026-07-10", statusId: "concluida", estimatedCost: 999 }),
  ];

  it("calcula os KPIs da visão geral", () => {
    const kpis = computeKpis(events, talhoes, NOW);
    expect(kpis.hoje).toBe(1);
    expect(kpis.atrasadas).toBe(1);
    expect(kpis.decisoesPendentes).toBe(1);
    expect(kpis.comprasPendentes).toBe(1);
    expect(kpis.proximaColheita).toBe("2026-08-01");
    expect(kpis.areaProgramadaHa).toBeCloseTo(42.8 + 58.2, 5);
  });

  it("janela de custo 7/15/30 ignora concluídas e respeita o horizonte", () => {
    // 7d (até 17/07): hoje 100 + amanhã 50 + compra 15/07 200 = 350
    expect(costWithinDays(events, NOW, 7)).toBe(350);
    // 15d (até 25/07): idem — d20 (30/07) fica fora
    expect(costWithinDays(events, NOW, 15)).toBe(350);
    // 30d: + 500 do dia 30/07; concluída (999) nunca conta
    expect(costWithinDays(events, NOW, 30)).toBe(850);
  });

  it("impacto de atraso soma delay_cost só de vencidas", () => {
    expect(delayImpact(events, NOW)).toBe(900);
  });
});

describe("Calendário — alertas determinísticos", () => {
  const forecast: DailyForecast[] = [
    { date: "2026-07-12", rainChancePct: 80, rainMm: 20, tempMinC: 20, tempMaxC: 30, windKmh: 10 },
    { date: "2026-07-15", rainChancePct: 10, rainMm: 0, tempMinC: 22, tempMaxC: 39, windKmh: 8 },
  ];

  it("dispara chuva antes de pulverização, calor extremo, crítica sem responsável e decisão vencendo", () => {
    const events = [
      event({ id: "pulv", eventType: "pulverizacao", startsAt: "2026-07-12", priority: "critica" }),
      event({ id: "plantioquente", eventType: "plantio", startsAt: "2026-07-15" }),
      event({ id: "dec", eventType: "decisao", startsAt: "2026-07-11" }),
    ];
    const alerts = computeCalendarAlerts(events, [cycle], forecast, NOW);
    const rules = alerts.map((alert) => alert.rule);
    expect(rules).toContain("chuva-antes-pulverizacao");
    expect(rules).toContain("calor-extremo");
    expect(rules).toContain("critica-sem-responsavel");
    expect(rules).toContain("decisao-vencendo");
    // keys únicas (dedupe determinístico)
    expect(new Set(alerts.map((alert) => alert.key)).size).toBe(alerts.length);
  });

  it("sem previsão (modo REAL) não sai nenhum alerta de clima", () => {
    // Em REAL `useForecast` não roda (enabled: demoMode) e a página passa [].
    // É o que garante que ninguém adie uma pulverização de verdade por causa
    // de um percentual de chuva derivado de hash da data. As regras que não
    // dependem de clima continuam valendo — o alerta some, a lógica não muda.
    const events = [
      event({ id: "pulv", eventType: "pulverizacao", startsAt: "2026-07-12", priority: "critica" }),
      event({ id: "plantioquente", eventType: "plantio", startsAt: "2026-07-15" }),
    ];
    const rules = computeCalendarAlerts(events, [cycle], [], NOW).map((alert) => alert.rule);
    expect(rules).not.toContain("chuva-antes-pulverizacao");
    expect(rules).not.toContain("calor-extremo");
    expect(rules).toContain("critica-sem-responsavel");
  });

  it("aponta tarefa fora da janela do ciclo e sobreposição de ciclos", () => {
    const fora = event({
      id: "fora",
      cycleId: "cycle-1",
      startsAt: "2026-12-25",
      talhaoId: "t3",
    });
    const overlapping: CalendarCycle = {
      ...cycle,
      id: "cycle-2",
      nome: "Milho Safrinha",
      inicio: "2026-11-10",
      fimPrevisto: "2027-03-01",
    };
    const alerts = computeCalendarAlerts([fora], [cycle, overlapping], [], NOW);
    expect(alerts.some((alert) => alert.rule === "tarefa-fora-da-janela")).toBe(true);
    expect(alerts.some((alert) => alert.rule === "sobreposicao-de-ciclos")).toBe(true);
  });

  it("não inventa conflito de janela sem ciclos", () => {
    const alerts = computeCalendarAlerts([event({ id: "x", startsAt: "2026-07-12" })], [], [], NOW);
    expect(alerts.filter((alert) => alert.rule === "tarefa-fora-da-janela")).toHaveLength(0);
  });
});

describe("Calendário — geração por modelo e reuso de ciclo", () => {
  const template: CycleTemplate = {
    id: "tpl",
    nome: "Soja",
    cultura: "Soja",
    cicloTipo: "Produção",
    regime: "sequeiro",
    ativo: true,
    itens: [
      {
        id: "dessec",
        titulo: "Dessecação",
        eventType: "pulverizacao",
        offsetDias: -10,
        ancora: "inicio",
        priority: "alta",
        custoEstimado: 100,
        obrigatorio: true,
      },
      {
        id: "plantio",
        titulo: "Plantio",
        eventType: "plantio",
        offsetDias: 0,
        ancora: "inicio",
        priority: "critica",
        obrigatorio: true,
      },
      {
        id: "monitor",
        titulo: "Monitorar",
        eventType: "monitoramento",
        offsetDias: 15,
        ancora: "anterior",
        priority: "normal",
        obrigatorio: false,
      },
      {
        id: "colheita",
        titulo: "Colheita",
        eventType: "colheita",
        offsetDias: -2,
        ancora: "fim",
        priority: "critica",
        obrigatorio: true,
      },
    ],
  };

  it("calcula datas por âncora (início, anterior, fim) e custo por hectare", () => {
    const tasks = generateFromTemplate(template, cycle, []);
    expect(tasks.map((task) => task.draft.startsAt)).toEqual([
      "2026-06-21",
      "2026-07-01",
      "2026-07-16",
      "2026-11-18",
    ]);
    expect(tasks[0].draft.estimatedCost).toBe(100 * 40);
    expect(tasks.every((task) => task.draft.source === "ciclo")).toBe(true);
    expect(tasks.every((task) => task.draft.templateId === "tpl")).toBe(true);
  });

  it("detecta duplicidade por título já existente no ciclo", () => {
    const existing = [event({ id: "e", title: "Plantio", cycleId: "cycle-1" })];
    const tasks = generateFromTemplate(template, cycle, existing);
    expect(tasks.find((task) => task.itemId === "plantio")?.duplicate).toBe(true);
    expect(tasks.find((task) => task.itemId === "dessec")?.duplicate).toBe(false);
  });

  it("reusa tarefas do ciclo anterior deslocando pela diferença de início", () => {
    const previous: CalendarCycle = {
      ...cycle,
      id: "cycle-0",
      inicio: "2025-07-01",
      fimPrevisto: "2025-11-20",
    };
    const sourceEvents = [
      event({ id: "s1", title: "Plantio", cycleId: "cycle-0", startsAt: "2025-07-01" }),
      event({ id: "s2", title: "Colheita", cycleId: "cycle-0", startsAt: "2025-11-10" }),
    ];
    const tasks = reuseCycleTasks(sourceEvents, previous, cycle);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].draft.startsAt).toBe("2026-07-01");
    expect(tasks[1].draft.startsAt).toBe("2026-11-10");
    expect(tasks[0].draft.cycleId).toBe("cycle-1");
  });
});
