import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Leaf,
  Package,
  Plus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { ModuleOverview } from "@/components/module-overview";
import { RichTabPanel } from "@/components/rich-tab";
import { Skeleton } from "@/components/ui/skeleton";
import { buildInsumosOverview } from "@/lib/overview/insumos";
import { cn } from "@/lib/utils";
import { useTalhao360Records } from "@/features/talhao-360/hooks/use-talhao-360";
import { useInsumos, useInvalidateInsumos } from "@/features/insumos/hooks/use-insumos";
import {
  cancelarReserva,
  createInsumo,
  createLote,
  createMovimentacao,
  executarReserva,
  updateInsumo,
  updateLote,
} from "@/features/insumos/api/services";
import { brl, formatDate, formatQtd, reservaAtiva } from "@/features/insumos/lib/estoque";
import {
  insumoCategorias,
  movimentacaoTipoLabel,
  type InsumoPayload,
  type InsumoRecord,
  type LotePayload,
  type MovimentacaoPayload,
  type MovimentacaoRecord,
  type MovimentacaoTipo,
} from "@/features/insumos/types/domain";
import { InsumoFormModal } from "@/features/insumos/components/insumo-form-modal";
import { EntradaLoteModal } from "@/features/insumos/components/entrada-lote-modal";
import { MovimentacaoModal } from "@/features/insumos/components/movimentacao-modal";

// A página não tem abas — tem painéis. A visão geral aponta para eles por
// âncora; seções sem painel próprio caem no painel que mostra o mesmo dado.
const ANCORA_DA_SECAO: Record<string, string> = {
  estoque: "insumos-estoque",
  categorias: "insumos-estoque",
  lotes: "insumos-lotes",
  reservas: "insumos-reservas",
  talhoes: "insumos-movimentacoes",
  movimentacoes: "insumos-movimentacoes",
  alertas: "insumos-alertas",
};

