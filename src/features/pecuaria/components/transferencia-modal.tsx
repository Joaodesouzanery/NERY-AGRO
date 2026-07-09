import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateAnimaisBatch } from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import { registrarTransferenciaInterna } from "@/features/pecuaria/lib/transferencia-interna";
import type { CostCenter } from "@/lib/supabase-cost-centers";
import type { PecAnimal, PecLote } from "@/features/pecuaria/types/domain";

// Desmame com TRANSFERÊNCIA INTERNA DE VALOR: move os animais de lote e gera os
// dois lançamentos espelhados no Financeiro (receita na cria, custo na recria).

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function TransferenciaModal({
  open,
  onOpenChange,
  lotes,
  animais,
  costCenters,
  valorPadraoPorCabeca,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotes: PecLote[];
  animais: PecAnimal[];
  costCenters: CostCenter[];
  valorPadraoPorCabeca: number;
}) {
  const queryClient = useQueryClient();
  const [origemId, setOrigemId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [valorCabeca, setValorCabeca] = useState(String(valorPadraoPorCabeca));
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const candidatos = useMemo(
    () => animais.filter((a) => a.lote_id === origemId && a.status === "ativo"),
    [animais, origemId],
  );

  const nomeCC = (loteId: string) => {
    const lote = lotes.find((l) => l.id === loteId);
    if (!lote?.centro_custo_id) return null;
    return costCenters.find((c) => c.id === lote.centro_custo_id)?.nome ?? null;
  };

  const valorUnit = Number(valorCabeca.replace(",", ".")) || 0;
  const valorTotal = valorUnit * selecionados.size;

  const transferir = useMutation({
    mutationFn: async () => {
      const origem = lotes.find((l) => l.id === origemId);
      const destino = lotes.find((l) => l.id === destinoId);
      if (!origem || !destino) throw new Error("Selecione o lote de origem e o de destino.");
      const ids = [...selecionados];

      await updateAnimaisBatch(ids, { lote_id: destinoId });
      await registrarTransferenciaInterna({
        data: new Date().toISOString().slice(0, 10),
        valorTotal,
        cabecas: ids.length,
        loteOrigemNome: origem.nome,
        loteDestinoNome: destino.nome,
        centroCustoOrigemNome: nomeCC(origemId),
        centroCustoDestinoNome: nomeCC(destinoId),
      });
    },
    onSuccess: () => {
      toast.success(
        `${selecionados.size} animais transferidos. Receita interna lançada na origem e custo no destino.`,
      );
      void queryClient.invalidateQueries({ queryKey: pecKeys.all });
      setSelecionados(new Set());
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(`Falha na transferência: ${e.message}`),
  });

  const semCC = origemId && destinoId && (!nomeCC(origemId) || !nomeCC(destinoId));
  const podeTransferir =
    origemId && destinoId && origemId !== destinoId && selecionados.size > 0 && valorUnit > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Desmame — transferência interna de valor</DialogTitle>
          <DialogDescription>
            Move os animais e lança receita interna no lote de origem e custo no de destino, pelo
            valor de mercado. Sem isso a cria aparece falsamente no vermelho.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Lote de origem (cria)">
              <select
                value={origemId}
                onChange={(e) => {
                  setOrigemId(e.target.value);
                  setSelecionados(new Set());
                }}
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
              >
                <option value="">Selecione…</option>
                {lotes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Lote de destino (recria)">
              <select
                value={destinoId}
                onChange={(e) => setDestinoId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
              >
                <option value="">Selecione…</option>
                {lotes
                  .filter((l) => l.id !== origemId)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
              </select>
            </Campo>
          </div>

          <Campo label="Valor de mercado por cabeça (R$)">
            <input
              value={valorCabeca}
              onChange={(e) => setValorCabeca(e.target.value)}
              inputMode="decimal"
              className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
            />
          </Campo>

          {semCC && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
              Um dos lotes não tem centro de custo vinculado. A transferência será lançada sem
              centro de custo e não entrará no custo/@ desse lote.
            </p>
          )}

          {origemId && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {candidatos.length} animais ativos na origem
                </span>
                <button
                  onClick={() =>
                    setSelecionados(
                      selecionados.size === candidatos.length
                        ? new Set()
                        : new Set(candidatos.map((a) => a.id)),
                    )
                  }
                  className="text-xs font-medium text-primary"
                >
                  {selecionados.size === candidatos.length ? "Limpar" : "Selecionar todos"}
                </button>
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {candidatos.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selecionados.has(a.id)}
                      onChange={() =>
                        setSelecionados((prev) => {
                          const next = new Set(prev);
                          if (next.has(a.id)) next.delete(a.id);
                          else next.add(a.id);
                          return next;
                        })
                      }
                    />
                    <span className="font-medium">{a.brinco_visual ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">{a.categoria ?? ""}</span>
                  </label>
                ))}
                {!candidatos.length && (
                  <p className="p-2 text-xs text-muted-foreground">Nenhum animal ativo no lote.</p>
                )}
              </div>
            </div>
          )}

          {selecionados.size > 0 && valorUnit > 0 && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {selecionados.size} cab. × {brl(valorUnit)}
                </span>
                <strong className="tabular-nums">{brl(valorTotal)}</strong>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!podeTransferir || transferir.isPending}
            onClick={() => transferir.mutate()}
          >
            <ArrowRightLeft className="h-4 w-4" />
            {transferir.isPending ? "Transferindo…" : "Registrar desmame"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
