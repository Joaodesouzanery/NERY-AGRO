import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildCarbonSuggestions,
  suggestionToPayload,
  type CarbonSuggestion,
} from "@/lib/carbon-auto-capture";
import { createOperationRecord } from "@/lib/supabase-operations";
import { invalidateConnectedQueries, useConnectedAgroData } from "@/lib/connected-agro-data";
import { useDemoMode } from "@/hooks/use-demo-mode";

function fmtKg(kg: number) {
  return kg >= 1000
    ? `${(kg / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} t`
    : `${kg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
}

/**
 * "Sugestões automáticas de emissão": lê a operação que já existe (rebanho, cargas,
 * fretes) e propõe registros de carbono. O usuário confere/seleciona e salva — nada
 * é gravado sem confirmação (o data layer ainda barra escrita em DEMO).
 */
export function CarbonAutoCaptureButton() {
  const { snapshot } = useConnectedAgroData();
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [skip, setSkip] = useState<Set<string>>(new Set());

  const suggestions = useMemo(
    () =>
      buildCarbonSuggestions({
        operations: snapshot.operations,
        pecuariaCabecas: snapshot.pecuariaCabecas,
      }),
    [snapshot.operations, snapshot.pecuariaCabecas],
  );

  const toggle = (id: string) =>
    setSkip((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selecionadas = suggestions.filter((s) => !skip.has(s.id));

  const mutation = useMutation({
    mutationFn: async (items: CarbonSuggestion[]) => {
      const periodo = String(new Date().getFullYear());
      for (const s of items) {
        await createOperationRecord({
          area: "sustentabilidade",
          module: "carbono",
          payload: suggestionToPayload(s, periodo),
        });
      }
      return items.length;
    },
    onSuccess: async (n) => {
      await invalidateConnectedQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: ["operation-records", "sustentabilidade"] });
      toast.success(`${n} emissão(ões) registrada(s) a partir da operação.`);
      setOpen(false);
    },
    onError: (e) => toast.error((e as Error).message || "Não foi possível salvar."),
  });

  const salvar = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para salvar dados reais.");
    if (selecionadas.length === 0) return toast.info("Selecione ao menos uma sugestão.");
    mutation.mutate(selecionadas);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted"
      >
        <Sparkles className="h-4 w-4" />
        Sugestões automáticas
        {suggestions.length > 0 && (
          <span className="rounded bg-primary/12 px-1.5 py-0.5 text-[11px] font-medium text-primary">
            {suggestions.length}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sugestões automáticas de emissão</DialogTitle>
            <DialogDescription>
              A partir do que já está no sistema (rebanho, cargas, fretes). Confira e ajuste depois
              se precisar — nada é salvo sem sua confirmação.
            </DialogDescription>
          </DialogHeader>

          {suggestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem dados suficientes para sugerir emissões. Registre rebanho, cargas ou fretes e
              volte aqui.
            </p>
          ) : (
            <div className="space-y-2">
              {suggestions.map((s) => {
                const on = !skip.has(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(s.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{s.atividade}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          Escopo {s.escopo}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {s.fonte}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {s.volume.toLocaleString("pt-BR")} {s.unidade} × {s.fator} ={" "}
                        <strong className="text-foreground">{fmtKg(s.co2e)}</strong> CO₂e
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        Premissa: {s.premissa}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

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
              onClick={salvar}
              disabled={mutation.isPending || suggestions.length === 0}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {mutation.isPending
                ? "Salvando..."
                : `Salvar ${selecionadas.length || ""} selecionada(s)`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
