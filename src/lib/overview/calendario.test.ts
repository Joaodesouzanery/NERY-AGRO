import { describe, expect, it } from "vitest";
import { chartColors } from "@/lib/chart-theme";
import { coverageReport, overviewCoverage } from "@/lib/overview/coverage";
import { buildCalendarioOverview } from "@/lib/overview/calendario";
import type { CalendarModel } from "@/features/campo-calendar/api/services";
import {
  defaultStatuses,
  type CalendarCycle,
  type CalendarEvent,
  type CalendarTalhao,
  type CycleTemplate,
} from "@/features/campo-calendar/types/domain";

// Fixture pequena e conferível à mão: 7 tarefas, 2 talhões, 3 ciclos e 2 modelos.
// Os números abaixo são somas que dá para refazer no papel — é isso que prova
// que a visão geral está reusando as métricas do módulo, e não improvisando.

const HOJE = new Date(2026, 6, 15); // 15/07/2026, hora local

function evento(partial: Partial<CalendarEvent> & Pick<CalendarEvent, "id" | "title">) {
  return {
    eventType: "operacao",
    startsAt: "2026-07-15",
    allDay: true,
    statusId: "planejada",
    priority: "normal",
    source: "manual",
    visibility: "equipe",
    ...partial,
  } as CalendarEvent;
}

const talhoes: CalendarTalhao[] = [
  { id: "t-a", nome: "Talhão A", areaHa: 120 },
  { id: "t-b", nome: "Talhão B", areaHa: 80 },
];

const cycles: CalendarCycle[] = [
  {
    id: "c-1",
    talhaoId: "t-a",
    talhaoName: "Talhão A",
    safra: "2026/2027",
    nome: "Milho 1ª",
    cultura: "Milho",
    tipo: "Grão",
    inicio: "2026-07-01",
    fimPrevisto: "2026-11-30",
    status: "Em andamento",
  },
  {
    id: "c-2",
    talhaoId: "t-b",
    talhaoName: "Talhão B",
    safra: "2026/2027",
    nome: "Soja",
    cultura: "Soja",
    tipo: "Grão",
    inicio: "2026-09-01",
    fimPrevisto: "2027-01-31",
    status: "Em andamento",
  },
  {
    id: "c-3",
    talhaoId: "t-b",
    talhaoName: "Talhão B",
    safra: "2027/2028",
    nome: "Feijão",
    cultura: "Feijão",
    tipo: "Grão",
    inicio: "2027-03-01",
    fimPrevisto: "2027-06-30",
    status: "Planejado",
  },
];

const templates: CycleTemplate[] = [
  {
    id: "tpl-1",
    nome: "Milho safrinha",
    cultura: "Milho",
    cicloTipo: "Grão",
    regime: "sequeiro",
    ativo: true,
    itens: [
      {
        id: "i-1",
        titulo: "Adubação de base",
        eventType: "adubacao",
        offsetDias: 0,
        ancora: "inicio",
        priority: "alta",
        custoEstimado: 200,
        obrigatorio: true,
      },
      {
        id: "i-2",
        titulo: "Pulverização",
        eventType: "pulverizacao",
        offsetDias: 20,
        ancora: "anterior",
        priority: "normal",
        custoEstimado: 150,
        obrigatorio: false,
      },
    ],
  },
  {
    id: "tpl-2",
    nome: "Modelo arquivado",
    cultura: "Soja",
    cicloTipo: "Grão",
    regime: "ambos",
    ativo: false,
    // Item sem custo: serve para provar que a contagem de tarefas padrão ignora
    // modelo inativo, sem mexer no gráfico de custo padrão.
    itens: [
      {
        id: "i-3",
        titulo: "Dessecação",
        eventType: "pulverizacao",
        offsetDias: -10,
        ancora: "inicio",
        priority: "normal",
        obrigatorio: true,
      },
    ],
  },
];

const events: CalendarEvent[] = [
  evento({
    id: "e1",
    title: "Plantio do Talhão A",
    eventType: "plantio",
    startsAt: "2026-07-15",
    talhaoId: "t-a",
    talhaoName: "Talhão A",
    responsibleName: "Ana",
    priority: "alta",
    estimatedCost: 1000,
  }),
  evento({
    id: "e2",
    title: "Colheita do Talhão A",
    eventType: "colheita",
    startsAt: "2026-07-20",
    talhaoId: "t-a",
    talhaoName: "Talhão A",
    responsibleName: "Ana",
    estimatedCost: 2000,
  }),
  evento({
    id: "e3",
    title: "Manutenção do pivô",
    eventType: "manutencao",
    startsAt: "2026-07-01",
    endsAt: "2026-07-05",
    statusId: "pendente",
    talhaoId: "t-b",
    talhaoName: "Talhão B",
    estimatedCost: 300,
    delayCost: 500,
  }),
  evento({
    id: "e4",
    title: "Adubação concluída",
    eventType: "adubacao",
    startsAt: "2026-06-10",
    statusId: "concluida",
    talhaoId: "t-b",
    talhaoName: "Talhão B",
    responsibleName: "Bruno",
    estimatedCost: 800,
  }),
  evento({
    id: "e5",
    title: "Vender ou estocar a safra",
    eventType: "decisao",
    startsAt: "2026-07-17",
    visibility: "gestor",
    delayCost: 1200,
  }),
  evento({
    id: "e6",
    title: "Trocar de fornecedor",
    eventType: "decisao",
    startsAt: "2026-07-02",
    statusId: "concluida",
    decisionSelected: "Manter fornecedor",
  }),
  evento({
    id: "e7",
    title: "Comprar fertilizante",
    eventType: "compra",
    startsAt: "2026-08-01",
    estimatedCost: 5000,
    templateId: "tpl-1",
  }),
];

