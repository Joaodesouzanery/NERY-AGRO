// Dados DEMO do Calendário — Fazenda Santa Helena (Rio Verde/GO, safra 2025/2026),
// alinhados aos talhões demo do Talhão 360 (Talhões 01, 02 e 03). Datas são
// relativas a `now` para a Visão Geral ficar viva em qualquer dia. Dados demo
// nunca vão ao Supabase (ver data/demo-store.ts).
import { addDays, format } from "date-fns";
import type { FieldRecord } from "@/lib/supabase-field";
import { demoTalhao360Records } from "@/features/talhao-360/data/mocks";
import {
  eventToPayload,
  templateToPayload,
  CALENDAR_EVENT_MODULE,
  CALENDAR_TEMPLATE_MODULE,
} from "@/features/campo-calendar/api/services";
import type {
  CalendarEvent,
  CalendarEventType,
  CalendarPriority,
  CycleTemplate,
} from "@/features/campo-calendar/types/domain";

const day = (now: Date, offset: number) => format(addDays(now, offset), "yyyy-MM-dd");

type DemoSeed = {
  id: string;
  title: string;
  eventType: CalendarEventType;
  offset: number;
  endOffset?: number;
  talhaoId?: string;
  talhaoName?: string;
  cycleId?: string;
  cicloNome?: string;
  statusId?: string;
  priority?: CalendarPriority;
  responsibleName?: string;
  estimatedCost?: number;
  delayCost?: number;
  visibility?: CalendarEvent["visibility"];
  source?: CalendarEvent["source"];
  description?: string;
  decisionOptions?: string[];
  templateId?: string;
};

const seeds: DemoSeed[] = [
  {
    id: "cal-demo-monitorar-pragas",
    title: "Monitorar pragas no Talhão 03",
    eventType: "monitoramento",
    offset: 0,
    talhaoId: "talhao-demo-03",
    talhaoName: "Talhão 03",
    cycleId: "cycle-soja-2025",
    cicloNome: "Soja Verão",
    statusId: "pendente",
    priority: "critica",
    responsibleName: "João Silva",
    source: "alerta",
    description: "Lagarta detectada em nível de atenção. Vistoria dirigida na bordadura.",
  },
  {
    id: "cal-demo-plantio-t01",
    title: "Executar plantio no Talhão 01",
    eventType: "plantio",
    offset: 0,
    endOffset: 2,
    talhaoId: "talhao-demo-01",
    talhaoName: "Talhão 01",
    cicloNome: "Milho Safrinha",
    cycleId: "cycle-milho-2026",
    statusId: "em-andamento",
    priority: "alta",
    responsibleName: "Equipe Alpha",
    estimatedCost: 38500,
  },
  {
    id: "cal-demo-cotar-defensivo",
    title: "Cotar defensivo para pulverização",
    eventType: "compra",
    offset: 1,
    statusId: "pendente",
    priority: "alta",
    estimatedCost: 24800,
    description: "Compra tratada como tarefa do cronograma — sem módulo de estoque.",
  },
  {
    id: "cal-demo-adubacao-t02",
    title: "Adubação de cobertura no Talhão 02",
    eventType: "adubacao",
    offset: 3,
    talhaoId: "talhao-demo-02",
    talhaoName: "Talhão 02",
    cycleId: "cycle-soja-2025",
    cicloNome: "Soja Verão",
    statusId: "planejada",
    priority: "normal",
    responsibleName: "Ana Costa",
    estimatedCost: 18200,
  },
  {
    id: "cal-demo-pulverizacao-t03",
    title: "Pulverização pós-emergente no Talhão 03",
    eventType: "pulverizacao",
    offset: 2,
    talhaoId: "talhao-demo-03",
    talhaoName: "Talhão 03",
    cycleId: "cycle-soja-2025",
    cicloNome: "Soja Verão",
    statusId: "planejada",
    priority: "critica",
    estimatedCost: 12600,
    delayCost: 5200,
    description: "Sem responsável definido — regra de alerta deve apontar.",
  },
  {
    id: "cal-demo-revisao-plantadeira",
    title: "Revisão da plantadeira",
    eventType: "manutencao",
    offset: -4,
    statusId: "pendente",
    priority: "alta",
    responsibleName: "Marcos Lima",
    estimatedCost: 6400,
    delayCost: 2100,
    description: "Tarefa vencida — deve aparecer como atrasada.",
  },
  {
    id: "cal-demo-comprar-kcl",
    title: "Comprar KCl para safrinha",
    eventType: "compra",
    offset: 9,
    statusId: "planejada",
    priority: "normal",
    estimatedCost: 61000,
  },
  {
    id: "cal-demo-vistoria-t02",
    title: "Vistoria de stand no Talhão 02",
    eventType: "monitoramento",
    offset: 6,
    talhaoId: "talhao-demo-02",
    talhaoName: "Talhão 02",
    statusId: "planejada",
    priority: "normal",
    responsibleName: "Ana Costa",
  },
  {
    id: "cal-demo-colheita-t03",
    title: "Colheita da soja no Talhão 03",
    eventType: "colheita",
    offset: 24,
    endOffset: 27,
    talhaoId: "talhao-demo-03",
    talhaoName: "Talhão 03",
    cycleId: "cycle-soja-2025",
    cicloNome: "Soja Verão",
    statusId: "planejada",
    priority: "alta",
    responsibleName: "Equipe Alpha",
    estimatedCost: 44200,
  },
  {
    id: "cal-demo-relatorio-safra",
    title: "Fechar relatório mensal da safra",
    eventType: "administrativa",
    offset: 12,
    statusId: "planejada",
    priority: "baixa",
    responsibleName: "Administrativo",
  },
  {
    id: "cal-demo-decisao-cultivar",
    title: "Escolher cultivar do Milho Safrinha",
    eventType: "decisao",
    offset: 5,
    talhaoId: "talhao-demo-03",
    talhaoName: "Talhão 03",
    cycleId: "cycle-milho-2026",
    cicloNome: "Milho Safrinha",
    statusId: "pendente",
    priority: "critica",
    visibility: "gestor",
    source: "decisao",
    delayCost: 14000,
    description: "Impacta a janela do Talhão 03 e o custo previsto do próximo ciclo.",
    decisionOptions: ["Híbrido precoce (menor risco)", "Híbrido super precoce", "Adiar 10 dias"],
  },
  {
    id: "cal-demo-decisao-cobertura",
    title: "Manter Cobertura/Pousio no plano",
    eventType: "decisao",
    offset: 15,
    talhaoId: "talhao-demo-03",
    talhaoName: "Talhão 03",
    cycleId: "cycle-cover-2026",
    cicloNome: "Cobertura/Pousio",
    statusId: "planejada",
    priority: "normal",
    visibility: "gestor",
    source: "decisao",
    decisionOptions: ["Manter cobertura", "Remover do calendário"],
  },
];

