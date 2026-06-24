import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileDown, Pencil, Trash2, FileText, Wallet, AlertTriangle, Camera } from "lucide-react";
import { toast } from "sonner";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { StatKpi } from "@/components/stat-kpi";
import { Skeleton } from "@/components/ui/skeleton";
import { rdcKeys } from "@/features/rdc/api/query-keys";
import { deleteFicha, updateFicha } from "@/features/rdc/api/services";
import { useRdc } from "@/features/rdc/hooks/use-rdc";
import { SECAO_CONFIGS } from "@/features/rdc/data/section-config";
import { exportRdcPdf } from "@/features/rdc/pdf/rdc-pdf";
import type { RdcFicha, Secao } from "@/features/rdc/types/domain";
import { RdcSectionPanel } from "@/features/rdc/components/rdc-section-panel";
import { RdcPhotoSection } from "@/features/rdc/components/photo-uploader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("pt-BR");
}

export function RdcDetailPage({ rdcId }: { rdcId: string }) {
  const { model, isLoading, error, demoMode } = useRdc(rdcId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [secao, setSecao] = useState<Secao>("campo");
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<RdcFicha | null>(null);
  const [exporting, setExporting] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: rdcKeys.root });
    invalidateConnectedQueries(queryClient);
  };

  const updateM = useMutation({
    mutationFn: (ficha: RdcFicha) => updateFicha(rdcId, ficha),
    onSuccess: () => {
      toast.success("Cabeçalho atualizado.");
      setEditOpen(false);
      invalidate();
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const deleteM = useMutation({
    mutationFn: () => deleteFicha(rdcId),
    onSuccess: () => {
      toast.success("Ficha excluída.");
      invalidate();
      void navigate({ to: "/rdc" });
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-40" />
        <Skeleton className="h-12" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="mx-auto mt-16 max-w-xl rounded-xl border border-dashed p-10 text-center">
        <h1 className="text-xl font-semibold">Ficha não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ? error.message : "Esta ficha de RDC não existe ou foi removida."}
        </p>
        <Link to="/rdc" className="mt-5 inline-block text-primary">
          Voltar para o histórico
        </Link>
      </div>
    );
  }

  const { ficha } = model;

  const beginEdit = () => {
    if (demoMode) return toast.info("Fichas demo não podem ser editadas.");
    setForm({ ...ficha });
    setEditOpen(true);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportRdcPdf(model);
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link to="/rdc" className="hover:text-foreground">
                RDC
              </Link>
              <span>/</span>
              <span className="truncate">{ficha.titulo}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{ficha.titulo}</h1>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  ficha.status === "Concluído"
                    ? "bg-success/12 text-success"
                    : "bg-warning/15 text-warning",
                )}
              >
                {ficha.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {fmtDate(ficha.data)}
              {ficha.responsavel ? ` · ${ficha.responsavel}` : ""}
              {ficha.local ? ` · ${ficha.local}` : ""}
              {ficha.climaResumo ? ` · ${ficha.climaResumo}` : ""}
            </p>
            {ficha.resumo && <p className="mt-2 max-w-2xl text-sm">{ficha.resumo}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              <FileDown className="h-4 w-4" />
              {exporting ? "Gerando…" : "Exportar PDF"}
            </button>
            <button
              type="button"
              onClick={beginEdit}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm"
            >
              <Pencil className="h-4 w-4" />
              Editar cabeçalho
            </button>
            <button
              type="button"
              onClick={() => {
                if (demoMode) return toast.info("Fichas demo não podem ser excluídas.");
                if (confirm("Excluir esta ficha e todos os seus itens e fotos?")) deleteM.mutate();
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/40 px-3 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatKpi label="Itens" value={String(model.totalItens)} icon={FileText} />
          <StatKpi label="Custo total" value={brl(model.totalCusto)} icon={Wallet} />
          <StatKpi
            label="Ocorrências"
            value={String(model.ocorrenciasAbertas)}
            icon={AlertTriangle}
          />
          <StatKpi label="Fotos" value={String(model.photos.length)} icon={Camera} />
        </div>
      </header>

      <nav className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {SECAO_CONFIGS.map((config) => {
          const active = secao === config.secao;
          const count = model.entriesBySecao[config.secao].length;
          return (
            <button
              key={config.secao}
              type="button"
              onClick={() => setSecao(config.secao)}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <config.icon className="h-4 w-4" />
              {config.label}
              <span className="rounded-full bg-muted px-1.5 text-[11px]">{count}</span>
            </button>
          );
        })}
      </nav>

      <main className="mt-4 space-y-4">
        <RdcSectionPanel
          rdcId={rdcId}
          fichaData={ficha.data}
          secao={secao}
          entries={model.entriesBySecao[secao]}
          demoMode={demoMode}
        />
        {secao === "observacoes" && (
          <RdcPhotoSection rdcId={rdcId} photos={model.photos} demoMode={demoMode} />
        )}
      </main>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar cabeçalho</DialogTitle>
            <DialogDescription>Dados gerais da ficha.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Data</span>
                <input
                  type="date"
                  value={form.data}
                  onChange={(event) => setForm({ ...form, data: event.target.value })}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Título</span>
                <input
                  value={form.titulo}
                  onChange={(event) => setForm({ ...form, titulo: event.target.value })}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Responsável</span>
                <input
                  value={form.responsavel}
                  onChange={(event) => setForm({ ...form, responsavel: event.target.value })}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Local / Fazenda</span>
                <input
                  value={form.local}
                  onChange={(event) => setForm({ ...form, local: event.target.value })}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Clima (resumo)</span>
                <input
                  value={form.climaResumo}
                  onChange={(event) => setForm({ ...form, climaResumo: event.target.value })}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as RdcFicha["status"] })
                  }
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="Rascunho">Rascunho</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm sm:col-span-2">
                <span className="text-muted-foreground">Resumo do dia</span>
                <textarea
                  value={form.resumo}
                  onChange={(event) => setForm({ ...form, resumo: event.target.value })}
                  className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="h-9 rounded-lg border border-border px-3 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => form && updateM.mutate(form)}
              disabled={updateM.isPending}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