const model: CalendarModel = {
  events,
  templates,
  statuses: defaultStatuses,
  talhoes,
  cycles,
  fazendas: ["Fazenda Boa Vista"],
  safras: ["2026/2027", "2027/2028"],
  responsaveis: ["Ana", "Bruno"],
};

// Um alerta de cada família: dois determinísticos e um de clima (mockForecast).
const alerts = [
  {
    key: "atraso:e3",
    rule: "tarefa-atrasada",
    severity: "atencao" as const,
    title: "Tarefa atrasada",
    description: "",
  },
  {
    key: "decisao-vencendo:e5",
    rule: "decisao-vencendo",
    severity: "critico" as const,
    title: "Decisão vencendo",
    description: "",
  },
  {
    key: "chuva-pulverizacao:e1:2026-07-15",
    rule: "chuva-antes-pulverizacao",
    severity: "critico" as const,
    title: "Chuva prevista",
    description: "",
  },
];

const spec = buildCalendarioOverview({ model, events, alerts, now: HOJE }, false);
const kpi = (label: string) => spec.kpis.find((item) => item.label === label);
const chart = (id: string) => spec.charts.find((item) => item.id === id);
const chartDe = (alvo: typeof spec, id: string) => alvo.charts.find((item) => item.id === id);

describe("buildCalendarioOverview — cobertura", () => {
  it("toda aba do módulo tem KPI, gráfico ou tabela", () => {
    expect(coverageReport(spec)).toBe("");
    expect(overviewCoverage(spec).missing).toEqual([]);
  });

  it("nenhum gráfico aponta para aba inexistente", () => {
    expect(overviewCoverage(spec).orphan).toEqual([]);
  });

  it("carrega o modo para o carimbo do export", () => {
    expect(buildCalendarioOverview({ model, now: HOJE }, true).demoMode).toBe(true);
    expect(spec.demoMode).toBe(false);
  });
});

describe("buildCalendarioOverview — módulo vazio", () => {
  const vazio = buildCalendarioOverview({}, false);

  it("sobrevive sem nenhum registro", () => {
    expect(overviewCoverage(vazio).missing).toEqual([]);
    expect(overviewCoverage(vazio).orphan).toEqual([]);
    expect(vazio.kpis.length).toBeGreaterThan(0);
    expect(vazio.charts.every((c) => Array.isArray(c.data))).toBe(true);
  });

  it("não inventa série nem tabela quando não há dado", () => {
    expect(vazio.charts.every((c) => c.data.length === 0)).toBe(true);
    expect(vazio.tables).toBeUndefined();
    expect(kpiDe(vazio, "Conclusão")?.value).toBe("0%");
  });

  function kpiDe(alvo: typeof vazio, label: string) {
    return alvo.kpis.find((item) => item.label === label);
  }
});