export function InsumosPage() {
  const { model, lotes, isLoading, error, refetch, demoMode } = useInsumos();
  const talhaoRecords = useTalhao360Records();
  const invalidate = useInvalidateInsumos();

  // Antes das saídas antecipadas: hook não pode ficar atrás de `if`.
  const overviewSpec = useMemo(
    () => buildInsumosOverview(model, lotes, demoMode),
    [model, lotes, demoMode],
  );

  const [insumoModal, setInsumoModal] = useState<{ open: boolean; initial?: InsumoRecord | null }>({
    open: false,
  });
  const [entradaOpen, setEntradaOpen] = useState(false);
  const [movOpen, setMovOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [local, setLocal] = useState("");

  const talhaoOptions = useMemo(
    () =>
      (talhaoRecords.data ?? [])
        .filter((record) => record.module === "areas")
        .map((record) => ({ id: record.id, nome: record.payload.talhao || "Talhão" })),
    [talhaoRecords.data],
  );

  const saveInsumo = useMutation({
    mutationFn: ({ payload, id }: { payload: InsumoPayload; id?: string }) =>
      id ? updateInsumo(id, payload) : createInsumo(payload),
    onSuccess: async () => {
      toast.success("Insumo salvo.");
      await invalidate();
      setInsumoModal({ open: false });
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const saveEntrada = useMutation({
    mutationFn: (payload: LotePayload) => createLote(payload),
    onSuccess: async () => {
      toast.success("Entrada registrada.");
      await invalidate();
      setEntradaOpen(false);
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const saveMovimentacao = useMutation({
    mutationFn: async (payload: MovimentacaoPayload) => {
      await createMovimentacao(payload);
      // Transferência move o lote de local (o saldo continua no lote).
      if (payload.tipo === "transferencia" && payload.lote_id && payload.local_destino) {
        const lote = lotes.find((item) => item.id === payload.lote_id);
        if (lote) await updateLote(lote.id, { ...lote.payload, local: payload.local_destino });
      }
    },
    onSuccess: async () => {
      toast.success("Movimentação registrada.");
      await invalidate();
      setMovOpen(false);
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const reservaAction = useMutation({
    mutationFn: ({
      reserva,
      acao,
    }: {
      reserva: MovimentacaoRecord;
      acao: "executar" | "cancelar";
    }) => (acao === "executar" ? executarReserva(reserva) : cancelarReserva(reserva)),
    onSuccess: async (_, { acao }) => {
      toast.success(
        acao === "executar" ? "Reserva executada: estoque baixado." : "Reserva cancelada.",
      );
      await invalidate();
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-6 lg:px-8">
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (error || !model) {
    return (
      <div className="mx-auto mt-16 max-w-xl rounded-xl border border-dashed p-10 text-center">
        <Package className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-xl font-semibold">Não foi possível carregar Insumos</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error?.message}</p>
        <button className="mt-5 h-9 rounded-lg border px-3 text-sm" onClick={() => void refetch()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const reservas = model.movimentacoes.filter(reservaAtiva);
  const locais = Array.from(
    new Set(lotes.map((item) => item.payload.local).filter(Boolean)),
  ) as string[];
  const normalizado = busca.trim().toLowerCase();

  const insumosFiltrados = model.insumos.filter((resumo) => {
    if (categoria && (resumo.insumo.payload.categoria || "Outros") !== categoria) return false;
    if (normalizado && !resumo.insumo.payload.nome.toLowerCase().includes(normalizado))
      return false;
    if (local && !resumo.lotes.some((item) => item.lote.payload.local === local)) return false;
    return true;
  });
  const lotesFiltrados = insumosFiltrados
    .flatMap((resumo) => resumo.lotes.map((item) => ({ resumo, item })))
    .filter(({ item }) => !local || item.lote.payload.local === local)
    .sort((a, b) => (a.item.diasParaVencer ?? Infinity) - (b.item.diasParaVencer ?? Infinity));

  const irParaSecao = (tabId: string) => {
    const alvo = document.getElementById(ANCORA_DA_SECAO[tabId] ?? "");
    alvo?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-6 lg:px-8">
      <header className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link to="/campo">Campo</Link>
              <span>/</span>
              <span>Insumos</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Insumos</h1>
            <p className="text-sm text-muted-foreground">
              Estoque, lotes, validade, reservas e custo por talhão da fazenda ativa.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <HeaderAction icon={Leaf} onClick={() => setInsumoModal({ open: true })}>
              Novo insumo
            </HeaderAction>
            <HeaderAction icon={Plus} onClick={() => setEntradaOpen(true)}>
              Entrada de estoque
            </HeaderAction>
            <HeaderAction icon={ArrowRightLeft} onClick={() => setMovOpen(true)} primary>
              Nova movimentação
            </HeaderAction>
          </div>
        </div>
      </header>

      {/* Dashboard do módulo: KPIs e gráficos das 7 seções. Os alertas entram
          como `hero` para continuarem logo abaixo dos KPIs, como antes. */}
      <ModuleOverview
        spec={{
          ...overviewSpec,
          hero: model.alertas.length ? (
            <div id="insumos-alertas">
              <RichTabPanel title="Alertas" description="Falta, vencimento e reservas sem saldo">
                <div className="space-y-2">
                  {model.alertas.map((alerta) => (
                    <div
                      key={alerta.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border px-3 py-2 text-sm",
                        alerta.severidade === "critico"
                          ? "border-destructive/40 bg-destructive/5"
                          : "border-warning/40 bg-warning/5",
                      )}
                    >
                      <AlertTriangle
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          alerta.severidade === "critico" ? "text-destructive" : "text-warning",
                        )}
                      />
                      <div>
                        <div className="font-medium">{alerta.titulo}</div>
                        <div className="text-xs text-muted-foreground">{alerta.descricao}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </RichTabPanel>
            </div>
          ) : undefined,
        }}
        onSelectTab={irParaSecao}
        mostrarExport
      />

      <div id="insumos-estoque">
        <RichTabPanel
          title="Estoque por insumo"
          description="Saldo físico, reservas e disponível por produto"
          action={
            <div className="flex flex-wrap gap-2">
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar insumo…"
                className="h-9 w-40 rounded-lg border border-border bg-background px-3 text-sm"
              />
              <select
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
              >
                <option value="">Todas as categorias</option>
                {insumoCategorias.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                value={local}
                onChange={(event) => setLocal(event.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
              >
                <option value="">Todos os locais</option>
                {locais.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          }
        >
          {insumosFiltrados.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    {[
                      "Insumo",
                      "Categoria",
                      "Físico",
                      "Reservado",
                      "Disponível",
                      "Valor",
                      "Lotes",
                      "",
                    ].map((header, index) => (
                      <th key={index} className="py-3 pr-4 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {insumosFiltrados.map((resumo) => {
                    const unidade = resumo.insumo.payload.unidade || "un";
                    return (
                      <tr key={resumo.insumo.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{resumo.insumo.payload.nome}</td>
                        <td className="py-3 pr-4">{resumo.insumo.payload.categoria || "Outros"}</td>
                        <td className="py-3 pr-4 tabular-nums">
                          {formatQtd(resumo.saldoFisico)} {unidade}
                        </td>
                        <td className="py-3 pr-4 tabular-nums">{formatQtd(resumo.reservado)}</td>
                        <td
                          className={cn(
                            "py-3 pr-4 font-semibold tabular-nums",
                            (resumo.abaixoDoMinimo || resumo.disponivel < 0) && "text-destructive",
                          )}
                        >
                          {formatQtd(resumo.disponivel)} {unidade}
                          {resumo.abaixoDoMinimo && (
                            <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                              abaixo do mínimo
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 tabular-nums">{brl(resumo.valorEmEstoque)}</td>
                        <td className="py-3 pr-4">{resumo.lotes.length}</td>
                        <td className="py-3 pr-0 text-right">
                          <button
                            className="rounded-lg border px-2 py-1 text-xs hover:bg-muted"
                            onClick={() => setInsumoModal({ open: true, initial: resumo.insumo })}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Nenhum insumo cadastrado"
              description="Cadastre o catálogo e registre a primeira entrada de estoque."
              icon={Leaf}
            />
          )}
        </RichTabPanel>
      </div>

      <div id="insumos-lotes">
        <RichTabPanel
          title="Lotes e validade"
          description="Rastreabilidade por lote, local e vencimento"
        >
          {lotesFiltrados.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    {[
                      "Lote",
                      "Insumo",
                      "Local",
                      "Validade",
                      "Físico",
                      "Disponível",
                      "Custo unit.",
                      "Valor",
                    ].map((header) => (
                      <th key={header} className="py-3 pr-4 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lotesFiltrados.map(({ resumo, item }) => (
                    <tr key={item.lote.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">
                        {item.lote.payload.numero || item.lote.id.slice(0, 8)}
                      </td>
                      <td className="py-3 pr-4">{resumo.insumo.payload.nome}</td>
                      <td className="py-3 pr-4">{item.lote.payload.local || "—"}</td>
                      <td className="py-3 pr-4">
                        <ValidadeBadge vencido={item.vencido} dias={item.diasParaVencer}>
                          {formatDate(item.lote.payload.validade)}
                        </ValidadeBadge>
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{formatQtd(item.saldoFisico)}</td>
                      <td className="py-3 pr-4 tabular-nums">{formatQtd(item.disponivel)}</td>
                      <td className="py-3 pr-4 tabular-nums">
                        {brlDecimais(numOr(item.lote.payload.custo_unitario))}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{brl(item.valorEmEstoque)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Nenhum lote em estoque" icon={Boxes} />
          )}
        </RichTabPanel>
      </div>

      <div id="insumos-reservas">
        <RichTabPanel
          title="Reservas ativas"
          description="Estoque separado para operações futuras — executar baixa definitiva ao concluir"
        >
          {reservas.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    {["Data", "Insumo", "Lote", "Qtd.", "Talhão", "Ciclo", "Operação", ""].map(
                      (header, index) => (
                        <th key={index} className="py-3 pr-4 font-medium">
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((reserva) => (
                    <tr key={reserva.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{formatDate(reserva.payload.data)}</td>
                      <td className="py-3 pr-4 font-medium">{reserva.payload.insumo}</td>
                      <td className="py-3 pr-4">{reserva.payload.lote || "—"}</td>
                      <td className="py-3 pr-4 tabular-nums">
                        {formatQtd(numOr(reserva.payload.quantidade))} {reserva.payload.unidade}
                      </td>
                      <td className="py-3 pr-4">{reserva.payload.talhao || "—"}</td>
                      <td className="py-3 pr-4">{reserva.payload.ciclo || "—"}</td>
                      <td className="py-3 pr-4">{reserva.payload.operacao || "—"}</td>
                      <td className="py-3 pr-0">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:bg-muted"
                            onClick={() => reservaAction.mutate({ reserva, acao: "executar" })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Executar
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                            onClick={() => reservaAction.mutate({ reserva, acao: "cancelar" })}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Sem reservas ativas"
              description="Crie uma movimentação do tipo Reserva para separar estoque de uma operação futura."
              icon={ClipboardList}
            />
          )}
        </RichTabPanel>
      </div>

      {/* "Valor em estoque por categoria" e "Custo aplicado por talhão" saíram
          daqui: viraram gráficos da visão geral (a de talhão agora separa
          reservado de aplicado, que a barra simples não mostrava). */}
      <div id="insumos-movimentacoes">
        <RichTabPanel
          title="Movimentações recentes"
          description="Entradas, saídas, reservas e ajustes"
        >
          {model.movimentacoes.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    {[
                      "Data",
                      "Tipo",
                      "Insumo",
                      "Lote",
                      "Qtd.",
                      "Talhão",
                      "Operação",
                      "Responsável",
                    ].map((header) => (
                      <th key={header} className="py-3 pr-4 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.movimentacoes.slice(0, 15).map((mov) => (
                    <tr key={mov.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{formatDate(mov.payload.data)}</td>
                      <td className="py-3 pr-4">
                        <TipoBadge
                          tipo={mov.payload.tipo as MovimentacaoTipo}
                          status={mov.payload.status}
                        />
                      </td>
                      <td className="py-3 pr-4 font-medium">{mov.payload.insumo}</td>
                      <td className="py-3 pr-4">{mov.payload.lote || "—"}</td>
                      <td className="py-3 pr-4 tabular-nums">
                        {formatQtd(numOr(mov.payload.quantidade))} {mov.payload.unidade}
                      </td>
                      <td className="py-3 pr-4">{mov.payload.talhao || "—"}</td>
                      <td className="py-3 pr-4">{mov.payload.operacao || "—"}</td>
                      <td className="py-3 pr-4">{mov.payload.responsavel || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Nenhuma movimentação registrada" icon={ArrowRightLeft} />
          )}
        </RichTabPanel>
      </div>

      <InsumoFormModal
        open={insumoModal.open}
        onOpenChange={(open) => setInsumoModal((current) => ({ ...current, open }))}
        initial={insumoModal.initial}
        saving={saveInsumo.isPending}
        onSave={(payload, id) => saveInsumo.mutate({ payload, id })}
      />
      <EntradaLoteModal
        open={entradaOpen}
        onOpenChange={setEntradaOpen}
        insumos={model.insumos.map((resumo) => resumo.insumo)}
        saving={saveEntrada.isPending}
        onSave={(payload) => saveEntrada.mutate(payload)}
      />
      <MovimentacaoModal
        open={movOpen}
        onOpenChange={setMovOpen}
        model={model}
        saving={saveMovimentacao.isPending}
        talhaoOptions={talhaoOptions}
        onSave={(payload) => saveMovimentacao.mutate(payload)}
      />
    </div>
  );
}

function HeaderAction({
  icon: Icon,
  children,
  onClick,
  primary,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium",
        primary ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function ValidadeBadge({
  vencido,
  dias,
  children,
}: {
  vencido: boolean;
  dias?: number;
  children: React.ReactNode;
}) {
  if (dias === undefined) return <span className="text-muted-foreground">{children}</span>;
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-xs font-medium",
        vencido
          ? "bg-destructive/12 text-destructive"
          : dias <= 30
            ? "bg-warning/15 text-warning"
            : "bg-muted text-muted-foreground",
      )}
    >
      {children}
      {vencido ? " · vencido" : dias <= 30 ? ` · ${dias}d` : ""}
    </span>
  );
}

function TipoBadge({ tipo, status }: { tipo: MovimentacaoTipo; status?: string }) {
  const label = movimentacaoTipoLabel[tipo] ?? tipo;
  const executada = tipo === "reserva" && status === "executada";
  const cancelada = tipo === "reserva" && status === "cancelada";
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-xs font-medium",
        tipo === "entrada" && "bg-success/15 text-success",
        tipo === "saida" && "bg-primary/10 text-primary",
        tipo === "reserva" && !executada && !cancelada && "bg-warning/15 text-warning",
        (tipo === "perda" || cancelada) && "bg-destructive/12 text-destructive",
        (tipo === "transferencia" || tipo === "ajuste" || tipo === "devolucao" || executada) &&
          "bg-muted text-muted-foreground",
      )}
    >
      {label}
      {executada ? " · executada" : cancelada ? " · cancelada" : ""}
    </span>
  );
}

function numOr(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function brlDecimais(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
