import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  CalendarDays,
  Download,
  Edit3,
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  QrCode,
  Scale,
  Search,
  Sprout,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { parseWeightHistory, upcomingVaccinations } from "@/lib/pecuaria-metrics";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import {
  createOperationRecord,
  deleteOperationRecord,
  listOperationRecordsByAreaModule,
  OperationRecord,
  updateOperationRecord,
} from "@/lib/supabase-operations";
import { useDemoMode } from "@/hooks/use-demo-mode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PeriodPicker, defaultPeriod, type PeriodValue } from "@/components/period-picker";
import { ImportRecordsButton } from "@/components/import-records-button";
import { exportRowsToXlsx } from "@/lib/export-xlsx";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import {
  downloadAnimalPdf,
  downloadStoredAnimalPdf,
  listAnimalPdfRecords,
  saveAnimalPdfVersion,
} from "@/lib/animal-pdfs";

export const Route = createFileRoute("/pecuaria")({
  head: () => ({
    meta: [
      { title: "Pecuária e Animais - Nery Logística" },
      {
        name: "description",
        content:
          "Gestão de animais, vacinação, reprodução, produção diária e pastagens com CRUD real e modo demo protegido.",
      },
    ],
  }),
  component: PecuariaPage,
});

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea";
  hint?: string;
};

type ModuleConfig = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FieldConfig[];
};

const AREA = "pecuaria";

