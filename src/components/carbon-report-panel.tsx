import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Save, Target } from "lucide-react";
import { toast } from "sonner";
import type { OperationRecord } from "@/lib/supabase-operations";
import {
  buildCarbonMetrics,
  carbonIntensityPerTon,
  carbonInventory,
} from "@/lib/carbon-emissions-metrics";
import { loadAppSettings, saveCarbonTarget } from "@/lib/app-settings";
import { buildRemessaMetrics } from "@/lib/remessa-metrics";
import { useConnectedAgroData, invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { exportRowsToXlsx } from "@/lib/export-xlsx";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

// Intensidade (kg CO₂e/t produzida), meta anual e inventário GHG exportável.
export function CarbonReportPanel({ records }: { records: OperationRecord[] }) {
  const { snapshot } = useConnectedAgroData();
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();

  const metrics = buildCarbonMetrics(records);
  const producedT = buildRemessaMetrics(snapshot.operations).pesoLiquidoTotal / 1000;
  const intensity = carbonIntensityPerTon(metrics.totalKg, producedT);

  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: loadAppSettings,
    enabled: !demoMode && isSupabaseConfigured,
    staleTime: 60_000,
  });
  const meta = settings?.carbonTargetT;
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (meta != null ? String(meta) : "");

  const mutation = useMutation({
    mutationFn: (t: number) => saveCarbonTarget(t),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      await invalidateConnectedQueries(queryClient);
      toast.success("Meta de emissão atualizada.");
      setDraft(null);
    },
    onError: (e) => toast.error((e as Error).message || "Não foi possível salvar."),
  });

  const salvarMeta = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para salvar configurações.");
    const t = Number(shown.replace(",", "."));
    if (!Number.isFinite(t) || t <= 0) return toast.error("Informe uma meta válida (tCO₂e).");
    mutation.mutate(t);
  };

  const exportarInventario = () => {
    const rows = carbonInventory(records);
    if (rows.length === 0) return toast.info("Sem emissões para exportar.");
    const header = ["Escopo", "Categoria", "CO2e (kg)", "CO2e (t)"];
    const data = rows.map((r) => [r.escopo, r.categoria, String(r.co2eKg), String(r.co2eT)]);
    void exportRowsToXlsx("agrotorre-inventario-ghg", header, data, "Inventário GHG");
    toast.success("Inventário GHG exportado (Excel).");
  };

  const progresso =
    meta && meta > 0 ? Math.min(100, Math.round((metrics.totalT / meta) * 100)) : null;
  const acima = meta != null && metrics.totalT > meta;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <Target className="h-4 w-4 text-primary" />
          Meta, intensidade e inventário
        </h3>
        <button
          type="button"
          onClick={exportarInventario}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          Exportar inventário GHG
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground">Pegada atual</div>
          <div className="mt-1 text-xl font-semibold">
            {metrics.totalT.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} tCO₂e
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground">Intensidade</div>
          <div className="mt-1 text-xl font-semibold">
            {producedT > 0 ? `${intensity.toLocaleString("pt-BR")} kg/t` : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground">kg CO₂e por tonelada colhida</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground">Meta anual</div>
          <div className="mt-1 flex items-center gap-1.5">
            <input
              type="number"
              step="any"
              value={shown}
              placeholder="tCO₂e"
              onChange={(e) => setDraft(e.target.value)}
              className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <button
              type="button"
              onClick={salvarMeta}
              disabled={mutation.isPending}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              Salvar
            </button>
          </div>
        </div>
      </div>

      {progresso != null && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {metrics.totalT.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} de {meta} tCO₂e
            </span>
            <span className={acima ? "font-medium text-destructive" : "font-medium text-success"}>
              {acima ? "acima da meta" : `${progresso}% da meta`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={acima ? "h-full bg-destructive" : "h-full bg-success"}
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
