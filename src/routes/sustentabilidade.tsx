import { createFileRoute } from "@tanstack/react-router";
import { buildCarbonoOverview } from "@/lib/overview/carbono";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Factory,
  FileCheck2,
  Image as ImageIcon,
  Leaf,
  MapPin,
  Recycle,
  Scale,
  ShieldCheck,
  Sprout,
  Timer,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { OperationAreaPage, type OperationModuleConfig } from "@/components/operation-area-crud";
import type { OperationRecord } from "@/lib/supabase-operations";
import { CartoMap, type CartoPoint } from "@/components/carto-map";
import { EmptyState } from "@/components/empty-state";
import { RichBarList, RichTabKpis, RichTabPanel } from "@/components/rich-tab";
import { CarbonPriceSetting } from "@/components/app-settings-controls";
import { CarbonAutoCaptureButton } from "@/components/carbon-auto-capture-dialog";
import { CarbonReportPanel } from "@/components/carbon-report-panel";
import {
  buildCarbonMetrics,
  carbonByEscopo,
  CARBON_FACTORS,
  recordCo2e,
} from "@/lib/carbon-emissions-metrics";

export const Route = createFileRoute("/sustentabilidade")({
  head: () => ({
    meta: [
      { title: "Emissão de Carbono - AgroTorre" },
      {
        name: "description",
        content:
          "Emissões por escopo (1/2/3), pegada de carbono, certificações, agroecologia, resíduos e APPs.",
      },
    ],
  }),
  component: SustentabilidadePage,
});

const AREA = "sustentabilidade";