export function demoCalendarEvent(seed: DemoSeed, now: Date): CalendarEvent {
  return {
    id: seed.id,
    fazenda: "Fazenda Santa Helena",
    talhaoId: seed.talhaoId,
    talhaoName: seed.talhaoName,
    safra: "2025/2026",
    cycleId: seed.cycleId,
    cicloNome: seed.cicloNome,
    title: seed.title,
    description: seed.description,
    eventType: seed.eventType,
    startsAt: day(now, seed.offset),
    endsAt: seed.endOffset != null ? day(now, seed.endOffset) : undefined,
    allDay: true,
    statusId: seed.statusId ?? "planejada",
    priority: seed.priority ?? "normal",
    responsibleName: seed.responsibleName,
    source: seed.source ?? "manual",
    visibility: seed.visibility ?? "equipe",
    estimatedCost: seed.estimatedCost,
    delayCost: seed.delayCost,
    decisionOptions: seed.decisionOptions,
    templateId: seed.templateId,
  };
}

export const demoTemplates: CycleTemplate[] = [
  {
    id: "template-soja-verao",
    nome: "Soja Verão",
    cultura: "Soja",
    cicloTipo: "Produção",
    regime: "sequeiro",
    duracaoDias: 150,
    ativo: true,
    itens: [
      {
        id: "soja-dessecacao",
        titulo: "Dessecação pré-plantio",
        eventType: "pulverizacao",
        offsetDias: -10,
        ancora: "inicio",
        priority: "alta",
        custoEstimado: 180,
        obrigatorio: true,
      },
      {
        id: "soja-plantio",
        titulo: "Plantio da soja",
        eventType: "plantio",
        offsetDias: 0,
        ancora: "inicio",
        priority: "critica",
        custoEstimado: 900,
        obrigatorio: true,
      },
      {
        id: "soja-monitoramento",
        titulo: "Monitoramento de pragas (V4)",
        eventType: "monitoramento",
        offsetDias: 30,
        ancora: "inicio",
        priority: "alta",
        obrigatorio: true,
      },
      {
        id: "soja-fungicida",
        titulo: "Aplicação de fungicida (R1)",
        eventType: "pulverizacao",
        offsetDias: 60,
        ancora: "inicio",
        priority: "alta",
        custoEstimado: 260,
        obrigatorio: false,
      },
      {
        id: "soja-colheita",
        titulo: "Colheita",
        eventType: "colheita",
        offsetDias: 0,
        ancora: "fim",
        priority: "critica",
        obrigatorio: true,
      },
    ],
  },
  {
    id: "template-milho-safrinha",
    nome: "Milho Safrinha",
    cultura: "Milho",
    cicloTipo: "Produção",
    regime: "sequeiro",
    duracaoDias: 140,
    ativo: true,
    itens: [
      {
        id: "milho-plantio",
        titulo: "Plantio do milho safrinha",
        eventType: "plantio",
        offsetDias: 0,
        ancora: "inicio",
        priority: "critica",
        custoEstimado: 780,
        obrigatorio: true,
      },
      {
        id: "milho-nitrogenio",
        titulo: "Cobertura nitrogenada",
        eventType: "adubacao",
        offsetDias: 25,
        ancora: "inicio",
        priority: "alta",
        custoEstimado: 420,
        obrigatorio: true,
      },
      {
        id: "milho-cigarrinha",
        titulo: "Monitorar cigarrinha",
        eventType: "monitoramento",
        offsetDias: 20,
        ancora: "anterior",
        priority: "alta",
        obrigatorio: true,
      },
      {
        id: "milho-colheita",
        titulo: "Colheita do milho",
        eventType: "colheita",
        offsetDias: 0,
        ancora: "fim",
        priority: "critica",
        obrigatorio: true,
      },
    ],
  },
  {
    id: "template-cobertura",
    nome: "Cobertura/Pousio",
    cultura: "Cobertura",
    cicloTipo: "Cobertura",
    regime: "ambos",
    duracaoDias: 45,
    ativo: true,
    itens: [
      {
        id: "cobertura-semeadura",
        titulo: "Semeadura da cobertura",
        eventType: "plantio",
        offsetDias: 0,
        ancora: "inicio",
        priority: "normal",
        custoEstimado: 210,
        obrigatorio: true,
      },
      {
        id: "cobertura-vistoria",
        titulo: "Vistoria de estabelecimento",
        eventType: "monitoramento",
        offsetDias: 20,
        ancora: "inicio",
        priority: "baixa",
        obrigatorio: false,
      },
    ],
  },
];

