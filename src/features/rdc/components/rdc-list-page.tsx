import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Search, Camera, FileText, Wallet, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { StatKpi } from "@/components/stat-kpi";
import { EmptyState } from "@/components/empty-state";
import { rdcKeys } from "@/features/rdc/api/query-keys";
import { createFicha, localToday } from "@/features/rdc/api/services";
import { useRdcFichas } from "@/features/rdc/hooks/use-rdc";
import type { RdcFicha } from "@/features/rdc/types/domain";
import { PasteIngestButton } from "@/features/remessa/components/paste-ingest-dialog";
import { ColheitaPagamentoCard } from "@/features/remessa/components/colheita-pagamento-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("pt-BR");
}

function today() {
  return localToday();
}

export function RdcListPage() {
  const { fichas, demoMode, isLoading } = useRdcFichas();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<RdcFicha>>({});

  const createM = useMutation({
    mutationFn: () =>
      createFicha({
        data: form.data || today(),
        titulo: form.titulo || `RDC ${fmtDate(form.data || today())}`,
        responsavel: form.responsavel,
        local: form.local,
        climaResumo: form.climaResumo,
        resumo: form.resumo,
        status: "Rascunho",
      }),
    onSuccess: (record) => {
      void queryClient.invalidateQueries({ queryKey: rdcKeys.root });
      invalidateConnectedQueries(queryClient);
      setOpen(false);
      setForm({});
      void navigate({ to: "/rdc/$id", params: { id: record.id } });
    },
    onError: (error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return fichas.filter((ficha) => {
      if (dateFilter && ficha.data !== dateFilter) return false;
      if (!term) return true;
      return [ficha.titulo, ficha.responsavel, ficha.local].join(" ").toLowerCase().includes(term);
    });
  }, [fichas, search, dateFilter]);

  const totalItens = fichas.reduce((sum, ficha) => sum + ficha.itens, 0);
  const totalFotos = fichas.reduce((sum, ficha) => sum + ficha.fotos, 0);
  const totalCusto = fichas.reduce((sum, ficha) => sum + ficha.custo, 0);

  const beginCreate = () => {
    if (demoMode) {
      toast.info("Desligue o modo DEMO para criar fichas reais.");
      return;
    }
    setForm({ data: today() });
    setOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Operação / Diário
          </div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <ClipboardList className="h-6 w-6 text-primary" />
            Relatório Diário de Campo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre tudo do dia — campo, pecuária, observações e fotos — e exporte em PDF.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground">
            {demoMode ? "DEMO" : "REAL"}
          </span>
          <button
            type="button"
            onClick={beginCreate}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Nova ficha
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatKpi label="Fichas" value={String(fichas.length)} icon={ClipboardList} />
        <StatKpi label="Itens registrados" value={String(totalItens)} icon={FileText} />
        <StatKpi label="Custo acumulado" value={brl(totalCusto)} icon={Wallet} />
        <StatKpi label="Fotos" value={String(totalFotos)} icon={Camera} />
      </div>

      <ColheitaPagamentoCard />

      <div className="mt-5 flex flex-wrap gap-3">
        <PasteIngestButton />
        <label className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título, responsável ou local"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
          />
        </label>
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
        />
        {dateFilter && (
          <button
            type="button"
            onClick={() => setDateFilter("")}
            className="h-10 rounded-lg border border-border px-3 text-sm text-muted-foreground"
          >
            Limpar data
          </button>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Carregando fichas…</p>
        ) : filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((ficha) => (
              <Link
                key={ficha.id}
                to="/rdc/$id"
                params={{ id: ficha.id }}
                className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold group-hover:text-primary">
                      {ficha.titulo}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {fmtDate(ficha.data)}
                      {ficha.responsavel ? ` · ${ficha.responsavel}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      ficha.status === "Concluído"
                        ? "bg-success/12 text-success"
                        : "bg-warning/15 text-warning"
                    }`}
                  >
                    {ficha.status}
                  </span>
                </div>
                {ficha.local && (
                  <p className="mt-2 truncate text-xs text-muted-foreground">{ficha.local}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {ficha.itens} itens
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5" />
                    {ficha.fotos} fotos
                  </span>
                  {ficha.custo > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" />
                      {brl(ficha.custo)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title={fichas.length ? "Nenhuma ficha para o filtro" : "Nenhuma ficha ainda"}
            description={
              fichas.length
                ? "Ajuste a busca ou a data."
                : demoMode
                  ? "Ligue dados reais e clique em “Nova ficha”."
                  : "Clique em “Nova ficha” para começar o diário de hoje."
            }
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova ficha de RDC</DialogTitle>
            <DialogDescription>
              Defina o cabeçalho. Os itens são adicionados na ficha.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Data</span>
              <input
                type="date"
                value={form.data ?? today()}
                onChange={(event) =>
                  setForm((current) => ({ ...current, data: event.target.value }))
                }
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Título</span>
              <input
                value={form.titulo ?? ""}
                placeholder="Ex.: RDC — Turno manhã"
                onChange={(event) =>
                  setForm((current) => ({ ...current, titulo: event.target.value }))
                }
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Responsável</span>
              <input
                value={form.responsavel ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, responsavel: event.target.value }))
                }
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Local / Fazenda</span>
              <input
                value={form.local ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, local: event.target.value }))
                }
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="grid gap-1.5 text-sm sm:col-span-2">
              <span className="text-muted-foreground">Clima (resumo)</span>
              <input
                value={form.climaResumo ?? ""}
                placeholder="Ex.: Ensolarado, 28°C"
                onChange={(event) =>
                  setForm((current) => ({ ...current, climaResumo: event.target.value }))
                }
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-lg border border-border px-3 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => createM.mutate()}
              disabled={createM.isPending}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Criar e abrir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
