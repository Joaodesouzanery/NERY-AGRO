import { BarsChart, ChartFrame, DonutChart, TrendChart } from "@/components/charts";
import { RichBarList, RichTabKpis, RichTabPanel } from "@/components/rich-tab";
import { SectionLabel } from "@/components/section-label";
import type { ModuleOverviewSpec, OverviewChart } from "@/lib/overview/types";
import { ModuleExportButtons } from "@/components/module-export-buttons";
import { agora, specToWorkbook } from "@/lib/export-module";
import { cn } from "@/lib/utils";

// Renderiza a visão geral de qualquer módulo a partir do spec. Duas zonas:
// os gráficos "featured" grandes no topo (a leitura executiva) e uma grade
// compacta que cobre TODAS as demais abas — para módulos com 12/15/18 abas,
// empilhar tudo em tamanho cheio seria ilegível e lento.

function Grafico({ chart }: { chart: OverviewChart }) {
  const vazio = chart.data.length === 0;
  switch (chart.kind) {
    case "trend":
      return (
        <TrendChart
          data={chart.data}
          xKey={chart.xKey}
          series={chart.series}
          area={chart.area}
          format={chart.format}
        />
      );
    case "donut":
      return (
        <DonutChart
          data={chart.data}
          nameKey={chart.xKey}
          valueKey={chart.series[0]?.key ?? "value"}
          format={chart.format}
          colors={chart.colors}
        />
      );
    case "barlist":
      // Lista de barras CSS: mais legível que um gráfico quando são muitos
      // itens com nome longo. Não usa ResponsiveContainer.
      return vazio ? null : (
        <RichBarList
          items={chart.data.map((d) => ({
            label: String(d[chart.xKey] ?? ""),
            value: Number(d[chart.series[0]?.key ?? "value"] ?? 0),
          }))}
        />
      );
    default:
      return (
        <BarsChart
          data={chart.data}
          xKey={chart.xKey}
          series={chart.series}
          layout={chart.layout}
          format={chart.format}
        />
      );
  }
}

const GRUPO_RESTO = "Outros";

function Card({
  chart,
  altura,
  onSelectTab,
  labelAba,
}: {
  chart: OverviewChart;
  altura: number;
  onSelectTab?: (tabId: string) => void;
  labelAba?: string;
}) {
  const vazio = chart.data.length === 0;
  // barlist não é SVG: renderiza direto, sem a moldura de altura fixa.
  if (chart.kind === "barlist" && !vazio) {
    return (
      <RichTabPanel
        title={chart.title}
        description={chart.description}
        action={
          onSelectTab && labelAba ? (
            <button
              type="button"
              onClick={() => onSelectTab(chart.tabId)}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              {labelAba} →
            </button>
          ) : undefined
        }
      >
        <Grafico chart={chart} />
      </RichTabPanel>
    );
  }
  return (
    <ChartFrame
      title={chart.title}
      description={chart.description}
      height={altura}
      empty={vazio}
      emptyTitle={chart.emptyTitle ?? "Sem dados nesta aba"}
      emptyDescription={
        chart.emptyDescription ?? (labelAba ? `Cadastre registros em "${labelAba}".` : undefined)
      }
      action={
        onSelectTab && labelAba ? (
          <button
            type="button"
            onClick={() => onSelectTab(chart.tabId)}
            className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            abrir →
          </button>
        ) : undefined
      }
    >
      <Grafico chart={chart} />
    </ChartFrame>
  );
}

export function ModuleOverview({
  spec,
  onSelectTab,
  className,
  mostrarExport = false,
}: {
  spec: ModuleOverviewSpec;
  /** Clique no KPI/gráfico leva para a aba correspondente. */
  onSelectTab?: (tabId: string) => void;
  className?: string;
  /**
   * Mostra o botão de exportar o dashboard (KPIs + série de cada gráfico +
   * tabelas). Opt-in porque os módulos de `operation_records` já têm um export
   * mais completo no header da página — ali sai também um registro por aba.
   */
  mostrarExport?: boolean;
}) {
  const destaque = spec.charts.filter((c) => c.featured);
  const cobertura = spec.charts.filter((c) => !c.featured);
  const labelDe = (tabId: string) => spec.tabs.find((t) => t.id === tabId)?.label;

  // Grade agrupada por tema quando o módulo declara `grupos`; grade única
  // quando não declara — que é como todos os módulos começam.
  //
  // Gráfico cujo grupo não existe cai em GRUPO_RESTO em vez de sumir: um erro
  // de digitação no metadado não pode apagar um gráfico da tela. Quem cobra o
  // acerto é `overviewCoverage`, no teste.
  const gruposDeclarados = spec.grupos ?? [];
  const secoes = gruposDeclarados.length
    ? [...gruposDeclarados, GRUPO_RESTO]
        .map((nome) => ({
          nome,
          charts: cobertura.filter((c) =>
            nome === GRUPO_RESTO
              ? !c.grupo || !gruposDeclarados.includes(c.grupo)
              : c.grupo === nome,
          ),
        }))
        .filter((g) => g.charts.length > 0)
    : [{ nome: "", charts: cobertura }];

  return (
    <div className={cn("space-y-5", className)}>
      {mostrarExport && (
        <div className="flex justify-end">
          <ModuleExportButtons workbook={() => specToWorkbook(spec, agora())} />
        </div>
      )}
      {spec.kpis.length > 0 && <RichTabKpis kpis={spec.kpis} />}

      {spec.hero}

      {destaque.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {destaque.map((c) => (
            <Card
              key={c.id}
              chart={c}
              altura={288}
              onSelectTab={onSelectTab}
              labelAba={labelDe(c.tabId)}
            />
          ))}
        </div>
      )}

      {cobertura.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Todas as abas do módulo
          </h3>
          <div className="space-y-5">
            {secoes.map((g) => (
              <div key={g.nome || "grade"}>
                {g.nome && <SectionLabel className="mb-2">{g.nome}</SectionLabel>}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {g.charts.map((c) => (
                    <Card
                      key={c.id}
                      chart={c}
                      altura={200}
                      onSelectTab={onSelectTab}
                      labelAba={labelDe(c.tabId)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(spec.tables ?? []).length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {(spec.tables ?? []).map((t) => (
            <RichTabPanel key={t.id} title={t.title} description={t.description}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    {/* Mesma faixa do cabeçalho dos cards e do DataTable. */}
                    <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                      {t.head.map((h) => (
                        <th key={h} className="px-2 py-1.5 font-medium first:pl-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.body.map((linha, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        {linha.map((celula, j) => (
                          <td key={j} className="py-1.5 pr-3">
                            {typeof celula === "number" ? celula.toLocaleString("pt-BR") : celula}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </RichTabPanel>
          ))}
        </div>
      )}
    </div>
  );
}
