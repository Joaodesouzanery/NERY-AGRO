import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Scissors, Trash2, Truck, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Segmented } from "@/components/segmented";
import { DemoBadge } from "@/components/demo-badge";
import { ColheitaPagamentoCard } from "@/features/remessa/components/colheita-pagamento-card";
import { PasteIngestButton } from "@/features/remessa/components/paste-ingest-dialog";
import { KIND_FIELDS, type CampoDef } from "@/features/remessa/lib/campos";
import { dentroDoPeriodo, type PeriodoISO } from "@/lib/colheita-metrics";
import {
  deleteFieldRecord,
  listFieldRecords,
  updateFieldRecord,
  type FieldRecord,
} from "@/lib/supabase-field";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

// Lançamentos de colheita (corte / carregamento / diárias). Antes da existência
// desta tela os field_records "colheita-*" eram invisíveis: uma vez salvos pela
// ingestão, só apareciam agregados no card de pagamento — erro digitado era
// permanente na prática.

const ABAS = [
  { value: "corte", label: "Corte", modulo: "colheita-corte", icon: Scissors },
  {
    value: "carregamento",
    label: "Carregamento",
    modulo: "colheita-carregamento",
    icon: Truck,
  },
  { value: "diarias", label: "Diárias", modulo: "colheita-diarias", icon: Users },
] as const;

type AbaId = (typeof ABAS)[number]["value"];

const MODULOS = ABAS.map((a) => a.modulo);

function camposDe(aba: AbaId): CampoDef[] {
  return KIND_FIELDS[aba] ?? [];
}

export function ColheitaPage() {
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<AbaId>("corte");
  const [periodo, setPeriodo] = useState<PeriodoISO>({});
  const [editando, setEditando] = useState<FieldRecord | null>(null);
  const [rascunho, setRascunho] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: ["colheita-records"],
    queryFn: async () => {
      const listas = await Promise.all(MODULOS.map((m) => listFieldRecords(m)));
      return listas.flat();
    },
    enabled: !demoMode && isSupabaseConfigured,
    staleTime: 30_000,
  });

  const todos = useMemo(() => query.data ?? [], [query.data]);
  const moduloAtual = ABAS.find((a) => a.value === aba)!.modulo;
  const registros = useMemo(
    () => todos.filter((r) => r.module === moduloAtual && dentroDoPeriodo(r.payload, periodo)),
    [todos, moduloAtual, periodo],
  );

  const campos = camposDe(aba);
  const columns = useMemo<DataTableColumn<FieldRecord>[]>(
    () =>
      campos.slice(0, 7).map((f) => ({
        key: f.key,
        header: f.label,
        accessor: (rec: FieldRecord) => rec.payload[f.key] ?? "",
        render: (rec: FieldRecord) => rec.payload[f.key] || "-",
        align: "left" as const,
      })),
    [campos],
  );

  const invalidar = async () => {
    await queryClient.invalidateQueries({ queryKey: ["colheita-records"] });
    await invalidateConnectedQueries(queryClient);
  };

  const salvar = useMutation({
    mutationFn: (input: { id: string; payload: Record<string, string> }) =>
      updateFieldRecord(input),
    onSuccess: async () => {
      toast.success("Lançamento atualizado.");
      setEditando(null);
      await invalidar();
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar."),
  });

  const excluir = useMutation({
    mutationFn: (id: string) => deleteFieldRecord(id),
    onSuccess: async () => {
      toast.success("Lançamento excluído.");
      await invalidar();
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível excluir."),
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link to="/campo">Campo</Link>
              <span>/</span>
              <span>Colheita</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Lançamentos de colheita</h1>
            <p className="text-sm text-muted-foreground">
              Corte, carregamento e diárias que alimentam o fechamento de pagamento.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DemoBadge />
            <PasteIngestButton onSaved={() => void invalidar()} />
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs text-muted-foreground">
          De
          <input
            type="date"
            value={periodo.de ?? ""}
            onChange={(e) => setPeriodo((p) => ({ ...p, de: e.target.value || undefined }))}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Até
          <input
            type="date"
            value={periodo.ate ?? ""}
            onChange={(e) => setPeriodo((p) => ({ ...p, ate: e.target.value || undefined }))}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          />
        </label>
        {(periodo.de || periodo.ate) && (
          <button
            type="button"
            onClick={() => setPeriodo({})}
            className="h-9 rounded-lg border border-border px-3 text-sm transition hover:bg-muted"
          >
            Limpar período
          </button>
        )}
        <p className="text-xs text-muted-foreground">
          Lançamento sem data continua contando — nunca some do fechamento.
        </p>
      </div>

      <ColheitaPagamentoCard periodo={periodo} />

      <Segmented
        value={aba}
        onChange={(v) => setAba(v)}
        options={ABAS.map((a) => ({ value: a.value, label: a.label }))}
        aria-label="Tipo de lançamento"
      />

      <DataTable
        columns={columns}
        data={registros}
        getRowId={(rec) => rec.id}
        loading={query.isLoading}
        searchPlaceholder="Buscar lançamento..."
        emptyMessage={
          demoMode
            ? "Os lançamentos aparecem no modo real."
            : "Nenhum lançamento neste tipo — use 'Colar apontamento' para registrar."
        }
        actions={(rec) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditando(rec);
                setRascunho(rec.payload);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
              aria-label="Editar"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                if (demoMode) return toast.info("Dados demo não podem ser excluídos.");
                if (window.confirm("Excluir este lançamento?")) excluir.mutate(rec.id);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted"
              aria-label="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      />

      <Dialog open={editando !== null} onOpenChange={(next) => !next && setEditando(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar lançamento</DialogTitle>
            <DialogDescription>
              {ABAS.find((a) => a.value === aba)?.label} — corrija o que foi digitado errado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {campos.map((f) => (
              <label key={f.key} className="grid gap-1 text-sm">
                <span className="text-muted-foreground">{f.label}</span>
                <input
                  value={rascunho[f.key] ?? ""}
                  onChange={(e) => setRascunho((r) => ({ ...r, [f.key]: e.target.value }))}
                  className="h-9 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
            ))}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="h-9 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={salvar.isPending}
              onClick={() => {
                if (demoMode) return toast.info("Modo DEMO — desligue para salvar de verdade.");
                if (!editando) return;
                // Preserva campos que não estão no formulário (mao_obra, fontes...).
                salvar.mutate({ id: editando.id, payload: { ...editando.payload, ...rascunho } });
              }}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {salvar.isPending ? "Salvando..." : "Salvar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
