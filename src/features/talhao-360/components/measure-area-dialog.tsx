import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ruler } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTalhao } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import { useTalhao360Records } from "@/features/talhao-360/hooks/use-talhao-360";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import { TalhaoMapEditor } from "@/features/talhao-360/map/talhao-map-editor";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { cn } from "@/lib/utils";

// slug simples p/ o código do talhão (sem acento, minúsculo, hífens)
function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * "Medir/Desenhar área" na Torre: abre o editor de mapa (reuso do Talhão 360)
 * para medir área/perímetro ao vivo e, opcionalmente, salvar como talhão novo
 * (createTalhao → aparece no Talhão 360). Medir é rascunho; salvar persiste.
 */
export function MeasureAreaButton({ className }: { className?: string } = {}) {
  const queryClient = useQueryClient();
  const { demoMode } = useDemoMode();
  const { data } = useTalhao360Records();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [fazenda, setFazenda] = useState("");

  const talhoes = useMemo(
    () => (data ?? []).filter((item) => item.module === "areas") as TalhaoRecord[],
    [data],
  );

  const mutation = useMutation({
    mutationFn: createTalhao,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: talhao360Keys.root });
      toast.success("Área salva como talhão — já aparece no Talhão 360.");
      setNome("");
      setFazenda("");
      setOpen(false);
    },
    onError: (error) => toast.error((error as Error).message || "Não foi possível salvar."),
  });

  const salvarComoTalhao = (geometry: GeoJSON.Polygon, areaHa: number) => {
    if (demoMode) {
      toast.info("Desligue o modo DEMO para salvar de verdade.");
      return;
    }
    const displayName = nome.trim() || "Área medida";
    mutation.mutate({
      talhao: displayName,
      codigo: slugify(displayName) || "area-medida",
      fazenda: fazenda.trim(),
      area_ha: areaHa.toFixed(2),
      geometry_geojson: JSON.stringify(geometry),
      status: "Planejado",
      origem: "torre-medicao",
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted",
          className,
        )}
      >
        <Ruler className="h-4 w-4" />
        Medir/Desenhar área
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medir / desenhar área</DialogTitle>
            <DialogDescription>
              Clique no mapa para marcar os vértices — a área (ha) e o perímetro aparecem ao vivo.
              Sem cadastrar perímetro de fazenda. Para guardar, informe um nome e clique em “Salvar
              como talhão”.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Nome do talhão (para salvar)</span>
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex.: Talhão 12"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Fazenda (opcional)</span>
              <input
                value={fazenda}
                onChange={(event) => setFazenda(event.target.value)}
                placeholder="Ex.: Fazenda Boa Vista"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
          </div>

          <TalhaoMapEditor
            talhoes={talhoes}
            disabled={mutation.isPending}
            kicker="Medição / novo talhão"
            title={nome.trim() || "Área sem nome"}
            subtitle="Medir área e perímetro; salvar é opcional"
            exportName={slugify(nome) || "area-medida"}
            saveLabel="Salvar como talhão"
            onSave={(geometry, { areaHa }) => salvarComoTalhao(geometry, areaHa)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
