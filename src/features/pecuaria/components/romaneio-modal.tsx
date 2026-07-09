import { useMemo, useState } from "react";
import { FileDown, Lock } from "lucide-react";
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
import { EmptyState } from "@/components/empty-state";
import { makeReportPdf, downloadPdf } from "@/lib/pdf-utils";
import { Tag } from "@/features/pecuaria/components/tag";
import { arrobasCarcaca } from "@/features/pecuaria/lib/custos";
import { ultimoPeso } from "@/features/pecuaria/lib/derived";
import type { PecAnimal, PecLote, PecPesagem } from "@/features/pecuaria/types/domain";

// Romaneio de venda. Animais em carência são EXCLUÍDOS automaticamente — o
// bloqueio é derivado de v_animal_carencia, nunca de um campo gravado. Eles
// aparecem na lista como bloqueados, sem checkbox, para o gestor entender o porquê.

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export function RomaneioModal({
  open,
  onOpenChange,
  lote,
  animais,
  pesagensMap,
  carenciaMap,
  rendimentoCarcacaPct,
  precoArroba,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lote: PecLote;
  animais: PecAnimal[];
  pesagensMap: Map<string, PecPesagem[]>;
  carenciaMap: Map<string, string>;
  rendimentoCarcacaPct: number;
  precoArroba: number;
}) {
  const linhas = useMemo(
    () =>
      animais
        .filter((a) => a.lote_id === lote.id && a.status !== "vendido" && a.status !== "morto")
        .map((animal) => {
          const pesoVivo = ultimoPeso(pesagensMap.get(animal.id) ?? []);
          const liberaEm = carenciaMap.get(animal.id) ?? null;
          const arrobas = pesoVivo ? arrobasCarcaca(pesoVivo, rendimentoCarcacaPct) : 0;
          return {
            animal,
            pesoVivo,
            liberaEm,
            bloqueado: Boolean(liberaEm) || pesoVivo === null,
            arrobas,
            valor: arrobas * precoArroba,
          };
        }),
    [animais, lote.id, pesagensMap, carenciaMap, rendimentoCarcacaPct, precoArroba],
  );

  const elegiveis = linhas.filter((l) => !l.bloqueado);
  const bloqueados = linhas.filter((l) => l.bloqueado);

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const marcados = elegiveis.filter((l) => selecionados.has(l.animal.id));
  const totalArrobas = marcados.reduce((s, l) => s + l.arrobas, 0);
  const totalValor = marcados.reduce((s, l) => s + l.valor, 0);

  const toggle = (id: string) =>
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exportar = () => {
    if (!marcados.length) return;
    const doc = makeReportPdf({
      title: "Romaneio de venda",
      subtitle: `${lote.nome} · ${marcados.length} animais · emitido em ${new Date().toLocaleDateString("pt-BR")}`,
      metrics: [
        { label: "Animais", value: String(marcados.length) },
        { label: "Arrobas de carcaça", value: totalArrobas.toFixed(2) },
        { label: "Preço da @", value: brl(precoArroba) },
        { label: "Valor total", value: brl(totalValor) },
      ],
      sections: [
        {
          title: "Animais",
          head: ["Brinco", "SISBOV", "Peso vivo (kg)", "Rend. (%)", "@ carcaça", "Valor"],
          body: marcados.map((l) => [
            l.animal.brinco_visual ?? "—",
            l.animal.sisbov ?? "—",
            l.pesoVivo?.toLocaleString("pt-BR") ?? "—",
            (rendimentoCarcacaPct * 100).toFixed(0),
            l.arrobas.toFixed(2),
            brl(l.valor),
          ]),
        },
        ...(bloqueados.length
          ? [
              {
                title: "Excluídos automaticamente (não entram na venda)",
                head: ["Brinco", "Motivo"],
                body: bloqueados.map((l) => [
                  l.animal.brinco_visual ?? "—",
                  l.liberaEm ? `Em carência até ${l.liberaEm}` : "Sem pesagem registrada",
                ]),
              },
            ]
          : []),
      ],
    });
    downloadPdf(doc, `romaneio-${lote.nome.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    toast.success(`Romaneio com ${marcados.length} animais exportado.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Romaneio de venda — {lote.nome}</DialogTitle>
          <DialogDescription>
            Animais em carência são excluídos automaticamente e não podem ser selecionados.
          </DialogDescription>
        </DialogHeader>

        {!linhas.length ? (
          <EmptyState title="Lote sem animais disponíveis" />
        ) : (
          <div className="space-y-4">
            {elegiveis.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="w-8 py-2" />
                      <th className="py-2 text-left font-medium">Brinco</th>
                      <th className="py-2 text-right font-medium">Peso vivo</th>
                      <th className="py-2 text-right font-medium">@ carcaça</th>
                      <th className="py-2 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elegiveis.map((l) => (
                      <tr key={l.animal.id} className="border-b border-border/50">
                        <td className="py-1.5">
                          <input
                            type="checkbox"
                            checked={selecionados.has(l.animal.id)}
                            onChange={() => toggle(l.animal.id)}
                            aria-label={`Selecionar ${l.animal.brinco_visual}`}
                          />
                        </td>
                        <td className="py-1.5 font-medium">{l.animal.brinco_visual ?? "—"}</td>
                        <td className="py-1.5 text-right tabular-nums">{l.pesoVivo} kg</td>
                        <td className="py-1.5 text-right tabular-nums">{l.arrobas.toFixed(2)}</td>
                        <td className="py-1.5 text-right tabular-nums">{brl(l.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {bloqueados.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <Lock className="h-3.5 w-3.5" />
                  {bloqueados.length} bloqueado{bloqueados.length > 1 ? "s" : ""} para venda
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {bloqueados.map((l) => (
                    <li key={l.animal.id} className="flex items-center gap-2">
                      <span className="font-medium">{l.animal.brinco_visual ?? "—"}</span>
                      {l.liberaEm ? (
                        <Tag tone="danger">Carência até {l.liberaEm}</Tag>
                      ) : (
                        <Tag tone="neutral">Sem pesagem</Tag>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3 text-sm">
              <span className="text-muted-foreground">
                {marcados.length} selecionado{marcados.length === 1 ? "" : "s"}
              </span>
              <span className="tabular-nums">
                {totalArrobas.toFixed(2)} @ · <strong>{brl(totalValor)}</strong>
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={exportar} disabled={!marcados.length}>
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