describe("buildCalendarioOverview — números reais", () => {
  it("conta atrasadas, conclusão e tarefas sem dono", () => {
    expect(kpi("Atrasadas")?.value).toBe(1); // e3 venceu em 05/07 e segue pendente
    expect(kpi("Conclusão")?.value).toBe("29%"); // e4 e e6 de 7 tarefas
    expect(kpi("Sem responsável")?.value).toBe(3); // e3, e5 e e7 (ativas, sem dono)
  });

  it("soma o desembolso das tarefas ativas dos próximos 30 dias", () => {
    // e1 (1.000) + e2 (2.000) + e7 (5.000); e3 começou antes de hoje e e4 já fechou.
    expect(String(kpi("Custo previsto (30 dias)")?.value)).toContain("8.000");
    expect(String(kpi("Impacto de atraso")?.value)).toContain("500");
  });

  it("agrupa o custo estimado por talhão", () => {
    const dados = chart("relatorios-custo-talhao")?.data;
    expect(dados).toEqual([
      { label: "Fazenda toda", valor: 5000 },
      { label: "Talhão A", valor: 3000 },
      { label: "Talhão B", valor: 1100 },
    ]);
  });

  it("distribui as tarefas pelo status efetivo (vencida vira atrasada)", () => {
    expect(chart("tarefas-status")?.data).toEqual([
      { label: "Planejada", total: 4 },
      { label: "Concluída", total: 2 },
      { label: "Atrasada", total: 1 },
    ]);
  });

  it("monta a carga mensal em ordem cronológica", () => {
    expect(chart("calendario-carga-mes")?.data).toEqual([
      { mes: "06/2026", tarefas: 1, concluidas: 1 },
      { mes: "07/2026", tarefas: 5, concluidas: 1 },
      { mes: "08/2026", tarefas: 1, concluidas: 0 },
    ]);
  });

  it("usa a área do talhão com tarefa na janela, não a área total", () => {
    // Só o Talhão A tem tarefa ativa alcançando os próximos 30 dias.
    expect(kpi("Área programada")?.value).toBe("120 ha");
  });

  it("ignora alerta de clima na contagem de conflitos", () => {
    // 3 alertas entram, mas o de chuva vem da previsão mockada e não conta.
    expect(kpi("Conflitos de cronograma")?.value).toBe(2);
    expect(kpi("Decisões vencendo")?.value).toBe(1);
  });

  it("lê ciclos e modelos do Talhão 360 e dos templates", () => {
    expect(kpi("Ciclos em andamento")?.value).toBe(2);
    expect(chart("linha-tempo-ciclos")?.data).toEqual([
      { label: "Planejado", total: 1 },
      { label: "Em andamento", total: 2 },
    ]);
    expect(kpi("Modelos ativos")?.value).toBe(1);
    // A "Dessecação" do modelo arquivado não entra: 2 itens do modelo ativo.
    expect(kpi("Modelos ativos")?.hint).toBe("2 tarefa(s) padrão nos modelos ativos");
    expect(chart("modelos-custo")?.data).toEqual([{ label: "Milho safrinha", valor: 350 }]);
    expect(chart("modelos-geracao")?.data).toEqual([{ label: "Milho safrinha", valor: 1 }]);
  });

  it("não mostra id cru quando o modelo que gerou a tarefa foi excluído", () => {
    // Excluir um modelo preserva as tarefas geradas — o templateId fica órfão.
    const semModelo = buildCalendarioOverview(
      { model: { ...model, templates: [] }, events, now: HOJE },
      false,
    );
    expect(chartDe(semModelo, "modelos-geracao")?.data).toEqual([
      { label: "Modelo removido", valor: 1 },
    ]);
  });

  it("não perde ciclo com status fora da lista canônica", () => {
    // ciclos_json do Talhão 360 não é validado: a rosca precisa somar o total.
    const comStatusEstranho = buildCalendarioOverview(
      {
        model: { ...model, cycles: [...cycles, { ...cycles[0], id: "c-4", status: "Colhendo" }] },
        events,
        now: HOJE,
      },
      false,
    );
    const dados = chartDe(comStatusEstranho, "linha-tempo-ciclos")?.data ?? [];
    expect(dados.at(-1)).toEqual({ label: "Outro", total: 1 });
    expect(dados.reduce((soma, item) => soma + Number(item.total), 0)).toBe(4);
  });

  it("quebra o desembolso previsto nas três janelas da aba", () => {
    // 7 e 15 dias pegam e1+e2 (3.000); 30 dias inclui e7 (5.000).
    expect(chart("relatorios-horizonte")?.data).toEqual([
      { label: "7 dias", valor: 3000 },
      { label: "15 dias", valor: 3000 },
      { label: "30 dias", valor: 8000 },
    ]);
    expect(chart("relatorios-custo-tipo")?.data).toEqual([
      { label: "Compra", valor: 5000 },
      { label: "Colheita", valor: 2000 },
      { label: "Plantio", valor: 1000 },
      { label: "Adubação", valor: 800 },
      { label: "Manutenção", valor: 300 },
    ]);
  });

  it("pinta cada fatia de semáforo na mesma ordem do dado", () => {
    for (const id of [
      "tarefas-status",
      "tarefas-prioridade",
      "decisoes-situacao",
      "linha-tempo-ciclos",
    ]) {
      const grafico = chart(id);
      expect(grafico?.colors, id).toHaveLength(grafico?.data.length ?? -1);
    }
    const status = chart("tarefas-status");
    const atrasada = status?.data.findIndex((item) => item.label === "Atrasada") ?? -1;
    expect(status?.colors?.[atrasada]).toBe(chartColors.destructive);
  });

  it("separa decisões pendentes das decididas", () => {
    expect(kpi("Decisões pendentes")?.value).toBe(1);
    expect(chart("decisoes-situacao")?.data).toEqual([
      { label: "Pendentes", total: 1 },
      { label: "Decididas", total: 1 },
    ]);
    expect(chart("decisoes-impacto")?.data).toEqual([
      { label: "Vender ou estocar a safra", valor: 1200 },
    ]);
  });

  it("lista as tarefas atrasadas com prazo e responsável", () => {
    const tabela = spec.tables?.find((t) => t.id === "tarefas-atrasadas");
    expect(tabela?.body).toEqual([
      ["Manutenção do pivô", "Manutenção", "Talhão B", "05/07/2026", "sem responsável"],
    ]);
  });
});