const modules: OperationModuleConfig[] = [
  {
    id: "certificacoes",
    label: "Certificações",
    shortLabel: "Certificações",
    description: "Checklist de certificação orgânica, auditoria, validade e status.",
    icon: ShieldCheck,
    fields: [
      { key: "certificacao", label: "Certificação" },
      { key: "checklist", label: "Checklist orgânico", type: "textarea" },
      { key: "auditor", label: "Auditor" },
      { key: "validade", label: "Validade", type: "date" },
      { key: "pendencias", label: "Pendências", type: "textarea" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "agroecologia",
    label: "Caderno de Campo para Agroecologia",
    shortLabel: "Agroecologia",
    description: "Práticas agroecológicas, insumos naturais, observações e evidências.",
    icon: ClipboardList,
    fields: [
      { key: "data", label: "Data", type: "date" },
      { key: "area", label: "Área/Talhão" },
      { key: "pratica", label: "Prática" },
      { key: "insumos_naturais", label: "Insumos naturais", type: "textarea" },
      { key: "observacoes", label: "Observações", type: "textarea" },
      { key: "evidencia_url", label: "Evidência URL" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "residuos",
    label: "Controle de Resíduos e Compostagem",
    shortLabel: "Resíduos",
    description: "Origem, volume, destino, lote de composto e maturação.",
    icon: Leaf,
    fields: [
      { key: "origem", label: "Origem" },
      { key: "residuo", label: "Resíduo" },
      { key: "volume", label: "Volume", type: "number" },
      { key: "destino", label: "Destino" },
      { key: "lote_composto", label: "Lote de composto" },
      { key: "maturacao", label: "Maturação" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "apps",
    label: "Monitoramento de APPs e Limites",
    shortLabel: "APPs",
    description: "Área monitorada, coordenadas, ocorrência e ação corretiva.",
    icon: MapPin,
    fields: [
      { key: "area_monitorada", label: "Área monitorada" },
      { key: "coordenadas", label: "Coordenadas/descrição", type: "textarea" },
      { key: "ocorrencia", label: "Ocorrência" },
      { key: "data", label: "Data", type: "date" },
      { key: "acao_corretiva", label: "Ação corretiva", type: "textarea" },
      { key: "responsavel", label: "Responsável" },
      { key: "status", label: "Status" },
    ],
  },
  {
    id: "carbono",
    label: "Emissões (pegada de carbono)",
    shortLabel: "Emissões",
    description: "Atividade × fator = CO₂e, por escopo (1/2/3), categoria, talhão e safra.",
    icon: Factory,
    fields: [
      { key: "atividade", label: "Atividade" },
      {
        key: "escopo",
        label: "Escopo",
        options: [
          { value: "1", label: "Escopo 1 — combustão direta" },
          { value: "2", label: "Escopo 2 — energia comprada" },
          { value: "3", label: "Escopo 3 — cadeia (frete, insumos)" },
        ],
      },
      {
        key: "categoria",
        label: "Categoria",
        hint: "escolha p/ sugerir o fator",
        datalist: CARBON_FACTORS.map((f) => f.categoria),
      },
      { key: "fonte", label: "Fonte emissora" },
      { key: "volume", label: "Volume", type: "number" },
      { key: "unidade", label: "Unidade", hint: "L, kWh, kg, t·km" },
      {
        key: "fator",
        label: "Fator (kg CO₂e/un.)",
        type: "number",
        hint: "auto pela categoria · editável",
      },
      {
        key: "co2e",
        label: "CO₂e (kg)",
        type: "number",
        hint: "Vazio = calcula volume × fator",
      },
      { key: "talhao", label: "Talhão" },
      { key: "safra", label: "Safra" },
      { key: "periodo", label: "Período" },
      { key: "status", label: "Status" },
    ],
  },
];

const demoByModule: Record<string, OperationRecord[]> = {
  certificacoes: [
    record("certificacoes", "1", {
      certificacao: "Orgânico Brasil",
      checklist: "Manejo sem químicos sintéticos; rastreabilidade por lote; barreiras vegetais.",
      auditor: "Instituto Certifica",
      validade: "2026-11-20",
      pendencias: "Atualizar caderno de campo do Talhão B.",
      status: "Atenção",
    }),
  ],
  agroecologia: [
    record("agroecologia", "1", {
      data: "2026-05-28",
      area: "Talhão A",
      pratica: "Cobertura verde",
      insumos_naturais: "Composto maturado e biofertilizante.",
      observacoes: "Boa retenção de umidade após chuva.",
      evidencia_url: "",
      status: "Concluído",
    }),
  ],
  residuos: [
    record("residuos", "1", {
      origem: "Packing house",
      residuo: "Restos vegetais",
      volume: "840",
      destino: "Leira 03",
      lote_composto: "COMP-2026-05",
      maturacao: "45 dias",
      status: "Em maturação",
    }),
  ],
  apps: [
    record("apps", "1", {
      area_monitorada: "APP Nascente Norte",
      coordenadas: "-23.5512,-46.6334",
      ocorrencia: "Cerca danificada",
      data: "2026-05-29",
      acao_corretiva: "Reparo programado e registro fotográfico.",
      responsavel: "Equipe Campo",
      status: "Pendente",
    }),
  ],
  carbono: [
    record("carbono", "1", {
      atividade: "Transporte de cestas",
      escopo: "3",
      categoria: "Transporte (frete)",
      fonte: "Diesel",
      volume: "180",
      unidade: "L",
      fator: "2.68",
      co2e: "482.4",
      talhao: "Talhão 03",
      safra: "2025/2026",
      periodo: "Maio 2026",
      status: "Calculado",
    }),
    record("carbono", "2", {
      atividade: "Preparo de solo (trator)",
      escopo: "1",
      categoria: "Diesel",
      fonte: "Diesel",
      volume: "320",
      unidade: "L",
      fator: "2.68",
      co2e: "857.6",
      talhao: "Talhão 03",
      safra: "2025/2026",
      periodo: "Maio 2026",
      status: "Calculado",
    }),
    record("carbono", "3", {
      atividade: "Adubação nitrogenada (ureia)",
      escopo: "1",
      categoria: "Ureia (N → N₂O)",
      fonte: "Fertilizante",
      volume: "150",
      unidade: "kg N",
      fator: "3.67",
      co2e: "550.5",
      talhao: "Talhão 07",
      safra: "2025/2026",
      periodo: "Maio 2026",
      status: "Calculado",
    }),
    record("carbono", "4", {
      atividade: "Energia da sede/irrigação",
      escopo: "2",
      categoria: "Energia elétrica",
      fonte: "Rede",
      volume: "4200",
      unidade: "kWh",
      fator: "0.0385",
      co2e: "161.7",
      safra: "2025/2026",
      periodo: "Maio 2026",
      status: "Calculado",
    }),
  ],
};

function record(module: string, id: string, payload: Record<string, string>): OperationRecord {
  return {
    id: `demo-${AREA}-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function num(value: unknown): number {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseLatLng(raw?: string): { lat: number; lng: number } | null {
  const m = String(raw ?? "").match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

// ── Helpers de foco por aba (derivam KPIs/visuais dos próprios registros). ──
const normStr = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const countByStatus = (records: OperationRecord[], key: string, term: string) =>
  records.filter((r) => normStr(r.payload[key]).includes(term)).length;

const sumField = (records: OperationRecord[], key: string) =>
  records.reduce((sum, r) => sum + num(r.payload[key]), 0);

function groupCount(records: OperationRecord[], key: string) {
  const map = new Map<string, number>();
  for (const r of records) {
    const k = (r.payload[key] || "—").trim() || "—";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function groupSum(records: OperationRecord[], key: string, valueKey: string) {
  const map = new Map<string, number>();
  for (const r of records) {
    const k = (r.payload[key] || "—").trim() || "—";
    map.set(k, (map.get(k) ?? 0) + num(r.payload[valueKey]));
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// Dias até a data (negativo = vencido). Espera "YYYY-MM-DD".
function daysUntil(raw?: string): number | null {
  const v = String(raw ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${v}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// Extrai dias de uma string de maturação livre (ex.: "45 dias").
function maturationDays(raw?: string): number | null {
  const m = String(raw ?? "").match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function FocusCertificacoes({ records }: { records: OperationRecord[] }) {
  const ativas = records.filter((r) => {
    const d = daysUntil(r.payload.validade);
    return d === null || d >= 0;
  }).length;
  const vencidas = records.filter((r) => {
    const d = daysUntil(r.payload.validade);
    return d !== null && d < 0;
  }).length;
  const comPendencias = records.filter(
    (r) => (r.payload.pendencias ?? "").trim().length > 0,
  ).length;
  const conformidade = records.length
    ? Math.round(((records.length - comPendencias) / records.length) * 100)
    : 0;

  // Renovações: ordenadas por proximidade do vencimento, com semáforo 60/30/7.
  const renovacoes = records
    .map((r) => ({ record: r, dias: daysUntil(r.payload.validade) }))
    .filter((x): x is { record: OperationRecord; dias: number } => x.dias !== null)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 6);
  const proxima = renovacoes.length ? renovacoes[0].dias : null;

  const renoTone = (dias: number) =>
    dias < 0
      ? "bg-destructive/12 text-destructive"
      : dias <= 7
        ? "bg-destructive/12 text-destructive"
        : dias <= 30
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          : dias <= 60
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "bg-success/12 text-success";
  const renoLabel = (dias: number) =>
    dias < 0 ? `vencida há ${Math.abs(dias)}d` : dias === 0 ? "vence hoje" : `${dias} dias`;

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "Certificações", value: records.length, icon: ShieldCheck },
          {
            label: "Ativas",
            value: ativas,
            icon: FileCheck2,
            trend: ativas ? "vigentes" : undefined,
            trendDir: ativas ? "up" : "neutral",
          },
          {
            label: "Vencidas",
            value: vencidas,
            icon: AlertTriangle,
            trend: vencidas ? "renovar" : "ok",
            trendDir: vencidas ? "down" : "up",
          },
          {
            label: "Com pendências",
            value: comPendencias,
            icon: ClipboardList,
            trend: comPendencias ? "auditar" : "limpo",
            trendDir: comPendencias ? "down" : "up",
          },
          {
            label: "Conformidade",
            value: `${conformidade}%`,
            icon: CheckCircle2,
            trendDir: conformidade >= 80 ? "up" : "down",
          },
          {
            label: "Próx. renovação",
            value: proxima === null ? "—" : proxima < 0 ? "vencida" : `${proxima}d`,
            icon: CalendarClock,
          },
        ]}
      />
      <RichTabPanel
        title="Linha do tempo de renovação"
        description="Alerta de validade (60 / 30 / 7 dias)."
      >
        {renovacoes.length ? (
          <div className="space-y-2">
            {renovacoes.map(({ record: r, dias }) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  <strong>{r.payload.certificacao || "Certificação"}</strong>
                  {r.payload.auditor ? (
                    <span className="text-muted-foreground"> · {r.payload.auditor}</span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-right">
                  <span className="text-xs text-muted-foreground">{r.payload.validade}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${renoTone(dias)}`}
                  >
                    {renoLabel(dias)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sem datas de validade"
            description="Informe a validade nas certificações para ver os alertas de renovação."
          />
        )}
      </RichTabPanel>
    </div>
  );
}

function FocusAgroecologia({ records }: { records: OperationRecord[] }) {
  const talhoes = new Set(records.map((r) => (r.payload.area || "").trim()).filter(Boolean)).size;
  const comEvidencia = records.filter(
    (r) => (r.payload.evidencia_url ?? "").trim().length > 0,
  ).length;
  const cobertura = records.length ? Math.round((comEvidencia / records.length) * 100) : 0;
  const byPratica = groupCount(records, "pratica").slice(0, 6);

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "Registros", value: records.length, icon: ClipboardList },
          { label: "Talhões cobertos", value: talhoes, icon: MapPin },
          { label: "Práticas distintas", value: byPratica.length, icon: Sprout },
          {
            label: "Concluídos",
            value: countByStatus(records, "status", "conclu"),
            icon: CheckCircle2,
          },
          {
            label: "Com evidência",
            value: comEvidencia,
            icon: ImageIcon,
            trend: `${cobertura}%`,
            trendDir: cobertura >= 50 ? "up" : "down",
          },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel title="Práticas mais aplicadas" description="Frequência por tipo de manejo.">
          {byPratica.length ? (
            <RichBarList items={byPratica} color="var(--color-chart-2)" />
          ) : (
            <EmptyState title="Sem práticas registradas" />
          )}
        </RichTabPanel>
        <RichTabPanel
          title="Caderno de campo recente"
          description="Últimos registros agroecológicos."
        >
          {records.length ? (
            <div className="space-y-2">
              {[...records]
                .sort((a, b) => (b.payload.data ?? "").localeCompare(a.payload.data ?? ""))
                .slice(0, 6)
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <strong>{r.payload.pratica || "Prática"}</strong>
                      {r.payload.area ? (
                        <span className="text-muted-foreground"> · {r.payload.area}</span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {(r.payload.evidencia_url ?? "").trim() ? (
                        <ImageIcon className="h-3.5 w-3.5 text-success" />
                      ) : null}
                      <span className="text-xs text-muted-foreground">{r.payload.data || "—"}</span>
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState title="Sem registros no caderno" />
          )}
        </RichTabPanel>
      </div>
    </div>
  );
}

function FocusResiduos({ records }: { records: OperationRecord[] }) {
  const volumeTotal = sumField(records, "volume");
  const lotes = new Set(records.map((r) => (r.payload.lote_composto || "").trim()).filter(Boolean))
    .size;
  const emMaturacao = countByStatus(records, "status", "matura");
  const prontos = records.filter(
    (r) => countByStatus([r], "status", "pronto") || countByStatus([r], "maturacao", "pronto"),
  ).length;
  const byOrigem = groupSum(records, "origem", "volume").slice(0, 6);

  // Curva de maturação por lote: dias informados, com alerta de prontidão (>=45d).
  const maturacao = records
    .map((r) => ({ record: r, dias: maturationDays(r.payload.maturacao) }))
    .filter((x): x is { record: OperationRecord; dias: number } => x.dias !== null)
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "Lançamentos", value: records.length, icon: Recycle },
          {
            label: "Volume total",
            value: `${volumeTotal.toLocaleString("pt-BR")} kg`,
            icon: Scale,
          },
          { label: "Lotes de composto", value: lotes, icon: Leaf },
          { label: "Em maturação", value: emMaturacao, icon: Timer },
          {
            label: "Prontos",
            value: prontos,
            icon: CheckCircle2,
            trendDir: prontos ? "up" : "neutral",
          },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel title="Volume por origem" description="Resíduos recebidos por setor (kg).">
          {byOrigem.length ? (
            <RichBarList
              items={byOrigem}
              color="var(--color-chart-4)"
              format={(n) => `${n.toLocaleString("pt-BR")} kg`}
            />
          ) : (
            <EmptyState title="Sem volumes registrados" />
          )}
        </RichTabPanel>
        <RichTabPanel
          title="Maturação dos lotes"
          description="Dias acumulados — pronto a partir de ~45 dias."
        >
          {maturacao.length ? (
            <div className="space-y-2">
              {maturacao.map(({ record: r, dias }) => {
                const pronto = dias >= 45;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <strong>{r.payload.lote_composto || "Lote"}</strong>
                      {r.payload.destino ? (
                        <span className="text-muted-foreground"> · {r.payload.destino}</span>
                      ) : null}
                    </span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        pronto
                          ? "bg-success/12 text-success"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {dias}d · {pronto ? "pronto" : "maturando"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Sem dados de maturação"
              description="Informe a maturação (ex.: '45 dias') para acompanhar a prontidão."
            />
          )}
        </RichTabPanel>
      </div>
    </div>
  );
}

// Visualizações específicas por módulo: gráfico de CO₂e (carbono) e mapa (APPs).
function ModuleAddon({
  module,
  records,
}: {
  module: OperationModuleConfig;
  records: OperationRecord[];
}) {
  if (module.id === "certificacoes") return <FocusCertificacoes records={records} />;
  if (module.id === "agroecologia") return <FocusAgroecologia records={records} />;
  if (module.id === "residuos") return <FocusResiduos records={records} />;

  if (module.id === "carbono") {
    const m = buildCarbonMetrics(records);
    const escopos = carbonByEscopo(records).map((x) => ({
      label: x.label,
      value: Math.round(x.co2e),
    }));
    const byCat = new Map<string, number>();
    for (const r of records) {
      const cat = r.payload.categoria?.trim() || r.payload.fonte?.trim() || "Outros";
      byCat.set(cat, (byCat.get(cat) ?? 0) + recordCo2e(r.payload));
    }
    const data = [...byCat.entries()]
      .map(([fonte, co2e]) => ({ fonte, co2e: Math.round(co2e * 10) / 10 }))
      .sort((a, b) => b.co2e - a.co2e);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Registre emissões manualmente ou puxe da operação (rebanho, cargas, fretes).
          </p>
          <CarbonAutoCaptureButton />
        </div>
        <CarbonPriceSetting />
        {m.registros > 0 && (
          <>
            <CarbonReportPanel records={records} />
            <RichTabKpis
              kpis={[
                {
                  label: "Total CO₂e",
                  value: `${m.totalT.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} t`,
                  icon: Factory,
                },
                { label: "Escopo 1 (direto)", value: `${Math.round(m.scope1)} kg`, icon: Sprout },
                { label: "Escopo 2 (energia)", value: `${Math.round(m.scope2)} kg`, icon: Timer },
                { label: "Escopo 3 (indireto)", value: `${Math.round(m.scope3)} kg`, icon: MapPin },
              ]}
            />
            {escopos.length > 0 && (
              <RichTabPanel title="Emissões por escopo" description="Split 1/2/3 (kg CO₂e)">
                <RichBarList items={escopos} format={(v) => `${v.toLocaleString("pt-BR")} kg`} />
              </RichTabPanel>
            )}
            {data.length > 0 && (
              <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <h3 className="font-semibold">Emissões por categoria/fonte</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  CO₂e (kg) somado por categoria.
                </p>
                <div className="mt-4 h-60">
                  <ResponsiveContainer>
                    <BarChart data={data}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                      />
                      <XAxis dataKey="fonte" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: number) => `${v} kg CO₂e`} />
                      <Bar dataKey="co2e" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    );
  }

  if (module.id === "apps") {
    const points = records
      .map((r): CartoPoint | null => {
        const c = parseLatLng(r.payload.coordenadas);
        if (!c) return null;
        const concluido = (r.payload.status ?? "").toLowerCase().includes("conclu");
        return {
          id: r.id,
          label: r.payload.area_monitorada || "APP",
          lat: c.lat,
          lng: c.lng,
          tone: concluido ? "success" : "warning",
          caption: r.payload.ocorrencia,
          status: r.payload.status,
          icon: "sustentabilidade",
        };
      })
      .filter((p): p is CartoPoint => p !== null);
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <h3 className="font-semibold">Mapa das APPs monitoradas</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Pontos com coordenadas "lat,lng" (ex.: -23.5512,-46.6334).
        </p>
        {points.length === 0 ? (
          <p className="mt-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma APP com coordenadas válidas ainda.
          </p>
        ) : (
          <div className="mt-4 h-72">
            <CartoMap
              region="brazil"
              variant="voyager"
              points={points}
              className="h-full w-full rounded-lg"
            />
          </div>
        )}
      </section>
    );
  }

  return null;
}

function SustentabilidadePage() {
  return (
    <OperationAreaPage
      area={AREA}
      title="Emissão de Carbono"
      description="Emissões por escopo (atividade × fator), certificações, agroecologia, resíduos e APPs — rotina auditável."
      modules={modules}
      buildOverview={buildCarbonoOverview}
      demoByModule={demoByModule}
      renderModuleAddon={(module, records) => <ModuleAddon module={module} records={records} />}
    />
  );
}
