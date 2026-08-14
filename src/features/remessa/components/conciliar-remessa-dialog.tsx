import { useMemo, useState } from "react";
import { Link2, Split } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DiffPanel } from "@/features/remessa/components/diff-panel";
import {
  aplicarEscolhas,
  calcularDiff,
  escolhasPadrao,
  type EscolhaDiff,
} from "@/features/remessa/lib/diff";
import { resumoCandidato, SCORE_FORTE, type MatchCandidate } from "@/lib/remessa-match";
import { cn } from "@/lib/utils";

// "Achei uma carga parecida — é a mesma?" A mesma carga chega por até três
// caminhos (texto, foto do romaneio, ticket da balança). Aqui o usuário decide
// se é a mesma carga e o que vale em cada campo. Nunca há merge automático.

export function ConciliarRemessaDialog({
  open,
  onOpenChange,
  candidatos,
  novaFonte,
  onConciliar,
  onCriarNovo,
  salvando,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidatos: MatchCandidate[];
  novaFonte: Record<string, string>;
  onConciliar: (candidato: MatchCandidate, payloadMesclado: Record<string, string>) => void;
  onCriarNovo: () => void;
  salvando?: boolean;
}) {
  const [selecionadoId, setSelecionadoId] = useState<string | null>(candidatos[0]?.id ?? null);
  const [escolhas, setEscolhas] = useState<Record<string, EscolhaDiff> | null>(null);

  const selecionado = candidatos.find((c) => c.id === selecionadoId) ?? candidatos[0];
  const linhas = useMemo(
    () => (selecionado ? calcularDiff(selecionado.payload, novaFonte) : []),
    [selecionado, novaFonte],
  );
  const escolhasAtuais = escolhas ?? escolhasPadrao(linhas);
  // Score alto = identificador natural bateu; aí conciliar é o caminho provável.
  const forte = (selecionado?.score ?? 0) >= SCORE_FORTE;

  if (!selecionado) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Achei uma carga parecida — é a mesma?</DialogTitle>
          <DialogDescription>
            {forte
              ? "Os identificadores batem (romaneio ou pesagem). Conciliar junta as duas fontes na mesma carga."
              : "A semelhança é parcial. Confira antes de juntar — pode ser outra viagem do mesmo caminhão."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {candidatos.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                {candidatos.length} cargas parecidas — escolha qual é:
              </p>
              {candidatos.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelecionadoId(c.id);
                    setEscolhas(null);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                    c.id === selecionado.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <span className="truncate">{resumoCandidato(c.payload)}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    afinidade {c.score}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm font-medium">{resumoCandidato(selecionado.payload)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Por quê: {selecionado.motivos.join(" · ")}
            </p>
          </div>

          <DiffPanel
            linhas={linhas}
            escolhas={escolhasAtuais}
            onEscolher={(key, escolha) => setEscolhas({ ...escolhasAtuais, [key]: escolha })}
            tituloAtual="Já registrado"
            tituloNovo="Nesta fonte"
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <button
            type="button"
            onClick={onCriarNovo}
            disabled={salvando}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
          >
            <Split className="h-4 w-4" />É outra carga — criar novo
          </button>
          <button
            type="button"
            onClick={() =>
              onConciliar(selecionado, aplicarEscolhas(selecionado.payload, linhas, escolhasAtuais))
            }
            disabled={salvando}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            <Link2 className="h-4 w-4" />
            {salvando ? "Conciliando..." : "Conciliar com esta carga"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
