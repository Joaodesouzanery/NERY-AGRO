import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Package,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { RichBarList, RichTabKpis, RichTabPanel } from "@/components/rich-tab";
import { Skeleton } from "@/components/ui/skeleton";
import { useInsumos, useInvalidateInsumos } from "@/features/insumos/hooks/use-insumos";
import {
  cancelarReserva,
  createMovimentacao,
  executarReserva,
} from "@/features/insumos/api/services";
import {
  brl,
  buildTalhaoInsumosResumo,
  formatDate,
  formatQtd,
  num,
  reservaAtiva,
} from "@/features/insumos/lib/estoque";
import {
  movimentacaoTipoLabel,
  type MovimentacaoPayload,
  type MovimentacaoRecord,
  type MovimentacaoTipo,
} from "@/features/insumos/types/domain";
import { MovimentacaoModal } from "@/features/insumos/components/movimentacao-modal";
import type { TalhaoCycle, TalhaoRecord } from "@/features/talhao-360/types/domain";

export function InsumosTab({
  talhao,
  selectedSeason,
  selectedCycle,
}: {
  talhao: TalhaoRecord;
  selectedSeason: string;
  selectedCycle: TalhaoCycle | null;
}) {
  const { model, lotes, isLoading, error, refetch } = useInsumos();
  const invalidate = useInvalidateInsumos();
  const [movOpen, setMovOpen] = useState(false);

  const saveMovimentacao = useMutation({
    mutationFn: (payload: MovimentacaoPayload) => createMovimentacao(payload),
    onSuccess: async () => {
      toast.success("Movimentação registrada no talhão.");
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
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (error || !model) {
    return (
      <EmptyState
        title="Não foi possível carregar os insumos"
        description={error?.message}
        icon={Package}
        action={
          <button className="h-9 rounded-lg border px-3 text-sm" onClick={() => void refetch()}>
            Tentar novamente
          </button>
        }
      />
    );
  }

  const resumo = buildTalhaoInsumosResumo(
    model,
    lotes,
    { id: talhao.id, nome: talhao.payload.talhao },
    selectedSeason,
  );
  const areaHa = num(talhao.payload.area_util || talhao.payload.area_ha);
  const custoRealizadoHa = areaHa > 0 ? resumo.custoRealizado / areaHa : 0;
  const custoPlanejadoHa = selectedCycle?.custoPrevistoHa ?? num(talhao.payload.custo_planejado_ha);
  const acimaDoPlanejado = custoPlanejadoHa > 0 && custoRealizadoHa > custoPlanejadoHa;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Insumos · Safra {selectedSeason}</h2>
          <p className="text-sm text-muted-foreground">
            Reservas, aplicações e custo de insumos deste talhão.{" "}
            <Link to="/campo/insumos" className="text-primary underline-offset-2 hover:underline">
              Abrir estoque da fazenda
            </Link>
          </p>
        </div>
        <button
          onClick={() => setMovOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Registrar aplicação/reserva
        </button>
      </header>

      <RichTabKpis
        kpis={[
          {
            label: "Custo realizado",
            value: brl(resumo.custoRealizado),
            icon: Wallet,
            hint: "saídas executadas",
          },
          {
            label: "Custo realizado/ha",
            value: areaHa > 0 ? brl(custoRealizadoHa) : "—",
            icon: Wallet,
            trend: acimaDoPlanejado
              ? "acima do plano"
              : custoPlanejadoHa
                ? "dentro do plano"
                : undefined,
            trendDir: acimaDoPlanejado ? "down" : "up",
          },
          {
            label: "Custo planejado/ha",
            value: custoPlanejadoHa ? brl(custoPlanejadoHa) : "—",
            icon: Wallet,
            hint: selectedCycle?.nome,
          },
          {
            label: "Reservado (previsto)",
            value: brl(resumo.custoPrevisto),
            icon: Package,
            hint: "operações futuras",
          },
          { label: "Aplicações", value: resumo.aplicacoes.length, icon: CheckCircle2 },
          { label: "Reservas ativas", value: resumo.reservas.length, icon: AlertTriangle },
        ]}
      />

      {acimaDoPlanejado && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <div className="font-medium">Custo de insumos acima do planejado</div>
            <div className="text-xs text-muted-foreground">
              Realizado {brl(custoRealizadoHa)}/ha contra {brl(custoPlanejadoHa)}/ha planejados
              {selectedCycle ? ` para ${selectedCycle.nome}` : ""}.
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel title="Custo por categoria" description="Saídas executadas nesta safra">
          {resumo.custoPorCategoria.length ? (
            <RichBarList items={resumo.custoPorCategoria} format={brl} />
          ) : (
            <EmptyState title="Nenhuma aplicação registrada" icon={Package} />
          )}
        </RichTabPanel>
        <RichTabPanel
          title="Reservas ativas"
          description="Estoque separado para operações futuras deste talhão"
        >
          {resumo.reservas.length ? (
            <div className="space-y-2">
              {resumo.reservas.map((reserva) => (
                <div
                  key={reserva.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">
                      {reserva.payload.insumo} · {formatQtd(num(reserva.payload.quantidade))}{" "}
                      {reserva.payload.unidade}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(reserva.payload.data)}
                      {reserva.payload.ciclo ? ` · ${reserva.payload.ciclo}` : ""}
                      {reserva.payload.operacao ? ` · ${reserva.payload.operacao}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
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
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sem reservas para este talhão" icon={Package} />
          )}
        </RichTabPanel>
      </div>

      <RichTabPanel
        title="Movimentações do talhão"
        description="Histórico de insumos vinculados a este talhão na safra selecionada"
      >
        {resumo.movimentacoes.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  {["Data", "Tipo", "Insumo", "Lote", "Qtd.", "Ciclo", "Operação"].map((header) => (
                    <th key={header} className="py-3 pr-4 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resumo.movimentacoes.map((mov) => (
                  <tr key={mov.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">{formatDate(mov.payload.data)}</td>
                    <td className="py-3 pr-4">
                      {movimentacaoTipoLabel[mov.payload.tipo as MovimentacaoTipo] ??
                        mov.payload.tipo}
                      {reservaAtiva(mov) ? " (ativa)" : ""}
                    </td>
                    <td className="py-3 pr-4 font-medium">{mov.payload.insumo}</td>
                    <td className="py-3 pr-4">{mov.payload.lote || "—"}</td>
                    <td className="py-3 pr-4 tabular-nums">
                      {formatQtd(num(mov.payload.quantidade))} {mov.payload.unidade}
                    </td>
                    <td className="py-3 pr-4">{mov.payload.ciclo || "—"}</td>
                    <td className="py-3 pr-4">{mov.payload.operacao || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Nenhum insumo vinculado a este talhão"
            description="Registre uma aplicação ou reserva para começar o pacote técnico da safra."
            icon={ArrowRightLeft}
          />
        )}
      </RichTabPanel>

      <MovimentacaoModal
        open={movOpen}
        onOpenChange={setMovOpen}
        model={model}
        saving={saveMovimentacao.isPending}
        context={{
          talhaoId: talhao.id,
          talhao: talhao.payload.talhao,
          safra: selectedSeason,
          ciclo: selectedCycle?.nome,
        }}
        onSave={(payload) => saveMovimentacao.mutate(payload)}
      />
    </div>
  );
}
