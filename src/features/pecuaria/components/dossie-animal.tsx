import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Copy, FileDown, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { makeReportPdf, downloadPdf } from "@/lib/pdf-utils";
import { Tag } from "@/features/pecuaria/components/tag";
import { listDossie } from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import { DESMATE_VERIFICAVEL, textoSolicitacaoCar } from "@/features/pecuaria/lib/conformidade";
import type { PecAnimal } from "@/features/pecuaria/types/domain";
import { useDemoMode } from "@/hooks/use-demo-mode";

// Dossiê EUDR: cadeia de estabelecimentos por onde o animal passou. O primeiro
// elo é a origem externa (quando comprado); os demais vêm das ocupações de
// talhão do lote. Elo sem CAR é pendência — nunca some da tela.

export function DossieAnimal({ animal, onClose }: { animal: PecAnimal; onClose: () => void }) {
  const { demoMode } = useDemoMode();
  const dossieQ = useQuery({
    queryKey: pecKeys.dossie(demoMode, animal.id),
    queryFn: () => listDossie(demoMode, animal.id),
    staleTime: 30_000,
  });

  const elos = dossieQ.data ?? [];
  const semCar = elos.filter((e) => !e.car?.trim());
  const origemNaoDeclarada = !animal.origem?.trim();
  const elegivelUe = !origemNaoDeclarada && semCar.length === 0;

  const [copiado, setCopiado] = useState(false);

  const solicitarCar = async () => {
    const texto = textoSolicitacaoCar(
      animal.brinco_visual ?? animal.id.slice(0, 8),
      elos.find((e) => e.tipo_elo === "origem")?.estabelecimento ?? animal.origem_estabelecimento,
    );
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success("Texto copiado. Cole no e-mail para o fornecedor.");
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  };

  const exportar = () => {
    const doc = makeReportPdf({
      title: `Dossiê EUDR — ${animal.brinco_visual ?? "animal"}`,
      subtitle: `Emitido em ${new Date().toLocaleDateString("pt-BR")} · ${elos.length} elo(s) na cadeia`,
      metrics: [
        { label: "Brinco", value: animal.brinco_visual ?? "—" },
        { label: "SISBOV", value: animal.sisbov ?? "—" },
        { label: "Origem", value: animal.origem ?? "não declarada" },
        { label: "Elegível UE", value: elegivelUe ? "Sim" : "Não" },
      ],
      sections: [
        {
          title: "Cadeia de estabelecimentos",
          head: ["#", "Tipo", "Estabelecimento", "CAR", "Entrada", "Saída"],
          body: elos.length
            ? elos.map((e, i) => [
                i + 1,
                e.tipo_elo ?? "—",
                e.estabelecimento ?? "—",
                e.car ?? "SEM CAR",
                e.data_entrada ?? "—",
                e.data_saida ?? "atual",
              ])
            : [["—", "—", "Sem elo registrado", "—", "—", "—"]],
        },
        {
          title: "Ressalvas",
          head: ["Item", "Situação"],
          body: [
            [
              "Desmatamento pós-2020",
              DESMATE_VERIFICAVEL ? "Verificado" : "NÃO VERIFICADO — sem fonte de dado no sistema",
            ],
            ["Origem declarada", origemNaoDeclarada ? "PENDENTE" : "Sim"],
            ["Elos sem CAR", semCar.length ? String(semCar.length) : "Nenhum"],
          ],
        },
      ],
    });
    downloadPdf(doc, `dossie-eudr-${(animal.brinco_visual ?? animal.id).replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dossiê EUDR — {animal.brinco_visual ?? "animal"}</DialogTitle>
          <DialogDescription>
            Cadeia de estabelecimentos com CAR por elo. Um elo sem CAR derruba o animal do mercado
            europeu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {elegivelUe ? (
              <Tag tone="success">Cadeia rastreável</Tag>
            ) : (
              <Tag tone="danger">Não elegível à UE</Tag>
            )}
            {origemNaoDeclarada && <Tag tone="warning">Origem não declarada</Tag>}
            {semCar.length > 0 && <Tag tone="warning">{semCar.length} elo(s) sem CAR</Tag>}
          </div>

          {!DESMATE_VERIFICAVEL && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Mesmo com a cadeia completa, o sistema não verifica desmatamento pós-2020 — não há
              fonte de dado integrada. O dossiê comprova rastreabilidade, não ausência de desmate.
            </p>
          )}

          {dossieQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando cadeia…</p>
          ) : elos.length ? (
            <ol className="space-y-2">
              {elos.map((elo, i) => (
                <li key={`${elo.talhao_id ?? "origem"}-${i}`}>
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{elo.estabelecimento ?? "Sem nome"}</span>
                        <Tag tone={elo.tipo_elo === "origem" ? "neutral" : "primary"}>
                          {elo.tipo_elo === "origem" ? "Origem externa" : "Talhão"}
                        </Tag>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {elo.car?.trim() ? (
                            `CAR ${elo.car}`
                          ) : (
                            <span className="font-medium text-destructive">sem CAR</span>
                          )}
                        </span>
                        {elo.data_entrada && (
                          <span>
                            {elo.data_entrada} → {elo.data_saida ?? "atual"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {i < elos.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <ArrowRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground" />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title="Cadeia vazia"
              description={
                origemNaoDeclarada
                  ? "Este animal não tem origem declarada nem ocupação de talhão registrada."
                  : "Nascido na fazenda, sem ocupação de talhão registrada ainda."
              }
              icon={MapPin}
            />
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {(semCar.length > 0 || origemNaoDeclarada) && (
            <Button variant="outline" onClick={solicitarCar}>
              <Copy className="h-4 w-4" />
              {copiado ? "Copiado" : "Solicitar CAR ao fornecedor"}
            </Button>
          )}
          <Button onClick={exportar}>
            <FileDown className="h-4 w-4" />
            Exportar dossiê
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
