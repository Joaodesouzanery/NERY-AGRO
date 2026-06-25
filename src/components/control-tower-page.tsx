import { type ComponentType, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Gauge,
  GitBranch,
  Layers,
  Package,
  Route,
  Truck,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { AgroMap } from "@/components/agro-map";
import { PeriodPicker, defaultPeriod, type PeriodValue } from "@/components/period-picker";
import { downloadPdf } from "@/lib/pdf-utils";
import {
  buildControlTowerModel,
  type ControlTowerModel,
  useConnectedAgroData,
} from "@/lib/connected-agro-data";
import type { MapPoint } from "@/components/carto-map";
import { cn } from "@/lib/utils";

const layerOptions = [
  { id: "clientes", label: "Clientes" },
  { id: "bases", label: "CDs/Bases" },
  { id: "plantas", label: "Plantas/Talhões" },
  { id: "rotas", label: "Rotas" },
  { id: "fornecedores", label: "Fornecedores" },
];

const fallbackSeries = [
  { label: "Jan", otif: 91, vendas: 68000, capacidade: 76 },
  { label: "Fev", otif: 94, vendas: 73000, capacidade: 80 },
  { label: "Mar", otif: 92, vendas: 70500, capacidade: 78 },
  { label: "Abr", otif: 96, vendas: 89000, capacidade: 84 },
  { label: "Mai", otif: 98, vendas: 148000, capacidade: 88 },
];

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function exportCsv(model: ControlTowerModel) {
  const header = ["Código", "Cliente", "Destino", "Motorista", "Status", "Valor"];
  const rows = model.shipments.map((item) => [
    item.codigo,
    item.cliente,
    item.destino,
    item.motorista,
    item.status,
    item.valor,
  ]);
  const csv = [header, ...rows]
    .map((line) => line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "torre-de-controle-nery.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(model: ControlTowerModel, demoMode: boolean, period: PeriodValue) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedAt = new Date().toLocaleString("pt-BR");
  const mapSnapshot = await captureMapSnapshot();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 118, "F");
  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, 12, pageHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("Torre de Controle Nery Agro", 40, 44);
  doc.setFontSize(10);
  doc.text(
    `${demoMode ? "Dados demonstrativos" : "Dados reais"} · ${period.label} · Gerado em ${generatedAt}`,
    40,
    66,
  );
  doc.setDrawColor(76, 111, 87);
  doc.line(40, 88, pageWidth - 40, 88);
  doc.setFontSize(9);
  doc.text("Relatório consolidado para impressão: operação, mapa, alertas e indicadores.", 40, 104);

  let y = 142;
  y = drawMetricGrid(
    doc,
    [
      { label: "OTIF", value: `${model.metrics.otif}%` },
      { label: "Vendas", value: money(model.metrics.vendas) },
      { label: "Capacidade", value: `${model.metrics.capacidade}%` },
      { label: "Alertas", value: String(model.metrics.alertas) },
      { label: "Cargas", value: String(model.metrics.cargas) },
      { label: "Nós da rede", value: String(model.metrics.nosRede) },
    ],
    y,
  );

  y = drawMetricGrid(
    doc,
    [
      { label: "Em trânsito", value: String(model.mapMetrics.emTransito) },
      { label: "Entregues", value: String(model.mapMetrics.entregues) },
      { label: "Atrasadas", value: String(model.mapMetrics.atrasadas) },
      { label: "Total de Cargas", value: String(model.mapMetrics.totalCargas) },
      { label: "Rotas", value: String(model.mapMetrics.totalRotas) },
      { label: "Bases/CDs", value: String(model.mapMetrics.bases) },
    ],
    y + 8,
    "Totais agregados do mapa",
  );

  if (mapSnapshot && y < 540) {
    doc.setTextColor(23, 37, 30);
    doc.setFontSize(12);
    doc.text("Captura do mapa operacional", 40, y + 8);
    doc.addImage(mapSnapshot, "PNG", 40, y + 18, pageWidth - 80, 150, undefined, "FAST");
    y += 188;
  }

  autoTable(doc, {
    startY: y + 8,
    head: [["Módulo", "Indicador", "Detalhe"]],
    body: model.moduleCards.map((item) => [item.label, item.value, item.detail]),
    styles: { fontSize: 8, cellPadding: 6 },
    headStyles: { fillColor: [20, 83, 45], textColor: 255 },
    alternateRowStyles: { fillColor: [246, 248, 246] },
    margin: { left: 40, right: 40 },
  });

  autoTable(doc, {
    startY: lastTableY(doc) + 28,
    head: [["Origem", "Alerta", "Descrição", "Severidade"]],
    body: model.alerts.map((item) => [item.source, item.title, item.description, item.severity]),
    styles: { fontSize: 7.5, cellPadding: 5 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
  });

  autoTable(doc, {
    startY: lastTableY(doc) + 28,
    head: [["Código", "Cliente", "Destino", "Motorista", "Status", "Valor"]],
    body: model.shipments.map((item) => [
      item.codigo,
      item.cliente,
      item.destino,
      item.motorista,
      item.status,
      money(Number(item.valor ?? 0)),
    ]),
    styles: { fontSize: 7.5, cellPadding: 5 },
    headStyles: { fillColor: [20, 83, 45], textColor: 255 },
    alternateRowStyles: { fillColor: [246, 248, 246] },
    margin: { left: 40, right: 40 },
  });

  addFooters(doc);
  downloadPdf(doc, "torre-de-controle-nery-agro.pdf");
}

function lastTableY(doc: jsPDF) {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
}

function drawMetricGrid(
  doc: jsPDF,
  metrics: Array<{ label: string; value: string }>,
  y: number,
  title?: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const colWidth = (pageWidth - 80) / 3;
  let nextY = y;
  if (title) {
    doc.setTextColor(23, 37, 30);
    doc.setFontSize(12);
    doc.text(title, 40, nextY);
    nextY += 14;
  }
  metrics.forEach((metric, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 40 + col * colWidth;
    const boxY = nextY + row * 58;
    doc.setDrawColor(220, 226, 220);
    doc.setFillColor(250, 252, 250);
    doc.roundedRect(x, boxY, colWidth - 10, 46, 6, 6, "FD");
    doc.setTextColor(95, 108, 101);
    doc.setFontSize(8);
    doc.text(metric.label, x + 12, boxY + 16);
    doc.setTextColor(23, 37, 30);
    doc.setFontSize(14);
    doc.text(String(metric.value).slice(0, 24), x + 12, boxY + 34);
  });
  return nextY + Math.ceil(metrics.length / 3) * 58;
}

function addFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`Nery Agro · Torre de Controle · Página ${page}/${pageCount}`, 40, pageHeight - 24);
    doc.text("Relatório pronto para impressão", pageWidth - 150, pageHeight - 24);
  }
}