function eventRecord(event: CalendarEvent): FieldRecord {
  const { id, ...rest } = event;
  return {
    id,
    module: CALENDAR_EVENT_MODULE,
    payload: eventToPayload(rest),
    created_at: "2026-01-05T12:00:00.000Z",
    updated_at: "2026-01-05T12:00:00.000Z",
  };
}

/** Registro legado demo — comprova o adapter de module = calendario. */
export function demoLegacyRecord(now: Date): FieldRecord {
  return {
    id: "cal-demo-legado",
    module: "calendario",
    payload: {
      cultura: "Hortaliças",
      talhao: "Talhão 02",
      plantio_inicio: day(now, -20),
      colheita_prevista: day(now, 40),
      sazonalidade: "Inverno seco",
      alerta: "15 dias",
    },
    created_at: "2025-06-01T12:00:00.000Z",
  };
}

/** Snapshot demo completo: eventos + modelos + legado + talhões/ciclos do Talhão 360. */
export function demoCalendarRecords(now: Date): FieldRecord[] {
  return [
    ...seeds.map((seed) => eventRecord(demoCalendarEvent(seed, now))),
    ...demoTemplates.map((template) => ({
      id: template.id,
      module: CALENDAR_TEMPLATE_MODULE,
      payload: templateToPayload(template),
    })),
    demoLegacyRecord(now),
    ...demoTalhao360Records,
  ];
}
