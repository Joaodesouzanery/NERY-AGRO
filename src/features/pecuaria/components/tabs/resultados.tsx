import { useMemo, useState } from "react";
import { ArrowRightLeft, FileDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { RichTabKpis, RichTabPanel } from "@/components/rich-tab";
import { cn } from "@/lib/utils";
import { parseCycles } from "@/features/talhao-360/api/services";
import { parsePolygon, polygonAreaHa } from "@/features/talhao-360/map/geometry";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
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
import { useCostCenters } from "@/features/pecuaria/hooks/use-financeiro-pecuaria";
import { useRentabilidadeLotes } from "@/features/pecuaria/hooks/use-rentabilidade";
import { CATEGORIA_LABEL, type CategoriaCusto } from "@/features/pecuaria/lib/custos";
import type { PecLote } from "@/features/pecuaria/types/domain";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function areaHa(t: TalhaoRecord): number | null {
  const declarada = Number.parseFloat(t.payload.area_ha ?? "");
  if (Number.isFinite(declarada) && declarada > 0) return declarada;
  const poly = parsePolygon(t.payload.geometry_geojson);
  if (!poly) return null;
  const a = polygonAreaHa(poly.coordinates[0] as Array<[number, number]>);
  return a > 0 ? a : null;
}

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
  const pesagensMap = useMemo(() => groupPesagensByAnimal(pesagensQ.data ?? []), [pesagensQ.data]);
  const carenciaMap = useMemo(() => carenciaByAnimal(carenciaQ.data ?? []), [carenciaQ.data]);

  const totalArrobas = linhas.reduce((s, l) => s + l.arrobas, 0);
  const totalCusto = linhas.reduce((s, l) => s + l.custoTotal, 0);
  const totalResultado = linhas.reduce((s, l) => s + (l.resultado ?? 0), 0);
  const custoMedioArroba = totalArrobas > 0 ? totalCusto / totalArrobas : null;

  // Resultado por talhão: pecuária (lotes que ocuparam) + lavoura (ciclos do Campo).
  const porTalhao = useMemo(() => {
    const talhoes = talhoesQ.data ?? [];
    const ocupacoes = ocupacoesQ.data ?? [];
    return talhoes
      .map((talhao) => {
        const area = areaHa(talhao);
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

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "@ produzidas", value: totalArrobas.toFixed(1) },
          { label: "Custo acumulado", value: brl(totalCusto) },
          {
            label: "Custo médio/@",
            value: custoMedioArroba !== null ? brl(custoMedioArroba) : "—",
          },
          {
            label: "Resultado",
            value: brl(totalResultado),
            trendDir: totalResultado >= 0 ? "up" : "down",
          },
        ]}
      />

      <RichTabPanel
        title="Rentabilidade lote a lote"
        description={`Preço da @ em ${brl(configQ.data?.precoArrobaVenda ?? 0)} · rendimento de carcaça ${((configQ.data?.rendimentoCarcacaPct ?? 0) * 100).toFixed(0)}%`}
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
      </RichTabPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel
          title="Custo por categoria"
          description="Soma dos lançamentos dos centros de custo"
        >
          {totalCusto > 0 ? (
            <div className="space-y-2.5">
              {(Object.keys(CATEGORIA_LABEL) as CategoriaCusto[]).map((cat) => {
                const valor = linhas.reduce((s, l) => s + l.porCategoria[cat], 0);
                if (valor === 0) return null;
                return (
                  <div
                    key={cat}
                    className="grid grid-cols-[130px_1fr_auto] items-center gap-3 text-xs"
                  >
                    <span className="text-muted-foreground">{CATEGORIA_LABEL[cat]}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${(valor / totalCusto) * 100}%` }}
                      />
                    </span>
                    <span className="tabular-nums font-medium">{brl(valor)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Sem lançamentos"
              description="Vincule um centro de custo ao lote e lance despesas no Financeiro."
            />
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
            </div>
          ) : (
            <EmptyState
              title="Sem resultado por talhão"
              description="Movimente um lote para um talhão, ou registre ciclos de lavoura no Talhão 360°."
            />
          )}
        </RichTabPanel>
      </div>

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
        />
      )}
    </div>
  );
}
