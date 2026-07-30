import { useMemo, useState } from "react";
import { ArrowRightLeft, FileDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { BarList } from "@/components/bar-list";
import { KpiCard } from "@/components/kpi-card";
import { RichTabPanel } from "@/components/rich-tab";
import { cn } from "@/lib/utils";
import { parseCycles } from "@/features/talhao-360/api/services";
import { Tag } from "@/features/pecuaria/components/tag";
import { RomaneioModal } from "@/features/pecuaria/components/romaneio-modal";
import { TransferenciaModal } from "@/features/pecuaria/components/transferencia-modal";
import {
  useAnimais,
  useCarencia,
  useConfig,
  useLotes,
  useOcupacoes,
  usePesagens,
  useTalhoes,
  carenciaByAnimal,
  groupPesagensByAnimal,
} from "@/features/pecuaria/hooks/use-pecuaria";
import {
  centrosDeCustoCompartilhados,
  useCostCenters,
} from "@/features/pecuaria/hooks/use-financeiro-pecuaria";
import { useRentabilidadeLotes } from "@/features/pecuaria/hooks/use-rentabilidade";
import { CATEGORIA_LABEL, type CategoriaCusto } from "@/features/pecuaria/lib/custos";
import { areaHaDoTalhao } from "@/features/pecuaria/lib/pastos";
import type { PecLote } from "@/features/pecuaria/types/domain";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function ResultadosTab() {
  const { data: rentabilidade, isLoading } = useRentabilidadeLotes();
  const lotesQ = useLotes();
  const animaisQ = useAnimais();
  const pesagensQ = usePesagens();
  const carenciaQ = useCarencia();
  const configQ = useConfig();
  const ccQ = useCostCenters();
  const talhoesQ = useTalhoes();
  const ocupacoesQ = useOcupacoes();

  const [romaneioLote, setRomaneioLote] = useState<PecLote | null>(null);
  const [desmameOpen, setDesmameOpen] = useState(false);

  const linhas = useMemo(() => [...rentabilidade.values()], [rentabilidade]);
  const ccCompartilhados = useMemo(
    () => centrosDeCustoCompartilhados(lotesQ.data ?? []),
    [lotesQ.data],
  );
  const pesagensMap = useMemo(() => groupPesagensByAnimal(pesagensQ.data ?? []), [pesagensQ.data]);
  const carenciaMap = useMemo(() => carenciaByAnimal(carenciaQ.data ?? []), [carenciaQ.data]);

  const totalArrobas = linhas.reduce((s, l) => s + l.arrobas, 0);
  const totalCusto = linhas.reduce((s, l) => s + l.custoTotal, 0);
  const totalResultado = linhas.reduce((s, l) => s + (l.resultado ?? 0), 0);
  const custoMedioArroba = totalArrobas > 0 ? totalCusto / totalArrobas : null;

  // Resultado por talhão: pecuária (lotes que ocuparam) + lavoura (ciclos do Campo).
  //
  // ATENÇÃO: o resultado do lote é atribuído INTEGRALMENTE a cada talhão que ele
  // ocupou. Um lote que passou por 3 talhões aparece 3× — o total por talhão não
  // soma o resultado geral. Ratear exigiria decidir o critério (dias de ocupação?
  // arrobas ganhas em cada talhão?), o que é regra de negócio. A UI avisa abaixo.
  const porTalhao = useMemo(() => {
    const talhoes = talhoesQ.data ?? [];
    const ocupacoes = ocupacoesQ.data ?? [];
    return talhoes
      .map((talhao) => {
        const area = areaHaDoTalhao(talhao);
        const lotesNoTalhao = new Set(
          ocupacoes.filter((o) => o.talhao_id === talhao.id).map((o) => o.lote_id),
        );
        const pecuaria = [...lotesNoTalhao].reduce(
          (s, loteId) => s + (rentabilidade.get(loteId)?.resultado ?? 0),
          0,
        );
        const lavoura = parseCycles(talhao.payload)
          .filter((c) => c.tipo !== "Pastagem")
          .reduce((s, c) => s + (c.margemEstimadaHa ?? 0) * (c.areaHa || area || 0), 0);
        const total = pecuaria + lavoura;
        return { talhao, area, pecuaria, lavoura, total, porHa: area ? total / area : null };
      })
      .filter((r) => r.pecuaria !== 0 || r.lavoura !== 0);
  }, [talhoesQ.data, ocupacoesQ.data, rentabilidade]);

  if (isLoading) return <RichTabPanel title="Resultados">Carregando…</RichTabPanel>;

  if (!linhas.length) {
    return (
      <RichTabPanel title="Resultados" description="Rentabilidade, custo/@ e romaneio">
        <EmptyState
          title="Nenhum lote para analisar"
          description="Crie lotes e registre pesagens para ver custo/@ e margem."
          icon={TrendingUp}
        />
      </RichTabPanel>
    );
  }

  const maxAbs = Math.max(1, ...linhas.map((l) => Math.abs(l.resultado ?? 0)));

  const rentabilidadeBars = [...linhas]
    .filter((l) => l.resultado !== null)
    .sort((a, b) => (b.resultado ?? 0) - (a.resultado ?? 0))
    .map((l) => {
      const resultado = l.resultado ?? 0;
      return {
        label: l.lote.nome,
        pct: (Math.abs(resultado) / maxAbs) * 100,
        tone: resultado >= 0 ? ("success" as const) : ("destructive" as const),
        colorValue: true,
        value: `${resultado >= 0 ? "+ " : "− "}${brl(Math.abs(resultado))}`,
      };
    });

  const categorias = (Object.keys(CATEGORIA_LABEL) as CategoriaCusto[])
    .map((cat) => ({ cat, valor: linhas.reduce((s, l) => s + l.porCategoria[cat], 0) }))
    .filter((c) => c.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  const maxCategoria = Math.max(1, ...categorias.map((c) => c.valor));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr]">
        <KpiCard
          hero
          label="Resultado do período"
          value={brl(totalResultado)}
          delta={
            <span className="text-muted-foreground font-normal">
              acumulado dos lotes com produção registrada
            </span>
          }
        />
        <KpiCard
          label="Custo médio/@"
          value={custoMedioArroba !== null ? brl(custoMedioArroba) : "—"}
          support={`${brl(totalCusto)} acumulados`}
        />
        <KpiCard label="@ produzidas" value={totalArrobas.toFixed(1)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel
          title="Rentabilidade lote a lote"
          description={`@ a ${brl(configQ.data?.precoArrobaVenda ?? 0)} · rendimento de carcaça ${((configQ.data?.rendimentoCarcacaPct ?? 0) * 100).toFixed(0)}%`}
        >
          {rentabilidadeBars.length ? (
            <BarList items={rentabilidadeBars} />
          ) : (
            <EmptyState title="Nenhum lote com resultado" />
          )}
        </RichTabPanel>
        <RichTabPanel title="Custo por categoria" description="acumulado do período">
          {categorias.length ? (
            <BarList
              labelClassName="text-muted-foreground"
              items={categorias.map((c) => ({
                label: CATEGORIA_LABEL[c.cat],
                pct: (c.valor / maxCategoria) * 100,
                value: brl(c.valor),
              }))}
            />
          ) : (
            <EmptyState
              title="Sem lançamentos"
              description="Vincule um centro de custo ao lote e lance despesas no Financeiro."
            />
          )}
        </RichTabPanel>
      </div>

      <RichTabPanel
        title="Detalhe por lote"
        description="cabeças, custo/@, margem e romaneio"
        action={
          <Button variant="outline" onClick={() => setDesmameOpen(true)}>
            <ArrowRightLeft className="h-4 w-4" />
            Registrar desmame
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium">Lote</th>
                <th className="py-2 text-right font-medium">Cabeças</th>
                <th className="py-2 text-right font-medium">@ produzidas</th>
                <th className="py-2 text-right font-medium">Custo/@</th>
                <th className="py-2 text-right font-medium">Margem/@</th>
                <th className="py-2 text-right font-medium">Resultado</th>
                <th className="w-28 py-2" />
                <th className="w-24 py-2" />
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const positivo = (l.resultado ?? 0) >= 0;
                return (
                  <tr key={l.lote.id} className="border-b border-border/50">
                    <td className="py-2 font-medium">{l.lote.nome}</td>
                    <td className="py-2 text-right tabular-nums">{l.cabecas}</td>
                    <td className="py-2 text-right tabular-nums">{l.arrobas.toFixed(1)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {l.custoArroba !== null ? brl(l.custoArroba) : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {l.margemArroba !== null ? (
                        <span className={l.margemArroba >= 0 ? "text-success" : "text-destructive"}>
                          {brl(l.margemArroba)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums font-medium">
                      {l.resultado !== null ? brl(l.resultado) : "—"}
                    </td>
                    <td className="py-2 pl-3">
                      {l.resultado !== null && (
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              positivo ? "bg-success" : "bg-destructive",
                            )}
                            style={{ width: `${(Math.abs(l.resultado) / maxAbs) * 100}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => setRomaneioLote(l.lote)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        Romaneio
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {linhas.some((l) => l.custoArroba === null) && (
          <p className="mt-3 text-xs text-muted-foreground">
            Lotes sem custo/@ ainda não produziram arroba (precisam de ≥ 2 pesagens) ou não têm
            centro de custo vinculado.
          </p>
        )}

        {ccCompartilhados.length > 0 && (
          <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
            {ccCompartilhados.length} centro(s) de custo são usados por mais de um lote. Cada lote
            recebe o lançamento <strong>inteiro</strong>, então somar os lotes excede o gasto real.
            Separe os centros de custo por lote para o custo/@ ficar fiel.
          </p>
        )}
      </RichTabPanel>

      <RichTabPanel
        title="Resultado por talhão"
        description="Pecuária (lotes que ocuparam) + lavoura (ciclos do Campo) no mesmo polígono"
      >
        {porTalhao.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium">Talhão</th>
                  <th className="py-2 text-right font-medium">Pecuária</th>
                  <th className="py-2 text-right font-medium">Lavoura</th>
                  <th className="py-2 text-right font-medium">Total</th>
                  <th className="py-2 text-right font-medium">Por ha</th>
                </tr>
              </thead>
              <tbody>
                {porTalhao.map((r) => (
                  <tr key={r.talhao.id} className="border-b border-border/50">
                    <td className="py-2 font-medium">{r.talhao.payload.talhao}</td>
                    <td className="py-2 text-right tabular-nums">{brl(r.pecuaria)}</td>
                    <td className="py-2 text-right tabular-nums">{brl(r.lavoura)}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{brl(r.total)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {r.porHa !== null ? brl(r.porHa) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Tag tone="neutral">ILP</Tag>
              Um talhão pode somar receita de grãos e de pecuária no mesmo ano.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Um lote que passou por vários talhões tem seu resultado atribuído inteiro a cada um —
              leia por talhão, não some a coluna.
            </p>
          </div>
        ) : (
          <EmptyState
            title="Sem resultado por talhão"
            description="Movimente um lote para um talhão, ou registre ciclos de lavoura no Talhão 360°."
          />
        )}
      </RichTabPanel>

      {romaneioLote && configQ.data && (
        <RomaneioModal
          open
          onOpenChange={(o) => !o && setRomaneioLote(null)}
          lote={romaneioLote}
          animais={animaisQ.data ?? []}
          pesagensMap={pesagensMap}
          carenciaMap={carenciaMap}
          rendimentoCarcacaPct={configQ.data.rendimentoCarcacaPct}
          precoArroba={configQ.data.precoArrobaVenda}
        />
      )}

      {configQ.data && (
        <TransferenciaModal
          open={desmameOpen}
          onOpenChange={setDesmameOpen}
          lotes={lotesQ.data ?? []}
          animais={animaisQ.data ?? []}
          costCenters={ccQ.data ?? []}
          valorPadraoPorCabeca={configQ.data.valorMercadoPorCategoria.bezerro ?? 2200}
          tabelaValorPorCategoria={configQ.data.valorMercadoPorCategoria}
        />
      )}
    </div>
  );
}
