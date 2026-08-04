import { localToday } from "@/lib/date-local";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveCycles } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { TalhaoCycle, TalhaoRecord } from "@/features/talhao-360/types/domain";
import { KpiCard } from "@/components/kpi-card";
import { Segmented } from "@/components/segmented";
import { StatusPill, type StatusPillTone } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_PILL: Record<TalhaoCycle["status"], { label: string; tone: StatusPillTone }> = {
  "Em andamento": { label: "em andamento", tone: "success" },
  Planejado: { label: "planejado", tone: "muted" },
  Concluído: { label: "concluído", tone: "muted" },
  Cancelado: { label: "cancelado", tone: "destructive" },
};

export function CyclesTab({
  talhao,
  cycles,
  seasons,
  selectedSeason,
  onSeasonChange,
  demoMode,
}: {
  talhao: TalhaoRecord;
  cycles: TalhaoCycle[];
  seasons: string[];
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
  demoMode: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const selected = cycles.filter((cycle) => cycle.safra === selectedSeason);
  const ativo = selected.find((cycle) => cycle.status === "Em andamento") ?? selected[0] ?? null;
  const demais = selected.filter((cycle) => cycle.id !== ativo?.id);
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
        cycle.id === cycleId ? { ...cycle, status: "Concluído", fimReal: localToday() } : cycle,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          aria-label="Safra"
          value={selectedSeason}
          onChange={onSeasonChange}
          options={seasons.map((season) => ({ value: season, label: season }))}
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {cycles.length === 1 ? "1 ciclo registrado" : `${cycles.length} ciclos registrados`}
          </span>
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo ciclo
          </Button>
        </div>
      </div>

      {ativo ? (
        <section className="rounded-md border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold tracking-[-0.01em]">
                {ativo.status === "Em andamento" ? "Ciclo em andamento — " : "Ciclo — "}
                {ativo.nome}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {date(ativo.inicio)} → {date(ativo.fimPrevisto)} · {ativo.areaHa} ha ·{" "}
                {ativo.cultura}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {ativo.status === "Em andamento" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={save.isPending}
                  onClick={() => complete(ativo.id)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Encerrar ciclo
                </Button>
              )}
              <StatusPill tone={STATUS_PILL[ativo.status].tone}>
                {STATUS_PILL[ativo.status].label}
              </StatusPill>
            </div>
          </div>

          <CycleProgress cycle={ativo} />

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <KpiCard
              label="Produtividade esperada"
              value={ativo.produtividadeEsperada ?? "—"}
              unit={ativo.produtividadeEsperada ? "sc/ha" : undefined}
            />
            <KpiCard
              label="Custo previsto"
              value={ativo.custoPrevistoHa ? currency(ativo.custoPrevistoHa) : "—"}
              unit={ativo.custoPrevistoHa ? "/ha" : undefined}
            />
            <KpiCard
              label="Realizado até aqui"
              value={realizadoVsPlano(ativo) ?? "—"}
              unit={realizadoVsPlano(ativo) ? "% vs. plano" : undefined}
            />
          </div>

          {demais.length > 0 && (
            <>
              <div className="mt-5 h-px bg-border" />
              <div className="mt-4 flex flex-col gap-3">
                {demais.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{cycle.nome}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {date(cycle.inicio)} → {date(cycle.fimPrevisto)} · {cycle.areaHa} ha
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cycle.status === "Em andamento" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={save.isPending}
                          onClick={() => complete(cycle.id)}
                        >
                          Encerrar
                        </Button>
                      )}
                      <StatusPill tone={STATUS_PILL[cycle.status].tone}>
                        {STATUS_PILL[cycle.status].label}
                      </StatusPill>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      ) : (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum ciclo cadastrado para esta safra.
        </div>
      )}

      <section className="rounded-md border border-border bg-card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold tracking-[-0.01em]">
            Histórico — desempenho por ciclo
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">comparativo entre safras</p>
        </div>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="h-10 px-3 text-left font-medium text-muted-foreground">Ciclo</th>
                <th className="h-10 px-3 text-right font-medium text-muted-foreground">
                  Produtividade
                </th>
                <th className="h-10 px-3 text-right font-medium text-muted-foreground">Custo/ha</th>
                <th className="h-10 px-3 text-right font-medium text-muted-foreground">
                  Margem/ha
                </th>
                <th className="h-10 px-3 text-right font-medium text-muted-foreground">
                  vs. plano
                </th>
              </tr>
            </thead>
            <tbody>
              {[...cycles]
                .sort((a, b) => b.inicio.localeCompare(a.inicio))
                .map((cycle) => (
                  <tr
                    key={cycle.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-3 py-2.5 font-medium">
                      {cycle.nome}
                      <span className="font-normal text-muted-foreground"> · {cycle.safra}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {cycle.produtividadeRealizada ?? cycle.produtividadeEsperada ?? "—"}
                      {(cycle.produtividadeRealizada ?? cycle.produtividadeEsperada) && " sc"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {cycle.custoRealizadoHa
                        ? currency(cycle.custoRealizadoHa)
                        : cycle.custoPrevistoHa
                          ? currency(cycle.custoPrevistoHa)
                          : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {cycle.margemEstimadaHa ? currency(cycle.margemEstimadaHa) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <VsPlanoPill cycle={cycle} />
                    </td>
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

/** Barra "Progresso do ciclo" — dias decorridos sobre a janela prevista. */
function CycleProgress({ cycle }: { cycle: TalhaoCycle }) {
  const dia = 24 * 60 * 60 * 1000;
  const inicio = new Date(`${cycle.inicio}T12:00:00`).getTime();
  const fim = new Date(`${cycle.fimPrevisto}T12:00:00`).getTime();
  const total = Math.max(1, Math.round((fim - inicio) / dia));
  const decorridos = Math.min(total, Math.max(0, Math.round((Date.now() - inicio) / dia)));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Progresso do ciclo</span>
        <span className="tabular-nums">
          {decorridos} de {total} dias
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-success"
          style={{ width: `${(decorridos / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Desvio % do realizado sobre o plano (custo); número neutro, sinal explícito. */
function realizadoVsPlano(cycle: TalhaoCycle): string | null {
  if (!cycle.custoRealizadoHa || !cycle.custoPrevistoHa) return null;
  const pct = Math.round((cycle.custoRealizadoHa / cycle.custoPrevistoHa - 1) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}`;
}

/** Pill do histórico: produtividade vs. esperada; sem dado, custo vs. plano. */
function VsPlanoPill({ cycle }: { cycle: TalhaoCycle }) {
  if (cycle.produtividadeRealizada && cycle.produtividadeEsperada) {
    const pct = Math.round((cycle.produtividadeRealizada / cycle.produtividadeEsperada - 1) * 100);
    return (
      <StatusPill tone={pct >= 0 ? "success" : "warning"}>
        {pct >= 0 ? "+" : ""}
        {pct}%
      </StatusPill>
    );
  }
  if (cycle.custoRealizadoHa && cycle.custoPrevistoHa) {
    const pct = Math.round((cycle.custoRealizadoHa / cycle.custoPrevistoHa - 1) * 100);
    return (
      <StatusPill tone={pct <= 0 ? "success" : "warning"}>
        {pct >= 0 ? "+" : ""}
        {pct}% custo
      </StatusPill>
    );
  }
  return <StatusPill tone="muted">—</StatusPill>;
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
            <label key={key} className="grid gap-1.5 text-sm font-medium">
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
                className="h-9 rounded-md border border-input bg-background px-3 font-normal"
              />
            </label>
          ))}
          <label className="grid gap-1.5 text-sm font-medium">
            Tipo
            <select
              value={form.tipo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tipo: event.target.value as TalhaoCycle["tipo"],
                }))
              }
              className="h-9 rounded-md border border-input bg-background px-3 font-normal"
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function date(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
