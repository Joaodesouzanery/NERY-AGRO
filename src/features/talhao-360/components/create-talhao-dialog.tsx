import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { createDemoTalhao, createTalhao } from "@/features/talhao-360/api/services";
import type { TalhaoPayload, TalhaoRecord } from "@/features/talhao-360/types/domain";
import { VOCACAO_OPTIONS } from "@/features/talhao-360/types/domain";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type GeometryDraft = { geometry: GeoJSON.Polygon; areaHa: number; perimeterKm: number };

const STATUS_OPTIONS = ["Planejado", "Em preparo", "Plantado", "Pousio", "Colhido"] as const;

function parseGps(value: string): [number, number] | null {
  const [lat, lng] = value.split(",").map((part) => Number(part.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

const emptyForm = {
  talhao: "",
  codigo: "",
  cultura: "",
  safra: "",
  status: "Planejado",
  vocacao: "Agricultura",
  area: "",
  gps: "",
};

export function CreateTalhaoDialog({
  open,
  onOpenChange,
  draft,
  farmName,
  defaultSafra,
  farmGeometry,
  color,
  demoMode,
  onRequestDraw,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: GeometryDraft | null;
  farmName: string;
  defaultSafra?: string;
  farmGeometry: GeoJSON.Polygon | null;
  color: string;
  demoMode: boolean;
  onRequestDraw: () => void;
  onCreated: (record: TalhaoRecord) => Promise<void> | void;
}) {
  const [form, setForm] = useState({ ...emptyForm, safra: defaultSafra ?? "" });

  const mutation = useMutation({
    mutationFn: async () => {
      const manualArea = Number(form.area.replace(",", "."));
      const hasArea = Number.isFinite(manualArea) && manualArea > 0;
      const gps = form.gps.trim();
      const areaHa = draft ? draft.areaHa : hasArea ? manualArea : 0;
      const payload: TalhaoPayload = {
        talhao: form.talhao,
        codigo: form.codigo,
        fazenda: farmName,
        cultura: form.cultura,
        safra: form.safra,
        status: form.status as NonNullable<TalhaoPayload["status"]>,
        vocacao: form.vocacao as NonNullable<TalhaoPayload["vocacao"]>,
        area_ha: areaHa ? areaHa.toFixed(2) : "",
        area_util: areaHa ? areaHa.toFixed(2) : "",
        perimetro_km: draft ? draft.perimeterKm.toFixed(3) : "",
        coordenadas: parseGps(gps) ? gps : "",
        cor_mapa: color,
        geometry_geojson: draft ? JSON.stringify(draft.geometry) : "",
        farm_geometry_geojson: farmGeometry ? JSON.stringify(farmGeometry) : "",
        farm_area_ha: "",
        farm_perimeter_km: "",
      };
      return (
        demoMode ? createDemoTalhao(payload) : createTalhao(payload)
      ) as Promise<TalhaoRecord>;
    },
    onSuccess: async (record) => {
      await onCreated(record);
      setForm({ ...emptyForm, safra: defaultSafra ?? "" });
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCreate = () => {
    if (!form.talhao || !form.codigo) return toast.error("Informe nome e código do talhão.");
    const manualArea = Number(form.area.replace(",", "."));
    const hasArea = Number.isFinite(manualArea) && manualArea > 0;
    const hasGps = parseGps(form.gps.trim()) !== null;
    if (!draft && !hasArea && !hasGps) {
      return toast.error("Informe ao menos um: tamanho da área, GPS ou desenho no mapa.");
    }
    mutation.mutate();
  };

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo talhão</DialogTitle>
          <DialogDescription>
            Defina o talhão por tamanho da área, GPS ou desenhando no mapa — pelo menos uma forma.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["talhao", "Nome"],
              ["codigo", "Código"],
              ["cultura", "Cultura ou uso"],
              ["safra", "Safra"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="grid gap-1.5 text-sm">
              {label}
              <input
                value={form[key]}
                onChange={(event) => set(key, event.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3"
              />
            </label>
          ))}
          <label className="grid gap-1.5 text-sm">
            Status
            <select
              value={form.status}
              onChange={(event) => set("status", event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              {STATUS_OPTIONS.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Vocação
            <select
              value={form.vocacao}
              onChange={(event) => set("vocacao", event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              {VOCACAO_OPTIONS.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-2 rounded-lg border border-border p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">
            Localização (informe ao menos uma)
          </div>
          {draft ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span>
                Polígono desenhado ·{" "}
                <strong>
                  {draft.areaHa.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha
                </strong>
              </span>
              <button
                type="button"
                onClick={onRequestDraw}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                Redesenhar
              </button>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                Tamanho da área (ha)
                <input
                  inputMode="decimal"
                  value={form.area}
                  onChange={(event) => set("area", event.target.value)}
                  placeholder="Ex.: 42,8"
                  className="h-10 rounded-lg border border-border bg-background px-3"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                GPS (latitude, longitude)
                <input
                  value={form.gps}
                  onChange={(event) => set("gps", event.target.value)}
                  placeholder="Ex.: -17.79, -50.92"
                  className="h-10 rounded-lg border border-border bg-background px-3"
                />
              </label>
              <button
                type="button"
                onClick={onRequestDraw}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/40 px-3 text-sm font-medium text-primary hover:bg-primary/5 sm:col-span-2"
              >
                <Pencil className="h-4 w-4" />
                Desenhar no mapa
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <button className="h-9 rounded-lg border px-3" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button
            className="h-9 rounded-lg bg-primary px-3 text-primary-foreground disabled:opacity-50"
            disabled={mutation.isPending}
            onClick={handleCreate}
          >
            Criar talhão
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
