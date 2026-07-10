// Relatórios do Calendário: previsto x realizado (informativo), atrasos,
// execução por responsável, eventos por ciclo, decisões e compras. Exportação
// reutiliza o utilitário XLSX do projeto e registra os filtros aplicados.
import { BarChart3, Download } from "lucide-react";
import { toast } from "sonner";
import { RichBarList, RichTabKpis, RichTabPanel } from "@/components/rich-tab";
import { EmptyState } from "@/components/empty-state";
import { exportRowsToXlsx } from "@/lib/export-xlsx";
import {
  delayImpact,
  effectiveStatusId,
  formatDay,
  groupCost,
  groupCount,
  isOverdue,
} from "@/features/campo-calendar/lib/derive";
import {
  eventTypeLabels,
  priorityLabels,
  sourceLabels,
  visibilityLabels,
} from "@/features/campo-calendar/types/domain";
import { brl } from "@/features/campo-calendar/components/event-tone";
import type { CalendarTabProps } from "@/features/campo-calendar/components/tab-props";

export function RelatoriosTab(props: CalendarTabProps) {
  const { model, events, filters, now } = props;

  const concluidas = events.filter((event) => event.statusId === "concluida").length;
  const atrasadas = events.filter((event) => isOverdue(event, now)).length;
  const custoPrevisto = events.reduce((sum, event) => sum + (event.estimatedCost ?? 0), 0);
  const semCusto = events.filter((event) => event.estimatedCost == null).length;
  const comVinculo = events.filter((event) => event.relatedRecordId).length;
  const impactoAtraso = delayImpact(events, now);

  const porStatus = groupCount(events, (event) => {
    const id = effectiveStatusId(event, now);
    return model.statuses.find((status) => status.id === id)?.label ?? id;
  });
  const porResponsavel = groupCount(events, (event) => event.responsibleName);
  const atrasosPorTalhao = groupCount(
    events.filter((event) => isOverdue(event, now)),
    (event) => event.talhaoName,
  );
  const porCiclo = groupCount(events, (event) =>
    event.cicloNome
      ? `${event.cicloNome}${event.talhaoName ? ` (${event.talhaoName})` : ""}`
      : undefined,
  );
  const custoPorTalhao = groupCost(events, (event) => event.talhaoName ?? "Fazenda toda");
  const custoPorTipo = groupCost(events, (event) => eventTypeLabels[event.eventType]);
  const decisoes = groupCount(
    events.filter((event) => event.eventType === "decisao"),
    (event) => (event.decisionSelected ? "Decididas" : "Pendentes"),
  );
  const compras = events.filter((event) => event.eventType === "compra");

  const exportar = async () => {
    const filtros = [
      filters.fieldId && `talhão=${model.talhoes.find((t) => t.id === filters.fieldId)?.nome}`,
      filters.seasonId && `safra=${filters.seasonId}`,
      filters.cycleId && `ciclo=${filters.cycleId}`,
      filters.status && `status=${filters.status}`,
      filters.responsible && `responsável=${filters.responsible}`,
      filters.eventType && `tipo=${filters.eventType}`,
      filters.priority && `prioridade=${filters.priority}`,
    ]
      .filter(Boolean)
      .join("; ");
    try {
      await exportRowsToXlsx(
        "calendario-campo",
        [
          "Título",
          "Tipo",
          "Início",
          "Fim",
          "Talhão",
          "Ciclo",
          "Safra",
          "Responsável",
          "Status",
          "Prioridade",
          "Origem",
          "Visibilidade",
          "Custo estimado",
          "Custo de atraso",
          `Filtros: ${filtros || "nenhum"}`,
        ],
        events.map((event) => [
          event.title,
          eventTypeLabels[event.eventType],
          formatDay(event.startsAt),
          event.endsAt ? formatDay(event.endsAt) : "",
          event.talhaoName ?? "",
          event.cicloNome ?? "",
          event.safra ?? "",
          event.responsibleName ?? "",
          model.statuses.find((status) => status.id === effectiveStatusId(event, now))?.label ??
            event.statusId,
          priorityLabels[event.priority],
          sourceLabels[event.source],
          visibilityLabels[event.visibility],
          event.estimatedCost ?? "",
          event.delayCost ?? "",
          "",
        ]),
        "Calendário",
      );
      toast.success("Relatório exportado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao exportar.");
    }
  };

  if (!events.length) {
    return (
      <EmptyState
        title="Sem dados para relatório no filtro atual"
        description="Ajuste os filtros globais ou crie tarefas no Calendário."
        icon={BarChart3}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Custos são estimativas de planejamento — “realizado” dependerá dos vínculos com
          Financeiro/Operações ({comVinculo} evento(s) já vinculados).
        </p>
        <button
          onClick={() => void exportar()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          Exportar XLSX
        </button>
      </div>

      <RichTabKpis
        kpis={[
          { label: "Eventos", value: events.length, icon: BarChart3 },
          {
            label: "Conclusão",
            value: `${events.length ? Math.round((concluidas / events.length) * 100) : 0}%`,
            hint: `${concluidas} concluída(s)`,
          },
          {
            label: "Atrasadas",
            value: atrasadas,
            trend: atrasadas ? "rever" : "ok",
            trendDir: atrasadas ? "down" : "up",
          },
          { label: "Custo previsto", value: brl(custoPrevisto) },
          {
            label: "Impacto de atraso",
            value: brl(impactoAtraso),
            hint: "custo de atraso vencido",
          },
          { label: "Sem custo informado", value: semCusto },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel title="Tarefas por status" description="Distribuição no filtro aplicado">
          <RichBarList items={porStatus} />
        </RichTabPanel>
        <RichTabPanel title="Execução por responsável" description="Tarefas atribuídas">
          {porResponsavel.length ? (
            <RichBarList items={porResponsavel} color="var(--color-chart-2)" />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum responsável atribuído.</p>
          )}
        </RichTabPanel>
        <RichTabPanel title="Atrasos por talhão" description="Onde o cronograma está estourando">
          {atrasosPorTalhao.length ? (
            <RichBarList items={atrasosPorTalhao} color="var(--color-destructive)" />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa atrasada. 🎯</p>
          )}
        </RichTabPanel>
        <RichTabPanel title="Eventos por ciclo" description="Volume de trabalho por ciclo">
          {porCiclo.length ? (
            <RichBarList items={porCiclo} color="var(--color-chart-3)" />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum evento vinculado a ciclo.</p>
          )}
        </RichTabPanel>
        <RichTabPanel title="Custo estimado por talhão" description="Planejado (informativo)">
          {custoPorTalhao.length ? (
            <RichBarList items={custoPorTalhao} format={brl} />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum custo estimado informado.</p>
          )}
        </RichTabPanel>
        <RichTabPanel title="Custo estimado por tipo" description="Compras, operações, máquinas…">
          {custoPorTipo.length ? (
            <RichBarList items={custoPorTipo} format={brl} color="var(--color-chart-4)" />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum custo estimado informado.</p>
          )}
        </RichTabPanel>
        <RichTabPanel title="Decisões" description="Pendentes x decididas">
          {decisoes.length ? (
            <RichBarList items={decisoes} color="var(--color-warning)" />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma decisão no filtro.</p>
          )}
        </RichTabPanel>
        <RichTabPanel
          title="Compras como ações"
          description="Tarefas de compra — não são contas a pagar"
        >
          {compras.length ? (
            <RichBarList
              items={compras.map((event) => ({
                label: event.title,
                value: event.estimatedCost ?? 0,
              }))}
              format={brl}
              color="var(--color-chart-1)"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma compra agendada.</p>
          )}
        </RichTabPanel>
      </div>
    </div>
  );
}
