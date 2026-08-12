import { localToday } from "@/lib/date-local";
import { useMutacaoReal } from "@/hooks/use-mutacao-real";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Droplets, Trash2 } from "lucide-react";
import { RichTabKpis, RichTabPanel, RichBarList } from "@/components/rich-tab";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportRowsToXlsx } from "@/lib/export-xlsx";
import { useAnimais, useLotes, useProducao } from "@/features/pecuaria/hooks/use-pecuaria";
import { createProducao, deleteProducao } from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";

// Produção diária (leite, ovos, mel). Portado da pecuária legada, agora em
// pec_producao: o lançamento é por LOTE ou por ANIMAL, não por texto livre.

const hoje = () => localToday();

export function ProducaoPanel() {
  const qc = useQueryClient();
  const producaoQ = useProducao();
  const lotesQ = useLotes();
  const animaisQ = useAnimais();

  const [produto, setProduto] = useState("Leite");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("L");
  const [data, setData] = useState(hoje());
  const [escopo, setEscopo] = useState<"lote" | "animal">("lote");
  const [alvoId, setAlvoId] = useState("");
  const [observacao, setObservacao] = useState("");

  const registros = producaoQ.data ?? [];

  const nomeAlvo = (r: { lote_id: string | null; animal_id: string | null }) => {
    if (r.lote_id) return lotesQ.data?.find((l) => l.id === r.lote_id)?.nome ?? "Lote";
    if (r.animal_id)
      return animaisQ.data?.find((a) => a.id === r.animal_id)?.brinco_visual ?? "Animal";
    return "Fazenda";
  };

  const porProduto = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const r of registros) mapa.set(r.produto, (mapa.get(r.produto) ?? 0) + r.quantidade);
    return [...mapa.entries()].map(([label, value]) => ({ label, value }));
  }, [registros]);

  const totalMes = useMemo(() => {
    const mes = hoje().slice(0, 7);
    return registros.filter((r) => r.data.startsWith(mes)).reduce((s, r) => s + r.quantidade, 0);
  }, [registros]);

  const criar = useMutacaoReal({
    mutationFn: () =>
      createProducao({
        produto: produto.trim(),
        quantidade: Number(quantidade.replace(",", ".")) || 0,
        unidade: unidade.trim() || null,
        data,
        observacao: observacao.trim() || null,
        lote_id: escopo === "lote" && alvoId ? alvoId : null,
        animal_id: escopo === "animal" && alvoId ? alvoId : null,
      }),
    onSuccess: () => {
      toast.success("Produção registrada.");
      setQuantidade("");
      setObservacao("");
      void qc.invalidateQueries({ queryKey: pecKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutacaoReal({
    mutationFn: (id: string) => deleteProducao(id),
    onSuccess: () => {
      toast.success("Registro removido.");
      void qc.invalidateQueries({ queryKey: pecKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportar = () =>
    exportRowsToXlsx(
      "producao-pecuaria.xlsx",
      ["Data", "Produto", "Quantidade", "Unidade", "Origem", "Observação"],
      registros.map((r) => [
        r.data,
        r.produto,
        r.quantidade,
        r.unidade ?? "",
        nomeAlvo(r),
        r.observacao ?? "",
      ]),
    );

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "Lançamentos", value: registros.length, icon: Droplets },
          { label: "Produzido no mês", value: totalMes.toLocaleString("pt-BR") },
          { label: "Produtos distintos", value: porProduto.length },
        ]}
      />

      <RichTabPanel
        title="Registrar produção"
        description="Por lote (galinheiro) ou por animal (vaca leiteira)"
      >
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Campo label="Produto">
            <Input
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              placeholder="Leite"
            />
          </Campo>
          <Campo label="Quantidade">
            <Input
              inputMode="decimal"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="180"
            />
          </Campo>
          <Campo label="Unidade">
            <Input value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="L" />
          </Campo>
          <Campo label="Data">
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
          <Campo label="Escopo">
            <select
              value={escopo}
              onChange={(e) => {
                setEscopo(e.target.value as "lote" | "animal");
                setAlvoId("");
              }}
              className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
            >
              <option value="lote">Lote</option>
              <option value="animal">Animal</option>
            </select>
          </Campo>
          <Campo label={escopo === "lote" ? "Lote" : "Animal"}>
            <select
              value={alvoId}
              onChange={(e) => setAlvoId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
            >
              <option value="">Fazenda (sem vínculo)</option>
              {escopo === "lote"
                ? (lotesQ.data ?? []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))
                : (animaisQ.data ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.brinco_visual ?? a.id.slice(0, 8)}
                    </option>
                  ))}
            </select>
          </Campo>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Campo label="Observação">
              <Input
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="ordenha da manhã"
              />
            </Campo>
          </div>
          <Button
            disabled={!produto.trim() || !quantidade || criar.isPending}
            onClick={() => criar.mutate()}
          >
            {criar.isPending ? "Registrando…" : "Registrar"}
          </Button>
        </div>
      </RichTabPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel title="Total por produto" description="Soma de todo o período">
          {porProduto.length ? (
            <RichBarList items={porProduto} />
          ) : (
            <EmptyState title="Sem produção registrada" icon={Droplets} />
          )}
        </RichTabPanel>

        <RichTabPanel
          title="Lançamentos"
          description={`${registros.length} registros`}
          action={
            registros.length ? (
              <Button variant="outline" size="sm" onClick={exportar}>
                Exportar XLSX
              </Button>
            ) : undefined
          }
        >
          {registros.length ? (
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 text-left font-medium">Data</th>
                    <th className="py-2 text-left font-medium">Produto</th>
                    <th className="py-2 text-right font-medium">Qtd.</th>
                    <th className="py-2 text-left font-medium">Origem</th>
                    <th className="w-8 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-1.5 tabular-nums text-muted-foreground">{r.data}</td>
                      <td className="py-1.5 font-medium">{r.produto}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {r.quantidade.toLocaleString("pt-BR")} {r.unidade ?? ""}
                      </td>
                      <td className="py-1.5 text-muted-foreground">{nomeAlvo(r)}</td>
                      <td className="py-1.5 text-right">
                        <button
                          onClick={() => remover.mutate(r.id)}
                          disabled={remover.isPending}
                          aria-label="Remover"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Nenhum lançamento" icon={Droplets} />
          )}
        </RichTabPanel>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
