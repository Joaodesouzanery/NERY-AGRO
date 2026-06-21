import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveCycles } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { TalhaoCycle, TalhaoRecord } from "@/features/talhao-360/types/domain";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function CyclesTab({
  talhao,
  cycles,
  selectedSeason,
  demoMode,
}: {
  talhao: TalhaoRecord;
  cycles: TalhaoCycle[];
  selectedSeason: string;
  demoMode: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const selected = cycles.filter((cycle) => cycle.safra === selectedSeason);
  const save = useMutation({
    mutationFn: (next: TalhaoCycle[]) => saveCycles(talhao, next),
    onSuccess: async () => {
      toast.success("Ciclos atualizados.");
      await queryClient.invalidateQueries({ queryKey: talhao360Keys.root });
      setOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const complete = (cycleId: string) => {
    if (demoMode) return toast.info("Desative o modo DEMO para encerrar ciclos.");
    save.mutate(
      cycles.map((cycle) =>
        cycle.id === cycleId
          ? { ...cycle, status: "Concluído", fimReal: new Date().toISOString().slice(0, 10) }
          : cycle,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Safra {selectedSeason}</h2>
          <p className="text-sm text-muted-foreground">
            Planejamento e execução dos ciclos produtivos.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Novo ciclo
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {selected.map((cycle) => (
          <article
            key={cycle.id}
            className={cn(
              "rounded-xl border bg-card p-5",
              cycle.status === "Em andamento" && "border-primary shadow-sm",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{cycle.nome}</h3>
                <p className="text-xs text-muted-foreground">
                  {date(cycle.inicio)} – {date(cycle.fimPrevisto)}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-xs">{cycle.status}</span>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <Row label="Área" value={`${cycle.areaHa} ha`} />
              <Row label="Tipo" value={cycle.tipo} />
              <Row
                label="Prod. esperada"
                value={cycle.produtividadeEsperada ? `${cycle.produtividadeEsperada} sc/ha` : "—"}
              />
              <Row
                label="Custo previsto"
                value={cycle.custoPrevistoHa ? currency(cycle.custoPrevistoHa) : "—"}
              />
              <Row
                label="Custo realizado"
                value={cycle.custoRealizadoHa ? currency(cycle.custoRealizadoHa) : "—"}
              />
            </dl>
            {cycle.status === "Em andamento" && (
              <button
                type="button"
                onClick={() => complete(cycle.id)}
                className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                Encerrar ciclo
              </button>
            )}
          </article>
        ))}
        {!selected.length && (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum ciclo cadastrado para esta safra.
          </div>
        )}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 font-semibold">Histórico de ciclos</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                {[
                  "Safra",
                  "Ciclo",
                  "Cultura",
                  "Período",
                  "Status",
                  "Produtividade",
                  "Custo/ha",
                  "Margem/ha",
                ].map((value) => (
                  <th key={value} className="py-3 pr-4 font-medium">
                    {value}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cycles.map((cycle) => (
                <tr key={cycle.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">{cycle.safra}</td>
                  <td className="py-3 pr-4 font-medium">{cycle.nome}</td>
                  <td className="py-3 pr-4">{cycle.cultura}</td>
                  <td className="py-3 pr-4">
                    {date(cycle.inicio)} – {date(cycle.fimPrevisto)}
                  </td>
                  <td className="py-3 pr-4">{cycle.status}</td>
                  <td className="py-3 pr-4">
                    {cycle.produtividadeRealizada ?? cycle.produtividadeEsperada ?? "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {cycle.custoRealizadoHa ?? cycle.custoPrevistoHa ?? "—"}
                  </td>
                  <td className="py-3 pr-4">{cycle.margemEstimadaHa ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <NewCycleDialog
        open={open}
        onOpenChange={setOpen}
        talhao={talhao}
        cycles={cycles}
        selectedSeason={selectedSeason}
        disabled={demoMode}
        onSave={(cycle) => save.mutate([...cycles, cycle])}
      />
    </div>
  );
}

function NewCycleDialog({
  open,
  onOpenChange,
  talhao,
  cycles,
  selectedSeason,
  disabled,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talhao: TalhaoRecord;
  cycles: TalhaoCycle[];
  selectedSeason: string;
  disabled: boolean;
  onSave: (cycle: TalhaoCycle) => void;
}) {
  const [form, setForm] = useState({
    safra: selectedSeason,
    nome: "",
    cultura: "",
    tipo: "Produção" as TalhaoCycle["tipo"],
    areaHa: Number(talhao.payload.area_util || talhao.payload.area_ha || 0),
    inicio: "",
    fimPrevisto: "",
    custoPrevistoHa: 0,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo ciclo</DialogTitle>
          <DialogDescription>Planeje um novo uso para o talhão.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["safra", "Safra", "text"],
            ["nome", "Nome", "text"],
            ["cultura", "Cultura ou uso", "text"],
            ["areaHa", "Área (ha)", "number"],
            ["inicio", "Início", "date"],
            ["fimPrevisto", "Fim previsto", "date"],
            ["custoPrevistoHa", "Custo previsto/ha", "number"],
          ].map(([key, label, type]) => (
            <label key={key} className="grid gap-1.5 text-sm">
              {label}
              <input
                type={type}
                value={String(form[key as keyof typeof form])}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [key]: type === "number" ? Number(event.target.value) : event.target.value,
                  }))
                }
                className="h-10 rounded-lg border border-border bg-background px-3"
              />
            </label>
          ))}
          <label className="grid gap-1.5 text-sm">
            Tipo
            <select
              value={form.tipo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tipo: event.target.value as TalhaoCycle["tipo"],
                }))
              }
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              {["Produção", "Cobertura", "Pousio", "Reforma", "Pastagem", "Experimental"].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </label>
        </div>
        <DialogFooter>
          <button className="h-9 rounded-lg border px-3" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button
            className="h-9 rounded-lg bg-primary px-3 text-primary-foreground"
            onClick={() => {
              if (disabled) return toast.info("Desative o modo DEMO para salvar.");
              const fieldArea = Number(talhao.payload.area_util || talhao.payload.area_ha || 0);
              if (!form.nome || !form.cultura || !form.inicio || !form.fimPrevisto)
                return toast.error("Preencha os campos obrigatórios.");
              if (form.areaHa > fieldArea)
                return toast.error("A área do ciclo excede a área útil.");
              if (form.fimPrevisto < form.inicio)
                return toast.error("A data final deve ser posterior ao início.");
              const overlap = cycles.some(
                (cycle) =>
                  cycle.safra === form.safra &&
                  cycle.status !== "Cancelado" &&
                  form.inicio <= cycle.fimPrevisto &&
                  form.fimPrevisto >= cycle.inicio &&
                  cycle.areaHa + form.areaHa > fieldArea,
              );
              if (overlap) return toast.error("A sobreposição de ciclos excede a área do talhão.");
              onSave({
                id: crypto.randomUUID(),
                ...form,
                status: "Planejado",
              });
            }}
          >
            Salvar ciclo
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function date(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
