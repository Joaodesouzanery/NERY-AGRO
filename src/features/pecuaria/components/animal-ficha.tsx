import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileDown, Save, Scale, Syringe } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { chartColors } from "@/lib/chart-theme";
import { useAuth } from "@/hooks/use-auth";
import {
  downloadAnimalPdf,
  downloadStoredAnimalPdf,
  listAnimalPdfRecords,
  saveAnimalPdfVersion,
} from "@/lib/animal-pdfs";
import { RdcByAnimalPanel } from "@/features/rdc/components/rdc-reverse-list";
import { Tag } from "@/features/pecuaria/components/tag";
import { fichaAnimalPdf } from "@/features/pecuaria/lib/ficha-pdf";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import { emCarencia, idadeMeses, ordenarPesagens } from "@/features/pecuaria/lib/derived";
import {
  ORIGEM_LABEL,
  STATUS_LABEL,
  type GmdAnimal,
  type PecAnimal,
  type PecEventoSanitario,
  type PecPesagem,
  type StatusAnimal,
  type Origem,
} from "@/features/pecuaria/types/domain";

type TimelineItem = { data: string; tipo: "pesagem" | "sanitario"; texto: string };

export function AnimalFicha({
  open,
  onOpenChange,
  animal,
  loteNome,
  gmd,
  liberaEm,
  pesagens,
  sanitarios,
  mediaLote,
  brincoById,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: PecAnimal | null;
  loteNome: string | null;
  gmd: GmdAnimal | null;
  liberaEm: string | null;
  pesagens: PecPesagem[];
  sanitarios: PecEventoSanitario[];
  mediaLote: number | null;
  brincoById: Map<string, string>;
}) {
  const chartData = useMemo(
    () => ordenarPesagens(pesagens).map((p) => ({ data: p.data.slice(5), peso: p.peso_kg })),
    [pesagens],
  );

  const sanitariosAnimal = useMemo(
    () =>
      animal
        ? sanitarios.filter(
            (s) => s.animal_id === animal.id || (s.lote_id && s.lote_id === animal.lote_id),
          )
        : [],
    [sanitarios, animal],
  );

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...pesagens.map((p) => ({
        data: p.data,
        tipo: "pesagem" as const,
        texto: `Pesagem: ${p.peso_kg.toLocaleString("pt-BR")} kg`,
      })),
      ...sanitariosAnimal.map((s) => ({
        data: s.data,
        tipo: "sanitario" as const,
        texto: `Sanitário: ${[s.tipo, s.produto].filter(Boolean).join(" — ") || "evento"}`,
      })),
    ];
    return items.sort((a, b) => b.data.localeCompare(a.data));
  }, [pesagens, sanitariosAnimal]);

  const { orgId } = useAuth();
  const qc = useQueryClient();

  // Biblioteca de PDFs versionados deste animal (bucket privado por empresa).
  const pdfsQ = useQuery({
    queryKey: pecKeys.pdfs(animal?.id ?? "sem-animal"),
    queryFn: () => listAnimalPdfRecords(animal?.id),
    enabled: open && Boolean(animal),
    staleTime: 30_000,
  });

  const ficha = useMemo(
    () =>
      animal
        ? fichaAnimalPdf({ animal, loteNome, pesagens, sanitarios: sanitariosAnimal, brincoById })
        : null,
    [animal, loteNome, pesagens, sanitariosAnimal, brincoById],
  );

  const salvarVersao = useMutation({
    mutationFn: async () => {
      if (!ficha) throw new Error("Ficha indisponível.");
      if (!orgId) throw new Error("Sua conta ainda não está vinculada a uma empresa.");
      return saveAnimalPdfVersion(ficha, orgId);
    },
    onSuccess: (record) => {
      toast.success(`Versão v${record.version} salva na biblioteca.`);
      void qc.invalidateQueries({ queryKey: pecKeys.pdfs(animal?.id ?? "sem-animal") });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!animal) return null;

  const carencia = emCarencia(liberaEm);
  const idade = idadeMeses(animal.nascimento);

  const qrValue = JSON.stringify({
    tipo: "animal",
    id: animal.id,
    brinco: animal.brinco_visual,
    sisbov: animal.sisbov,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Brinco {animal.brinco_visual ?? "—"}
            {carencia ? (
              <Tag tone="danger">Em carência</Tag>
            ) : (
              <Tag tone="neutral">
                {STATUS_LABEL[animal.status as StatusAnimal] ?? animal.status}
              </Tag>
            )}
          </DialogTitle>
          <DialogDescription>
            {[animal.categoria, animal.raca, loteNome].filter(Boolean).join(" · ") ||
              "Sem detalhes"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Info label="SISBOV" value={animal.sisbov} />
          <Info
            label="Sexo"
            value={animal.sexo === "macho" ? "Macho" : animal.sexo === "femea" ? "Fêmea" : null}
          />
          <Info label="Idade" value={idade !== null ? `${idade} meses` : null} />
          <Info
            label="GMD atual"
            value={
              gmd?.gmd_atual != null
                ? `${gmd.gmd_atual.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg/dia`
                : null
            }
          />
          <Info
            label="Origem"
            value={animal.origem ? ORIGEM_LABEL[animal.origem as Origem] : null}
          />
          <Info label="Pai" value={animal.pai_id ? (brincoById.get(animal.pai_id) ?? "—") : null} />
          <Info label="Mãe" value={animal.mae_id ? (brincoById.get(animal.mae_id) ?? "—") : null} />
          <Info label="Origem (estab.)" value={animal.origem_estabelecimento} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-2 text-sm font-semibold">Curva de peso</h4>
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
                <XAxis dataKey="data" fontSize={11} stroke={chartColors.mutedFg} />
                <YAxis fontSize={11} stroke={chartColors.mutedFg} />
                <Tooltip />
                {mediaLote != null && (
                  <ReferenceLine
                    y={mediaLote}
                    stroke={chartColors.c3}
                    strokeDasharray="4 4"
                    label={{ value: "média do lote", fontSize: 10, fill: chartColors.mutedFg }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="Sem histórico de peso"
              description="Registre ao menos 2 pesagens para ver a curva."
              icon={Scale}
            />
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-2 text-sm font-semibold">Linha do tempo</h4>
          {timeline.length ? (
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {timeline.map((t, i) => (
                <li key={`${t.data}-${i}`} className="flex items-start gap-2">
                  {t.tipo === "pesagem" ? (
                    <Scale className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Syringe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="tabular-nums text-muted-foreground">{t.data}</span>
                  <span>{t.texto}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sem eventos registrados" icon={Scale} />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold">QR do brinco</h4>
            <div className="rounded-md bg-white p-2">
              <QRCodeCanvas value={qrValue} size={96} level="M" />
            </div>
            <p className="max-w-[140px] text-center text-[11px] text-muted-foreground">
              Aponte a câmera para abrir este animal no campo.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">Fichas em PDF</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => ficha && downloadAnimalPdf(ficha)}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Gerar
                </Button>
                <Button
                  size="sm"
                  disabled={salvarVersao.isPending || !orgId}
                  onClick={() => salvarVersao.mutate()}
                  title={orgId ? undefined : "Conta sem empresa vinculada"}
                >
                  <Save className="h-3.5 w-3.5" />
                  {salvarVersao.isPending ? "Salvando…" : "Salvar versão"}
                </Button>
              </div>
            </div>
            {pdfsQ.data?.length ? (
              <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                {pdfsQ.data.map((pdf) => (
                  <li
                    key={pdf.id}
                    className="flex items-center justify-between border-b border-border/50 py-1"
                  >
                    <span className="flex items-center gap-2">
                      <Tag tone="primary">v{pdf.version}</Tag>
                      <span className="text-xs text-muted-foreground">
                        {new Date(pdf.created_at).toLocaleString("pt-BR")}
                      </span>
                    </span>
                    <button
                      onClick={() => void downloadStoredAnimalPdf(pdf)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhuma versão salva. "Gerar" baixa sem versionar; "Salvar versão" guarda no
                histórico da empresa.
              </p>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold">Diário de Campo (RDC)</h4>
          <RdcByAnimalPanel animalId={animal.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}
