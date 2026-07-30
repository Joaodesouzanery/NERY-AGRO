import { AlertTriangle, CheckCircle2, Circle, Scale, Sprout, Warehouse } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RemessaPhotoGallery } from "@/features/remessa/components/remessa-photo-gallery";
import { RemessaFormDialog } from "@/features/remessa/components/remessa-form-dialog";
import { lerFontes, ORIGEM_LABEL } from "@/features/remessa/lib/fontes";
import { caixasDivergencia, etapaDe, quebraDe, type RemessaEtapa } from "@/lib/remessa-metrics";
import { REMESSA_TOLERANCIAS_PADRAO, type RemessaTolerancias } from "@/lib/app-settings";
import { resumoCandidato } from "@/lib/remessa-match";
import { cn } from "@/lib/utils";

// Ficha da carga: onde ela está no ciclo, se a conferência fechou, a foto do
// romaneio DELA (não o mural) e por quais fontes ela entrou no sistema.

const TRILHA: Array<{
  etapa: RemessaEtapa;
  titulo: string;
  icon: React.ComponentType<{ className?: string }>;
  quando: string;
  quem: string;
}> = [
  {
    etapa: "lavoura",
    titulo: "Saiu da lavoura",
    icon: Sprout,
    quando: "etapa_lavoura_em",
    quem: "resp_lavoura",
  },
  {
    etapa: "balanca",
    titulo: "Pesada na balança",
    icon: Scale,
    quando: "etapa_balanca_em",
    quem: "resp_balanca",
  },
  {
    etapa: "beneficiamento",
    titulo: "Conferida no beneficiamento",
    icon: Warehouse,
    quando: "etapa_beneficiamento_em",
    quem: "resp_beneficiamento",
  },
];

const ORDEM: RemessaEtapa[] = ["lavoura", "balanca", "beneficiamento", "conferida"];

function dataHora(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("pt-BR");
}

export function RemessaDetailDialog({
  registro,
  open,
  onOpenChange,
  tolerancias = REMESSA_TOLERANCIAS_PADRAO,
  onSaved,
}: {
  registro: { id: string; payload: Record<string, string> } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tolerancias?: RemessaTolerancias;
  onSaved?: () => void;
}) {
  if (!registro) return null;
  const { payload } = registro;
  const etapa = etapaDe(payload);
  const indiceAtual = ORDEM.indexOf(etapa);
  const quebra = quebraDe(payload, tolerancias);
  const caixas = caixasDivergencia(payload, tolerancias);
  const fontes = lerFontes(payload);
  const problema =
    (quebra && quebra.nivel !== "ok") || (caixas && caixas.nivel !== "ok") ? true : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resumoCandidato(payload)}</DialogTitle>
          <DialogDescription>
            {payload.local_descarga
              ? `Destino: ${payload.local_descarga}`
              : "Ciclo da carga, conferência e provas anexadas."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <h4 className="mb-2 text-sm font-semibold">Ciclo da carga</h4>
            <ol className="space-y-2">
              {TRILHA.map((passo, i) => {
                const cumprida = i <= indiceAtual;
                const Icone = passo.icon;
                const quando = dataHora(payload[passo.quando]);
                const quem = payload[passo.quem];
                return (
                  <li key={passo.etapa} className="flex items-start gap-2">
                    {cumprida ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "flex items-center gap-1.5 text-sm",
                          cumprida ? "font-medium" : "text-muted-foreground",
                        )}
                      >
                        <Icone className="h-3.5 w-3.5" />
                        {passo.titulo}
                      </p>
                      {(quando || quem) && (
                        <p className="text-xs text-muted-foreground">
                          {[quem, quando].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold">Conferência</h4>
            {quebra || caixas ? (
              <div
                className={cn(
                  "space-y-1 rounded-lg border p-3 text-sm",
                  problema
                    ? "border-warning/40 bg-warning/10 text-warning"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
                )}
              >
                {problema && (
                  <p className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="h-4 w-4" />A conferência não fecha
                  </p>
                )}
                {quebra && (
                  <p>
                    Peso: saiu {Number(payload.peso_liquido).toLocaleString("pt-BR")} kg, conferido{" "}
                    {(
                      Number(payload.peso_liquido_destino) || Number(payload.peso_liquido_final)
                    ).toLocaleString("pt-BR")}{" "}
                    kg — quebra de {quebra.kg.toLocaleString("pt-BR")} kg ({quebra.pct}%).
                  </p>
                )}
                {caixas && (
                  <p>
                    Caixas: saíram {payload.qtd_caixas}, recebidas {payload.caixas_recebidas} —{" "}
                    {Math.abs(caixas.delta)} de diferença.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {etapa === "conferida"
                  ? "Peso e caixas bateram entre a saída e o beneficiamento."
                  : "Ainda não há a segunda pesagem — a carga não foi conferida no destino."}
              </p>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">Provas anexadas</h4>
              <RemessaFormDialog
                registro={registro}
                onSaved={onSaved}
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium transition hover:bg-muted"
                  >
                    Continuar preenchimento
                  </button>
                }
              />
            </div>
            <RemessaPhotoGallery refId={registro.id} limit={8} />
          </section>

          {fontes.length > 0 && (
            <section>
              <h4 className="mb-2 text-sm font-semibold">Como esta carga entrou no sistema</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {fontes.map((f, i) => (
                  <li key={`${f.origem}-${f.em}-${i}`}>
                    {ORIGEM_LABEL[f.origem] ?? f.origem} · {dataHora(f.em)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