const modules: ModuleConfig[] = [
  {
    id: "animal",
    label: "Ficha Individual por Animal",
    shortLabel: "Animais",
    description: "Saúde, peso, linhagem, vacinação, QR no brinco e genealogia.",
    icon: QrCode,
    fields: [
      { key: "identificacao", label: "Identificação" },
      { key: "especie", label: "Espécie" },
      { key: "raca", label: "Raça" },
      { key: "sexo", label: "Sexo" },
      { key: "nascimento", label: "Nascimento", type: "date" },
      { key: "peso_atual", label: "Peso atual (kg)", type: "number" },
      { key: "linhagem", label: "Linhagem" },
      { key: "brinco_qr", label: "QR no brinco" },
      { key: "historico_pesagens", label: "Histórico de pesagens", type: "textarea" },
      { key: "genealogia", label: "Genealogia", type: "textarea" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "vacinacao",
    label: "Controle de Vacinação",
    shortLabel: "Vacinação",
    description: "Calendário sanitário, alertas de reforço e lote da vacina.",
    icon: BellRing,
    fields: [
      { key: "animal_lote", label: "Animal ou lote" },
      { key: "vacina", label: "Vacina" },
      { key: "lote_vacina", label: "Lote da vacina" },
      { key: "data", label: "Data aplicada", type: "date" },
      { key: "proxima_dose", label: "Próxima dose", type: "date" },
      { key: "calendario_oficial", label: "Calendário oficial" },
      { key: "alerta_reforco", label: "Alerta de reforço", hint: "Ex.: 7 dias antes" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "reprodutivo",
    label: "Ciclo Reprodutivo",
    shortLabel: "Reprodução",
    description: "Coberturas, gestações, nascimentos, cio, parto e prenhez.",
    icon: CalendarDays,
    fields: [
      { key: "animal", label: "Animal" },
      { key: "evento", label: "Evento", hint: "Cio, cobertura, gestação, nascimento" },
      { key: "data", label: "Data", type: "date" },
      { key: "previsao_parto", label: "Previsão de parto", type: "date" },
      { key: "calendario_cio", label: "Calendário de cio" },
      { key: "taxa_prenhez", label: "Taxa de prenhez (%)", type: "number" },
      { key: "observacao", label: "Observação", type: "textarea" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "producao",
    label: "Produção Diária",
    shortLabel: "Produção",
    description: "Coleta de leite, ovos ou mel por animal ou lote, médias e tendências.",
    icon: Scale,
    fields: [
      { key: "animal_lote", label: "Animal ou lote" },
      { key: "produto", label: "Produto", hint: "Leite, ovos, mel" },
      { key: "quantidade", label: "Quantidade", type: "number" },
      { key: "unidade", label: "Unidade" },
      { key: "media", label: "Média", type: "number" },
      { key: "tendencia", label: "Tendência" },
      { key: "data", label: "Data", type: "date" },
      { key: "observacao", label: "Observação", type: "textarea" },
    ],
  },
  {
    id: "pastagens",
    label: "Gestão de Pastagens",
    shortLabel: "Pastagens",
    description: "Rodízio de piquetes, descanso do solo e lotação por hectare.",
    icon: Sprout,
    fields: [
      { key: "piquete", label: "Piquete" },
      { key: "lote", label: "Lote" },
      { key: "area_ha", label: "Área (ha)", type: "number" },
      { key: "lotacao_hectare", label: "Lotação por hectare", type: "number" },
      { key: "dias_uso", label: "Dias de uso", type: "number" },
      { key: "dias_descanso", label: "Dias de descanso", type: "number" },
      { key: "rotacao", label: "Rotação automática" },
      { key: "status", label: "Status" },
    ],
  },
];

const demoByModule: Record<string, OperationRecord[]> = {
  animal: [
    record("animal", "1", {
      identificacao: "BR-0421",
      especie: "Bovino",
      raca: "Girolando",
      sexo: "Fêmea",
      nascimento: "2023-08-14",
      peso_atual: "418",
      linhagem: "Matriz A12 x Touro G5",
      brinco_qr: "QR-BR-0421",
      historico_pesagens: "2026-03: 398 kg; 2026-05: 418 kg",
      genealogia: "Mãe BR-0188, pai G5",
      status: "Ativo",
    }),
  ],
  vacinacao: [
    record("vacinacao", "1", {
      animal_lote: "Lote Bezerras 01",
      vacina: "Clostridial",
      lote_vacina: "VAC-9982",
      data: "2026-05-12",
      proxima_dose: "2026-06-12",
      calendario_oficial: "Sanitário anual",
      alerta_reforco: "7 dias antes",
      status: "Reforço previsto",
    }),
  ],
  reprodutivo: [
    record("reprodutivo", "1", {
      animal: "BR-0421",
      evento: "Cobertura",
      data: "2026-05-03",
      previsao_parto: "2027-02-07",
      calendario_cio: "Retorno em 21 dias",
      taxa_prenhez: "72",
      observacao: "Acompanhar confirmação por ultrassom.",
      status: "Em acompanhamento",
    }),
  ],
  producao: [
    record("producao", "1", {
      animal_lote: "Lote Ordenha 02",
      produto: "Leite",
      quantidade: "320",
      unidade: "litros",
      media: "26.7",
      tendencia: "Alta",
      data: "2026-05-30",
      observacao: "Coleta matinal acima da média.",
    }),
  ],
  pastagens: [
    record("pastagens", "1", {
      piquete: "Piquete 04",
      lote: "Novilhas",
      area_ha: "3.5",
      lotacao_hectare: "2.1",
      dias_uso: "4",
      dias_descanso: "28",
      rotacao: "Automática semanal",
      status: "Em descanso",
    }),
  ],
};

function record(module: string, id: string, payload: Record<string, string>): OperationRecord {
  return {
    id: `demo-pecuaria-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function emptyPayload(module: ModuleConfig) {
  return Object.fromEntries(module.fields.map((field) => [field.key, ""]));
}

function numberValue(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function exportXlsx(module: ModuleConfig, records: OperationRecord[]) {
  const header = module.fields.map((field) => field.label);
  const rows = records.map((recordItem) =>
    module.fields.map((field) => recordItem.payload[field.key] ?? ""),
  );
  exportRowsToXlsx(`nery-pecuaria-${module.id}`, header, rows, module.shortLabel);
}

function PecuariaPage() {
  const { demoMode } = useDemoMode();
  const [period, setPeriod] = useState<PeriodValue>(defaultPeriod());
  const [tab, setTab] = useState("visao-geral");
  const current = modules.find((module) => module.id === tab);

  return (
    <div className="px-8 py-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pecuária / Animais</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {demoMode
              ? "Modo DEMO ligado: exemplos protegidos contra edição."
              : "Modo DEMO desligado: salvando registros reais no Supabase."}
          </p>
        </div>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <button
          onClick={() => setTab("visao-geral")}
          className={cn(
            "min-h-16 rounded-lg border p-3 text-left text-sm font-medium transition-colors",
            tab === "visao-geral"
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          <span className="flex items-start gap-2">
            <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="line-clamp-2 leading-snug">Visão Geral</span>
          </span>
        </button>
        {modules.map((module) => {
          const active = module.id === tab;
          return (
            <button
              key={module.id}
              onClick={() => setTab(module.id)}
              className={cn(
                "min-h-16 rounded-lg border p-3 text-left text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="flex items-start gap-2">
                <module.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="line-clamp-2 leading-snug">{module.shortLabel}</span>
              </span>
            </button>
          );
        })}
      </div>

      {tab === "visao-geral" && <PecuariaDashboard demoMode={demoMode} />}
      {current && <ModuleTab module={current} />}
    </div>
  );
}

function PecuariaDashboard({ demoMode }: { demoMode: boolean }) {
  const queries = useQuery({
    queryKey: ["operation-records", AREA, "dashboard", demoMode],
    queryFn: async () => {
      const all = await Promise.all(
        modules.map((module) => listOperationRecordsByAreaModule(AREA, module.id)),
      );
      return Object.fromEntries(modules.map((module, index) => [module.id, all[index]]));
    },
    enabled: !demoMode,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const data = demoMode
    ? demoByModule
    : ((queries.data ?? {}) as Record<string, OperationRecord[]>);
  const animais = data.animal?.length ?? 0;
  const vacinas = (data.vacinacao ?? []).filter(
    (recordItem) => recordItem.payload.proxima_dose,
  ).length;
  const producao = (data.producao ?? []).reduce(
    (sum, recordItem) => sum + numberValue(recordItem.payload.quantidade),
    0,
  );
  const piquetes = data.pastagens?.length ?? 0;
  const moduleVolume = modules.map((module) => ({
    label: module.shortLabel,
    valor: data[module.id]?.length ?? 0,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const vaccinations = upcomingVaccinations(data.vacinacao ?? [], today).slice(0, 8);
  const animalsWithWeight = (data.animal ?? []).filter(
    (a) => parseWeightHistory(a.payload.historico_pesagens).length >= 2,
  );
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const currentAnimal =
    animalsWithWeight.find((a) => a.id === selectedAnimalId) ?? animalsWithWeight[0];
  const weightSeries = currentAnimal
    ? parseWeightHistory(currentAnimal.payload.historico_pesagens)
    : [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Animais/Lotes" value={String(animais)} />
        <Kpi label="Vacinas próximas" value={String(vacinas)} tone="warning" />
        <Kpi label="Produção registrada" value={String(producao)} tone="success" />
        <Kpi label="Piquetes" value={String(piquetes)} tone="info" />
      </div>
      <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-4">
          <h2 className="font-semibold">Registros por módulo</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Volume cadastrado em cada frente da pecuária.
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={moduleVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="valor" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Calendário de vacinação */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h2 className="font-semibold">Calendário de vacinação</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Próximas doses ordenadas por data; vencidas em destaque.
          </p>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {vaccinations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma dose programada (campo "Próxima dose" nas vacinações).
              </p>
            ) : (
              vaccinations.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{v.animalLote}</div>
                    <div className="truncate text-xs text-muted-foreground">{v.vacina}</div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {v.proximaDose}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[11px] font-medium",
                        v.overdue
                          ? "bg-destructive/12 text-destructive"
                          : "bg-success/12 text-success",
                      )}
                    >
                      {v.overdue ? "Vencida" : `${v.daysUntil}d`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Curva de peso */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Curva de peso</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Evolução do histórico de pesagens por animal.
              </p>
            </div>
            {animalsWithWeight.length > 0 && (
              <select
                value={currentAnimal?.id ?? ""}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
              >
                {animalsWithWeight.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.payload.identificacao || a.id}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mt-4 h-56">
            {weightSeries.length < 2 ? (
              <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                Preencha o "Histórico de pesagens" do animal (ex.: "2026-03: 398 kg; 2026-05: 418
                kg").
              </p>
            ) : (
              <ResponsiveContainer>
                <LineChart data={weightSeries} margin={{ left: -8, right: 8, top: 8 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} unit="kg" />
                  <Tooltip formatter={(v: number) => `${v} kg`} />
                  <Line
                    type="monotone"
                    dataKey="peso"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "success" | "info";
}) {
  const toneClass = {
    default: "text-foreground",
    warning: "text-warning-foreground",
    success: "text-success",
    info: "text-primary",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1.5 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function exportAnimalXlsx(records: OperationRecord[]) {
  const module = modules.find((item) => item.id === "animal");
  if (!module) return;
  const header = module.fields.map((field) => field.label);
  const rows = records.map((recordItem) =>
    module.fields.map((field) => recordItem.payload[field.key] ?? ""),
  );
  exportRowsToXlsx("nery-pecuaria-animais", header, rows, module.shortLabel);
}

function AnimalPdfLibrary({
  records,
  demoMode,
}: {
  records: OperationRecord[];
  demoMode: boolean;
}) {
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const pdfQuery = useQuery({
    queryKey: ["animal-pdfs"],
    queryFn: listAnimalPdfRecords,
    enabled: !demoMode,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const filteredAnimals = records.filter((recordItem) =>
    [
      recordItem.payload.identificacao,
      recordItem.payload.especie,
      recordItem.payload.raca,
      recordItem.payload.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const filteredPdfs = (pdfQuery.data ?? []).filter((item) =>
    [
      item.animal_identifier,
      item.file_name,
      item.payload_snapshot?.especie,
      item.payload_snapshot?.raca,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const bulkPdf = async () => {
    if (!filteredAnimals.length) {
      toast.info("Nenhum animal encontrado para exportar.");
      return;
    }
    setProgress(0);
    for (const [index, animal] of filteredAnimals.entries()) {
      downloadAnimalPdf(animal);
      setProgress(Math.round(((index + 1) / filteredAnimals.length) * 100));
      await new Promise((resolve) => window.setTimeout(resolve, 180));
    }
    toast.success("Exportação em massa concluída.");
    window.setTimeout(() => setProgress(null), 1200);
  };

  return (
    <div className="mb-5 rounded-xl border border-border bg-background/60 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">Biblioteca de PDFs por Animal</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Fichas versionadas por animal, busca, reemissão e exportação em massa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={bulkPdf}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-muted"
          >
            <FileText className="h-3.5 w-3.5" />
            Exportar PDFs
          </button>
          <button
            onClick={() => exportAnimalXlsx(filteredAnimals)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar Excel
          </button>
        </div>
      </div>

      <label className="mb-3 flex h-10 max-w-md items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por identificação, espécie, raça ou status..."
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
      </label>

      {progress !== null && (
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Fichas atuais
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {filteredAnimals.map((animal) => (
              <div
                key={animal.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {animal.payload.identificacao || "Animal sem identificação"}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {[animal.payload.especie, animal.payload.raca, animal.payload.status]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <button
                  onClick={() => downloadAnimalPdf(animal)}
                  className="h-8 rounded-md border border-border px-2 text-xs hover:bg-muted"
                >
                  Baixar
                </button>
              </div>
            ))}
            {filteredAnimals.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum animal encontrado.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Histórico salvo
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {demoMode && (
              <div className="rounded-md border border-border px-3 py-3 text-xs text-muted-foreground">
                No DEMO, os PDFs são gerados localmente. O histórico salvo aparece no modo real.
              </div>
            )}
            {!demoMode &&
              filteredPdfs.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{item.animal_identifier}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      Versão {item.version} · {new Date(item.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <button
                    onClick={() => void downloadStoredAnimalPdf(item)}
                    className="h-8 rounded-md border border-border px-2 text-xs hover:bg-muted"
                  >
                    Baixar
                  </button>
                </div>
              ))}
            {!demoMode && !pdfQuery.isLoading && filteredPdfs.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma versão salva encontrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function animalQrValue(recordItem: OperationRecord) {
  return (
    recordItem.payload.brinco_qr ||
    recordItem.payload.identificacao ||
    recordItem.payload.codigo ||
    recordItem.id
  );
}

function exportAnimalQr(recordItem: OperationRecord) {
  const canvas = document.getElementById(`animal-qr-${recordItem.id}`) as HTMLCanvasElement | null;
  if (!canvas) {
    toast.error("QR Code ainda nao esta pronto para exportar.");
    return;
  }
  const link = document.createElement("a");
  const safeName = animalQrValue(recordItem).replace(/[^a-zA-Z0-9_-]/g, "_");
  link.href = canvas.toDataURL("image/png");
  link.download = `qr-animal-${safeName}.png`;
  link.click();
}

function ModuleTab({ module }: { module: ModuleConfig }) {
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OperationRecord | null>(null);
  const [payload, setPayload] = useState<Record<string, string>>(emptyPayload(module));
  const [qrRecord, setQrRecord] = useState<OperationRecord | null>(null);

  const query = useQuery({
    queryKey: ["operation-records", AREA, module.id],
    queryFn: () => listOperationRecordsByAreaModule(AREA, module.id),
    enabled: !demoMode,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const records = useMemo<OperationRecord[]>(
    () => (demoMode ? (demoByModule[module.id] ?? []) : (query.data ?? [])),
    [demoMode, module.id, query.data],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["operation-records", AREA, module.id] });
    void queryClient.invalidateQueries({ queryKey: ["operation-records", AREA, "dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["animal-pdfs"] });
    invalidateConnectedQueries(queryClient);
  };

  const regenerateAnimalPdf = async (recordItem: OperationRecord) => {
    if (demoMode || module.id !== "animal") return;
    try {
      await saveAnimalPdfVersion(recordItem);
      toast.success("PDF do animal atualizado e salvo na biblioteca.");
      void queryClient.invalidateQueries({ queryKey: ["animal-pdfs"] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Animal salvo, mas o PDF não foi salvo: ${error.message}`
          : "Animal salvo, mas o PDF não foi salvo.",
      );
    }
  };

  const createMutation = useMutation({
    mutationFn: createOperationRecord,
    onSuccess: async (recordItem) => {
      toast.success("Registro adicionado.");
      setOpen(false);
      invalidate();
      await regenerateAnimalPdf(recordItem);
    },
    onError: (error) => toast.error(error.message),
  });
  const updateMutation = useMutation({
    mutationFn: updateOperationRecord,
    onSuccess: async (recordItem) => {
      toast.success("Registro atualizado.");
      setOpen(false);
      invalidate();
      await regenerateAnimalPdf(recordItem);
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteOperationRecord,
    onSuccess: () => {
      toast.success("Registro excluído.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const generateAnimalPdf = async (recordItem: OperationRecord) => {
    if (demoMode) {
      toast.info("Desligue o modo DEMO para gerar e salvar PDFs.");
      return;
    }
    setPdfLoadingId(recordItem.id);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const ident = recordItem.payload.identificacao || recordItem.id.slice(0, 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Ficha do Animal — Nery Agro", 40, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Identificação: ${ident}`, 40, 75);
      doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 40, 92);
      doc.setDrawColor(200);
      doc.line(40, 102, 555, 102);

      let y = 125;
      module.fields.forEach((field) => {
        const value = recordItem.payload[field.key];
        if (!value) return;
        doc.setFont("helvetica", "bold");
        doc.text(`${field.label}:`, 40, y);
        doc.setFont("helvetica", "normal");
        const wrapped = doc.splitTextToSize(String(value), 380);
        doc.text(wrapped, 200, y);
        y += Math.max(18, wrapped.length * 14);
        if (y > 780) {
          doc.addPage();
          y = 50;
        }
      });

      const blob = doc.output("blob");
      const safeIdent = ident.replace(/[^a-zA-Z0-9_-]/g, "_");
      const path = `${recordItem.id}/${safeIdent}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("animal-pdfs")
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from("animal-pdfs").getPublicUrl(path);
      const pdfUrl = urlData.publicUrl;

      await updateMutation.mutateAsync({
        id: recordItem.id,
        payload: { ...recordItem.payload, pdf_url: pdfUrl },
      });

      window.open(pdfUrl, "_blank", "noopener");
      toast.success("PDF gerado e salvo na ficha do animal.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar PDF.");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const beginCreate = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para cadastrar dados reais.");
    setEditing(null);
    setPayload(emptyPayload(module));
    setOpen(true);
  };

  const beginEdit = (recordItem: OperationRecord) => {
    if (demoMode) return toast.info("Dados demo não podem ser editados.");
    setEditing(recordItem);
    setPayload({ ...emptyPayload(module), ...recordItem.payload });
    setOpen(true);
  };

  const submit = () => {
    if (demoMode) return;
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate({ area: AREA, module: module.id, payload });
  };

  const importRows = async (rows: Record<string, string>[]) => {
    if (demoMode) return toast.info("Desligue o modo DEMO para importar dados reais.");
    for (const row of rows) {
      const created = await createOperationRecord({ area: AREA, module: module.id, payload: row });
      if (module.id === "animal") await saveAnimalPdfVersion(created);
    }
    invalidate();
  };

  const loading = !demoMode && query.isLoading;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <module.icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">{module.label}</h3>
            <p className="text-xs text-muted-foreground">{module.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ImportRecordsButton fields={module.fields} disabled={demoMode} onImport={importRows} />
          <button
            onClick={() =>
              records.length
                ? exportXlsx(module, records)
                : toast.info("Nenhum registro para exportar.")
            }
            className="h-9 rounded-lg border border-border px-3 text-sm flex items-center gap-2 hover:bg-muted"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Excel
          </button>
          <button
            onClick={beginCreate}
            className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      {module.id === "animal" && <AnimalPdfLibrary records={records} demoMode={demoMode} />}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              {module.fields.slice(0, 6).map((field) => (
                <th key={field.key} className="py-3 pr-4 font-medium">
                  {field.label}
                </th>
              ))}
              <th className="py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`sk-${idx}`} className="border-b border-border last:border-0">
                  {module.fields.slice(0, 6).map((field) => (
                    <td key={field.key} className="py-3 pr-4">
                      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                  <td className="py-3">
                    <div className="ml-auto h-3 w-16 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))}
            {!loading &&
              records.map((recordItem) => (
                <tr key={recordItem.id} className="border-b border-border last:border-0">
                  {module.fields.slice(0, 6).map((field) => (
                    <td key={field.key} className="py-3 pr-4">
                      {recordItem.payload[field.key] || "-"}
                    </td>
                  ))}
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      {module.id === "animal" && (
                        <button
                          onClick={() => setQrRecord(recordItem)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-xs hover:bg-muted"
                          aria-label="Visualizar QR Code"
                          title="Visualizar e exportar QR Code"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          QR
                        </button>
                      )}
                      {module.id === "animal" && (
                        <button
                          onClick={() => {
                            if (recordItem.payload.pdf_url) {
                              window.open(recordItem.payload.pdf_url, "_blank", "noopener");
                            } else {
                              void generateAnimalPdf(recordItem);
                            }
                          }}
                          disabled={pdfLoadingId === recordItem.id}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-xs hover:bg-muted disabled:opacity-60"
                          aria-label="Gerar PDF"
                          title={recordItem.payload.pdf_url ? "Abrir PDF salvo" : "Gerar PDF"}
                        >
                          {pdfLoadingId === recordItem.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                          PDF
                        </button>
                      )}
                      <button
                        onClick={() => beginEdit(recordItem)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                        aria-label="Editar"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (demoMode) return toast.info("Dados demo não podem ser excluídos.");
                          if (window.confirm("Excluir este registro?"))
                            deleteMutation.mutate(recordItem.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum registro real cadastrado neste módulo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar registro" : "Adicionar registro"}</DialogTitle>
            <DialogDescription>{module.label}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {module.fields.map((field) => (
              <label key={field.key} className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">
                  {field.label}
                  {field.hint && (
                    <span className="ml-1 text-[10px] opacity-70">({field.hint})</span>
                  )}
                </span>
                {field.type === "textarea" ? (
                  <textarea
                    value={payload[field.key] ?? ""}
                    onChange={(event) =>
                      setPayload((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                ) : (
                  <input
                    type={field.type ?? "text"}
                    step={field.type === "number" ? "any" : undefined}
                    value={payload[field.key] ?? ""}
                    onChange={(event) =>
                      setPayload((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                )}
              </label>
            ))}
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="h-9 rounded-lg border border-border px-3 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(qrRecord)} onOpenChange={(next) => !next && setQrRecord(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code do animal</DialogTitle>
            <DialogDescription>
              {qrRecord?.payload.identificacao || qrRecord?.payload.brinco_qr || "Ficha animal"}
            </DialogDescription>
          </DialogHeader>
          {qrRecord && (
            <div className="grid justify-items-center gap-4 py-2">
              <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                <QRCodeCanvas
                  id={`animal-qr-${qrRecord.id}`}
                  value={animalQrValue(qrRecord)}
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="max-w-full truncate rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {animalQrValue(qrRecord)}
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setQrRecord(null)}
              className="h-9 rounded-lg border border-border px-3 text-sm"
            >
              Fechar
            </button>
            {qrRecord && (
              <button
                onClick={() => exportAnimalQr(qrRecord)}
                className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
              >
                Exportar PNG
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
