import { createFileRoute } from "@tanstack/react-router";
import { Calculator, ClipboardList, Leaf, MapPin, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { OperationAreaPage, type OperationModuleConfig } from "@/components/operation-area-crud";
import type { OperationRecord } from "@/lib/supabase-operations";
import { CartoMap, type CartoPoint } from "@/components/carto-map";

export const Route = createFileRoute("/sustentabilidade")({
  head: () => ({
    meta: [
      { title: "Sustentabilidade - Nery Agro" },
      {
        name: "description",
        content:
          "Certificações, agroecologia, compostagem, APPs e pegada de carbono com registros reais.",
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
    label: "Calculadora de Pegada de Carbono",
    shortLabel: "Carbono",
    description: "Atividade, fonte emissora, volume, fator estimado e CO₂e calculado.",
    icon: Calculator,
    fields: [
      { key: "atividade", label: "Atividade" },
      { key: "fonte", label: "Fonte emissora" },
      { key: "volume", label: "Volume", type: "number" },
      { key: "fator", label: "Fator estimado", type: "number" },
      { key: "co2e", label: "CO₂e calculado", type: "number" },
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
      fonte: "Diesel",
      volume: "180",
      fator: "2.68",
      co2e: "482.4",
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

// Visualizações específicas por módulo: gráfico de CO₂e (carbono) e mapa (APPs).
function ModuleAddon({
  module,
  records,
}: {
  module: OperationModuleConfig;
  records: OperationRecord[];
}) {
  if (module.id === "carbono") {
    const byFonte = new Map<string, number>();
    for (const r of records) {
      const fonte = r.payload.fonte?.trim() || "Outros";
      byFonte.set(fonte, (byFonte.get(fonte) ?? 0) + num(r.payload.co2e));
    }
    const data = [...byFonte.entries()]
      .map(([fonte, co2e]) => ({ fonte, co2e: Math.round(co2e * 10) / 10 }))
      .sort((a, b) => b.co2e - a.co2e);
    if (data.length === 0) return null;
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <h3 className="font-semibold">Pegada de carbono por fonte</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">CO₂e (kg) somado por fonte emissora.</p>
        <div className="mt-4 h-60">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="fonte" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => `${v} kg CO₂e`} />
              <Bar dataKey="co2e" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
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
      title="Sustentabilidade"
      description="Certificações, agroecologia, compostagem, APPs e carbono em uma rotina auditável."
      modules={modules}
      demoByModule={demoByModule}
      renderModuleAddon={(module, records) => <ModuleAddon module={module} records={records} />}
    />
  );
}
