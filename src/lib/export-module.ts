import { formatValue } from "@/lib/chart-theme";
import { exportSheetsToXlsx, type XlsxSheet } from "@/lib/export-xlsx";
import { downloadPdf, makeReportPdf, type PdfTableRow } from "@/lib/pdf-utils";
import type { ModuleOverviewSpec } from "@/lib/overview/types";

// "Exportar com TUDO". Antes não existia nenhum export de módulo inteiro: era
// aba corrente, uma entidade, ou FAKE (o botão da Logística só dava um toast; o
// do Financeiro dizia "exportação preparada" sem gerar arquivo).
//
// O workbook é derivado do MESMO ModuleOverviewSpec que desenha a tela, então
// o arquivo não pode divergir do que o usuário está vendo.

export type ModuleTabData = {
  id: string;
  label: string;
  fields: Array<{ key: string; label: string }>;
  records: Array<{ payload: Record<string, string> }>;
};

export type ModuleWorkbook = {
  filename: string;
  title: string;
  subtitle: string;
  demoMode: boolean;
  kpis: Array<{ label: string; value: string }>;
  sheets: XlsxSheet[];
};

function textoKpi(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "number") return formatValue(value);
  if (typeof value === "string") return value;
  // KPI com ReactNode como valor (ícone, badge): o export leva o rótulo.
  return "—";
}

/**
 * Monta o pacote completo: aba "Resumo" (metadados + KPIs + os dados de cada
 * gráfico como números) + uma aba por sub-aba do módulo + as tabelas do spec.
 * Função pura — testável sem browser.
 */
export function buildModuleWorkbook(input: {
  spec: ModuleOverviewSpec;
  tabs: ModuleTabData[];
  /** Data/hora da geração; recebida de fora para a função continuar pura. */
  geradoEm: string;
}): ModuleWorkbook {
  const { spec, tabs, geradoEm } = input;
  const modo = spec.demoMode ? "DEMO (dados demonstrativos)" : "REAL";
  const periodo = spec.periodLabel ?? "Todo o período";

  const resumo: XlsxSheet = {
    name: "Resumo",
    header: ["Seção", "Item", "Valor"],
    rows: [
      ["Relatório", "Módulo", spec.moduleLabel],
      ["Relatório", "Modo", modo],
      ["Relatório", "Período", periodo],
      ["Relatório", "Gerado em", geradoEm],
      ...spec.kpis.map((k) => ["Indicador", k.label, textoKpi(k.value)] as PdfTableRow),
      // Os gráficos entram como números: quem abre a planilha consegue refazer
      // qualquer gráfico da tela.
      ...spec.charts.flatMap((c) =>
        c.data.map(
          (d) =>
            [
              `Gráfico · ${c.title}`,
              String(d[c.xKey] ?? ""),
              c.series.map((s) => `${s.name}: ${d[s.key] ?? 0}`).join(" | "),
            ] as PdfTableRow,
        ),
      ),
    ] as XlsxSheet["rows"],
  };

  const abas: XlsxSheet[] = tabs
    .filter((t) => t.records.length > 0)
    .map((t) => ({
      name: t.label,
      header: t.fields.map((f) => f.label),
      rows: t.records.map((r) => t.fields.map((f) => r.payload[f.key] ?? "")),
    }));

  const tabelas: XlsxSheet[] = (spec.tables ?? [])
    .filter((t) => t.body.length > 0)
    .map((t) => ({ name: t.title, header: t.head, rows: t.body }));

  return {
    filename: `agrotorre-${spec.moduleId}${spec.demoMode ? "-demo" : ""}`,
    title: spec.moduleLabel,
    subtitle: `${modo} · ${periodo} · gerado em ${geradoEm}`,
    demoMode: spec.demoMode,
    kpis: spec.kpis.map((k) => ({ label: k.label, value: textoKpi(k.value) })),
    sheets: [resumo, ...abas, ...tabelas],
  };
}

/**
 * Spec mínimo para módulos que ainda não têm visão geral rica: o export já
 * funciona (todas as abas + resumo), e passa a levar KPIs e gráficos assim que
 * o módulo ganhar o seu builder.
 */
export function specMinimo(input: {
  moduleId: string;
  moduleLabel: string;
  tabs: ModuleTabData[];
  demoMode: boolean;
  periodLabel?: string;
}): ModuleOverviewSpec {
  return {
    moduleId: input.moduleId,
    moduleLabel: input.moduleLabel,
    tabs: input.tabs.map((t) => ({ id: t.id, label: t.label })),
    kpis: input.tabs.map((t) => ({
      label: t.label,
      value: t.records.length,
      tabId: t.id,
    })),
    charts: [],
    demoMode: input.demoMode,
    periodLabel: input.periodLabel,
  };
}

/** Data/hora local pt-BR — o carimbo do relatório. */
export function agora(): string {
  return new Date().toLocaleString("pt-BR");
}

/**
 * Workbook de um módulo cujos dados NÃO são `operation_records` (Pecuária,
 * Talhão 360, Calendário, Insumos, RDC): sai o dashboard inteiro — todos os
 * KPIs, a série de cada gráfico e as tabelas do spec.
 *
 * Não duplica o export de registro bruto porque esses módulos já têm o deles,
 * mais rico e específico (dossiê EUDR, romaneio de lote, ficha do RDC em PDF/CSV,
 * eventos do calendário em XLSX, os 6 modelos de PDF do Talhão 360). O que
 * faltava era exportar a leitura consolidada.
 */
export function specToWorkbook(spec: ModuleOverviewSpec, geradoEm: string): ModuleWorkbook {
  return buildModuleWorkbook({ spec, tabs: [], geradoEm });
}

export async function exportModuleXlsx(wb: ModuleWorkbook): Promise<void> {
  await exportSheetsToXlsx(wb.filename, wb.sheets);
}

export function exportModulePdf(wb: ModuleWorkbook): void {
  const doc = makeReportPdf({
    title: wb.title,
    subtitle: wb.subtitle,
    badge: wb.demoMode ? "DEMO" : "REAL",
    metrics: wb.kpis,
    // O "Resumo" já está no cabeçalho e nas métricas; no PDF as seções são as
    // abas com registro, para o documento ser legível.
    sections: wb.sheets
      .filter((s) => s.name !== "Resumo")
      .map((s) => ({ title: s.name, head: s.header, body: s.rows })),
    rodape: `AgroTorre · ${wb.title}`,
  });
  downloadPdf(doc, `${wb.filename}.pdf`);
}