async function captureMapSnapshot() {
  try {
    const canvas = document.querySelector<HTMLCanvasElement>(".maplibregl-canvas");
    return canvas?.toDataURL("image/png");
  } catch {
    return undefined;
  }
}

function pointLayer(point: MapPoint) {
  if (point.id.startsWith("dest-")) return "clientes";
  if (point.id.startsWith("base-")) return "bases";
  if (point.id.startsWith("field-")) return "plantas";
  if (point.id.startsWith("origin-")) return "rotas";
  return "fornecedores";
}

export function ControlTowerPage() {
  const { snapshot, loading, demoMode, lastUpdatedAt } = useConnectedAgroData();
  const [period, setPeriod] = useState<PeriodValue>(defaultPeriod());
  const [selectedLayers, setSelectedLayers] = useState<string[]>([
    "clientes",
    "bases",
    "plantas",
    "rotas",
    "fornecedores",
  ]);
  const model = useMemo(() => buildControlTowerModel(snapshot), [snapshot]);
  const filteredPoints = useMemo(
    () => model.points.filter((point) => selectedLayers.includes(pointLayer(point))),
    [model.points, selectedLayers],
  );
  const filteredRoutes = selectedLayers.includes("rotas") ? model.routes : [];
  const dangerAlerts = model.alerts.filter((item) => item.severity === "danger").length;
  const lastSync = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString("pt-BR") : "--:--";
  const moduleVolume = useMemo(
    () => [
      {
        label: "Logistica",
        valor: snapshot.operations.filter((item) => item.area === "logistica").length,
      },
      { label: "Financeiro", valor: snapshot.financial.length },
      { label: "Campo", valor: snapshot.field.length },
      {
        label: "Pecuaria",
        valor: snapshot.operations.filter((item) => item.area === "pecuaria").length,
      },
      {
        label: "COGS",
        valor: snapshot.operations.filter((item) => item.area === "cogs").length,
      },
    ],
    [snapshot],
  );
  const alertVolume = useMemo(() => {
    const grouped = new Map<string, number>();
    model.alerts.forEach((alert) => {
      const source = alert.source.split("/")[0] || "outros";
      grouped.set(source, (grouped.get(source) ?? 0) + 1);
    });
    return Array.from(grouped.entries()).map(([label, valor]) => ({ label, valor }));
  }, [model.alerts]);

  const toggleLayer = (layer: string) => {
    setSelectedLayers((current) =>
      current.includes(layer) ? current.filter((item) => item !== layer) : [...current, layer],
    );
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Layers className="h-3.5 w-3.5" />
            Visibilidade unificada
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Torre de Controle</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rede logística, campo, finanças, pecuária, sustentabilidade, inteligência e COGS em uma
            visão operacional conectada.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
            Tempo real · {lastSync}
          </div>
          <PeriodPicker value={period} onChange={setPeriod} />
          <button
            onClick={() => exportCsv(model)}
            className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => void exportPdf(model, demoMode, period)}
            className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <TowerKpi
          icon={CheckCircle2}
          label="OTIF"
          value={`${model.metrics.otif}%`}
          tone="success"
        />
        <TowerKpi
          icon={Package}
          label="Vendas"
          value={money(model.metrics.vendas)}
          tone="primary"
        />
        <TowerKpi
          icon={Gauge}
          label="Capacidade"
          value={`${model.metrics.capacidade}%`}
          tone="primary"
        />
        <TowerKpi
          icon={AlertTriangle}
          label="Alertas"
          value={String(model.metrics.alertas)}
          tone={dangerAlerts ? "danger" : "warning"}
        />
        <TowerKpi icon={Truck} label="Cargas" value={String(model.metrics.cargas)} tone="neutral" />
        <TowerKpi
          icon={GitBranch}
          label="Nós da rede"
          value={String(model.metrics.nosRede)}
          tone="neutral"
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Mapa global por camadas</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Clientes, CDs, plantas, fornecedores e rotas com atualização quase instantânea.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {layerOptions.map((layer) => {
              const active = selectedLayers.includes(layer.id);
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Filter className="h-3 w-3" />
                  {layer.label}
                </button>
              );
            })}
          </div>
        </div>
        <AgroMap
          points={filteredPoints}
          routes={filteredRoutes}
          stats={[
            { label: "Em trânsito", value: model.mapMetrics.emTransito, tone: "primary" },
            { label: "Entregues", value: model.mapMetrics.entregues, tone: "success" },
            { label: "Atrasadas", value: model.mapMetrics.atrasadas, tone: "danger" },
            { label: "Total de Cargas", value: model.mapMetrics.totalCargas, tone: "neutral" },
          ]}
          className="h-[560px]"
          title="Rede agro conectada"
          subtitle={
            loading
              ? "Sincronizando dados..."
              : "Clique nos itens para ver status, rota, origem, destino e alertas."
          }
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Visão de rede integrada</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Todos os módulos conectados em um único painel.
              </p>
            </div>
            <button
              onClick={() => toast.info("Planejamento integrado atualizado com o snapshot atual.")}
              className="h-8 rounded-md border border-border px-3 text-xs hover:bg-muted"
            >
              Atualizar planejamento
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {model.moduleCards.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border bg-background/60 p-4"
              >
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className={cn("mt-1 text-xl font-semibold", item.tone)}>{item.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <div>
              <h2 className="font-semibold">Alertas proativos</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Anomalias, atrasos e riscos antes que virem custo.
              </p>
            </div>
          </div>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {model.alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "rounded-lg border p-3",
                  alert.severity === "danger"
                    ? "border-destructive/30 bg-destructive/10"
                    : alert.severity === "warning"
                      ? "border-warning/30 bg-warning/10"
                      : "border-border bg-background/60",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{alert.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{alert.description}</div>
                  </div>
                  <span className="rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">
                    {alert.source}
                  </span>
                </div>
              </div>
            ))}
            {model.alerts.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum alerta crítico no snapshot atual.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-4">
            <h2 className="font-semibold">Volume conectado por módulo</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Registros consolidados do snapshot em tempo real.
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={moduleVolume}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="valor" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-4">
            <h2 className="font-semibold">Alertas por origem</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Priorização cruzada entre financeiro, operação e campo.
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart
                data={alertVolume.length ? alertVolume : [{ label: "Sem alertas", valor: 0 }]}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="valor" fill="var(--color-chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-4">
            <h2 className="font-semibold">KPIs operacionais</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              OTIF, vendas mensais e capacidade em leitura executiva.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={fallbackSeries}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area
                  dataKey="otif"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  dataKey="capacidade"
                  stroke="var(--color-chart-2)"
                  fill="var(--color-chart-2)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-4">
            <h2 className="font-semibold">Planejamento e ordens de material</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Priorização operacional para produção, expedição e abastecimento.
            </p>
          </div>
          <div className="space-y-2">
            {[
              ["Alta", "Revisar rota atrasada e reprogramar janela de entrega."],
              ["Média", "Conferir estoque mínimo de embalagem e insumos críticos."],
              ["Média", "Validar capacidade de frota para próxima remessa CSA."],
              ["Baixa", "Atualizar registros de certificação e caderno de campo."],
            ].map(([priority, text]) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                  {priority[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{text}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Prioridade {priority}</div>
                </div>
                <Route className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Cargas, ordens e clientes em acompanhamento</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Fila operacional conectada à Logística, Financeiro e COGS.
            </p>
          </div>
          <button
            onClick={() => toast.info("Agrupamento mensal aplicado.")}
            className="flex h-8 items-center gap-2 rounded-md border border-border px-3 text-xs"
          >
            <Calendar className="h-3.5 w-3.5" />
            Mensal
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-3 font-medium">Código</th>
                <th className="py-3 font-medium">Cliente</th>
                <th className="py-3 font-medium">Destino</th>
                <th className="py-3 font-medium">Motorista</th>
                <th className="py-3 font-medium">Status</th>
                <th className="py-3 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {model.shipments.map((item) => (
                <tr key={item.codigo} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{item.codigo}</td>
                  <td className="py-3">{item.cliente}</td>
                  <td className="py-3">{item.destino}</td>
                  <td className="py-3 text-muted-foreground">{item.motorista}</td>
                  <td className="py-3">{item.status}</td>
                  <td className="py-3 text-right">{money(Number(item.valor ?? 0))}</td>
                </tr>
              ))}
              {model.shipments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma carga real cadastrada para a Torre de Controle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TowerKpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "success" | "primary" | "warning" | "danger" | "neutral";
}) {
  const toneClass = {
    success: "text-success",
    primary: "text-primary",
    warning: "text-warning",
    danger: "text-destructive",
    neutral: "text-foreground",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={cn("mt-1.5 text-2xl font-semibold", toneClass)}>{value}</div>
    </div>
  );
}
