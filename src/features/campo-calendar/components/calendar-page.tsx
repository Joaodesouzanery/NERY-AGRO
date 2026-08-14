// Shell do módulo Campo > Calendário: filtros globais persistidos na URL,
// 5 subabas consolidadas, formulário canônico de tarefa e fila offline. Estados
// de loading, vazio, erro e DEMO/REAL seguem o padrão das demais telas.
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, CloudOff, FilterX, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Segmented } from "@/components/segmented";
import { isSupabaseConfigured } from "@/lib/supabase-financial";
import { cn } from "@/lib/utils";
import {
  useCalendarModel,
  useCalendarMutations,
  useForecast,
  useOfflineSync,
} from "@/features/campo-calendar/hooks/use-campo-calendar";
import {
  applyFilters,
  computeCalendarAlerts,
  type CalendarFilters,
} from "@/features/campo-calendar/lib/derive";
import {
  calendarRoles,
  capabilitiesFor,
  capabilitiesForOrgRole,
  orgRoleLabels,
  getDemoRole,
  roleLabels,
  setDemoRole,
  type CalendarRole,
} from "@/features/campo-calendar/lib/capabilities";
import { useAuth } from "@/hooks/use-auth";
import {
  calendarTabs,
  type CalendarSearch,
  type CalendarTab,
} from "@/features/campo-calendar/schemas/navigation";
import {
  calendarPriorities,
  eventTypeLabels,
  calendarEventTypes,
  priorityLabels,
  type CalendarEvent,
} from "@/features/campo-calendar/types/domain";
import { EventFormDialog } from "@/features/campo-calendar/components/event-form-dialog";
import type { CalendarTabProps } from "@/features/campo-calendar/components/tab-props";
import { VisaoGeralTab } from "@/features/campo-calendar/components/tabs/visao-geral-tab";
import { CalendarioTab } from "@/features/campo-calendar/components/tabs/calendario-tab";
import { TarefasTab } from "@/features/campo-calendar/components/tabs/tarefas-tab";
import { ModelosTab } from "@/features/campo-calendar/components/tabs/modelos-tab";
import { RelatoriosTab } from "@/features/campo-calendar/components/tabs/relatorios-tab";

const tabConfig: Array<{ value: CalendarTab; label: string }> = [
  { value: "geral", label: "Visão Geral" },
  { value: "calendario", label: "Calendário" },
  { value: "tarefas", label: "Tarefas" },
  { value: "modelos", label: "Modelos" },
  { value: "relatorios", label: "Relatórios" },
];

export function CampoCalendarPage({
  search,
  onSearchChange,
}: {
  search: CalendarSearch;
  onSearchChange: (next: CalendarSearch) => void;
}) {
  const { model, isLoading, isError, error, refetch, demoMode } = useCalendarModel();
  const forecastQuery = useForecast(30);
  const mutations = useCalendarMutations();
  const offline = useOfflineSync();
  // Em DEMO o perfil é escolhido na tela (percorrer os fluxos sem trocar de
  // usuário); em REAL vem do vínculo do usuário com a empresa, e não há o que
  // escolher — um seletor ali era controle de permissão fingido em produção.
  const { role: orgRole } = useAuth();
  const [role, setRole] = useState<CalendarRole>(() => getDemoRole());
  const capabilities = demoMode ? capabilitiesFor(role) : capabilitiesForOrgRole(orgRole);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  // Filtros secundários abrem sozinhos quando um link compartilhado usa algum deles.
  const [moreFilters, setMoreFilters] = useState(() =>
    Boolean(search.cycleId || search.responsible || search.eventType || search.priority),
  );

  const now = useMemo(() => new Date(), []);
  const filters = useMemo<CalendarFilters>(
    () => ({
      fieldId: search.fieldId,
      seasonId: search.seasonId,
      cycleId: search.cycleId,
      status: search.status,
      responsible: search.responsible,
      eventType: search.eventType,
      priority: search.priority,
    }),
    [
      search.fieldId,
      search.seasonId,
      search.cycleId,
      search.status,
      search.responsible,
      search.eventType,
      search.priority,
    ],
  );

  const visibleEvents = useMemo(() => {
    if (!model) return [];
    // Visibilidade "gestor" some para papéis sem capacidade (demonstrativo).
    const byRole = capabilities.canViewDecisions
      ? model.events
      : model.events.filter((event) => event.visibility !== "gestor");
    return applyFilters(byRole, filters, now);
  }, [model, capabilities.canViewDecisions, filters, now]);

  const alerts = useMemo(
    () =>
      model
        ? computeCalendarAlerts(visibleEvents, model.cycles, forecastQuery.data ?? [], now)
        : [],
    [model, visibleEvents, forecastQuery.data, now],
  );

  const patchSearch = (patch: Partial<CalendarSearch>) => {
    onSearchChange({ ...search, ...patch });
  };

  const openCreate = (defaults?: { date?: string }) => {
    setEditing(null);
    setDuplicating(false);
    setDefaultDate(defaults?.date);
    setFormOpen(true);
  };
  const openEdit = (event: CalendarEvent) => {
    if (event.legacy) {
      toast.info("Registro legado (Campo › Calendário antigo) é somente leitura aqui.");
      return;
    }
    setEditing(event);
    setDuplicating(false);
    setFormOpen(true);
  };
  const openDuplicate = (event: CalendarEvent) => {
    setEditing(event);
    setDuplicating(true);
    setFormOpen(true);
  };

  const hasFilters = Boolean(
    search.fieldId ||
    search.seasonId ||
    search.cycleId ||
    search.status ||
    search.responsible ||
    search.eventType ||
    search.priority,
  );
  const hiddenFilterCount = [
    search.cycleId,
    search.responsible,
    search.eventType,
    search.priority,
  ].filter(Boolean).length;

  const selectClass =
    "h-9 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40";

  return (
    <div className="mx-auto max-w-[1600px] px-8 py-6 max-md:px-4">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/campo"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Campo
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Visão geral da fazenda ativa com tarefas, ciclos, compras como ações
            {demoMode ? ", alertas climáticos" : ""} e decisões — integrado ao Talhão 360.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {offline.pending > 0 && (
            <button
              onClick={() => void offline.sync()}
              disabled={offline.syncing}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-3 text-xs font-medium text-warning hover:bg-warning/15 disabled:opacity-60"
              title="Alterações aguardando conexão com o Supabase"
            >
              <CloudOff className="h-3.5 w-3.5" />
              {offline.pending} pendente(s) · sincronizar
            </button>
          )}
          {demoMode ? (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Perfil (demo):
              <select
                value={role}
                onChange={(event) => {
                  const next = event.target.value as CalendarRole;
                  setRole(next);
                  setDemoRole(next);
                }}
                className={selectClass}
                aria-label="Perfil demonstrativo"
              >
                {calendarRoles.map((option) => (
                  <option key={option} value={option}>
                    {roleLabels[option]}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span
              className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground"
              title="Definido pelo seu vínculo com a empresa"
            >
              {orgRoleLabels[orgRole ?? ""] ?? "Sem vínculo"}
            </span>
          )}
          <div className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">
            {demoMode ? "DEMO" : "REAL"}
          </div>
          <button
            onClick={() => openCreate()}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova tarefa
          </button>
        </div>
      </div>

      {!demoMode && !isSupabaseConfigured && (
        <div className="mb-5 rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para salvar tarefas reais no
          Calendário.
        </div>
      )}

      {isLoading && (
        <div className="space-y-3" aria-busy>
          <div className="h-24 animate-pulse rounded-md border border-border bg-card" />
          <div className="h-64 animate-pulse rounded-md border border-border bg-card" />
        </div>
      )}

      {isError && !isLoading && (
        <EmptyState
          title="Não foi possível carregar o Calendário"
          description={error instanceof Error ? error.message : "Erro inesperado."}
          icon={CloudOff}
          action={
            <button
              onClick={() => void refetch()}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      )}

      {model && !isLoading && !isError && (
        <>
          {/* Filtros globais — valem para todas as subabas e persistem na URL.
              Talhão/safra/status ficam visíveis; o resto recolhe em "Mais filtros". */}
          <div className="mb-4 rounded-md border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={search.fieldId ?? ""}
                onChange={(event) =>
                  patchSearch({ fieldId: event.target.value || undefined, cycleId: undefined })
                }
                className={selectClass}
                aria-label="Filtrar por talhão"
              >
                <option value="">Todos os talhões</option>
                {model.talhoes.map((talhao) => (
                  <option key={talhao.id} value={talhao.id}>
                    {talhao.nome}
                  </option>
                ))}
              </select>
              <select
                value={search.seasonId ?? ""}
                onChange={(event) => patchSearch({ seasonId: event.target.value || undefined })}
                className={selectClass}
                aria-label="Filtrar por safra"
              >
                <option value="">Todas as safras</option>
                {model.safras.map((safra) => (
                  <option key={safra} value={safra}>
                    {safra}
                  </option>
                ))}
              </select>
              <select
                value={search.status ?? ""}
                onChange={(event) => patchSearch({ status: event.target.value || undefined })}
                className={selectClass}
                aria-label="Filtrar por status"
              >
                <option value="">Todos os status</option>
                {model.statuses
                  .filter((status) => status.active)
                  .map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => setMoreFilters((value) => !value)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronRight
                  className={cn("h-3.5 w-3.5 transition-transform", moreFilters && "rotate-90")}
                />
                Mais filtros{hiddenFilterCount > 0 ? ` (${hiddenFilterCount})` : ""}
              </button>
              {hasFilters && (
                <button
                  onClick={() =>
                    patchSearch({
                      fieldId: undefined,
                      seasonId: undefined,
                      cycleId: undefined,
                      status: undefined,
                      responsible: undefined,
                      eventType: undefined,
                      priority: undefined,
                    })
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <FilterX className="h-3.5 w-3.5" />
                  Limpar filtros
                </button>
              )}
            </div>
            {moreFilters && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border pt-2.5">
                <select
                  value={search.cycleId ?? ""}
                  onChange={(event) => patchSearch({ cycleId: event.target.value || undefined })}
                  className={selectClass}
                  aria-label="Filtrar por ciclo"
                >
                  <option value="">Todos os ciclos</option>
                  {model.cycles
                    .filter((cycle) => !search.fieldId || cycle.talhaoId === search.fieldId)
                    .map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.nome} · {cycle.talhaoName}
                      </option>
                    ))}
                </select>
                <select
                  value={search.responsible ?? ""}
                  onChange={(event) =>
                    patchSearch({ responsible: event.target.value || undefined })
                  }
                  className={selectClass}
                  aria-label="Filtrar por responsável"
                >
                  <option value="">Todos os responsáveis</option>
                  {model.responsaveis.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={search.eventType ?? ""}
                  onChange={(event) => patchSearch({ eventType: event.target.value || undefined })}
                  className={selectClass}
                  aria-label="Filtrar por tipo"
                >
                  <option value="">Todos os tipos</option>
                  {calendarEventTypes.map((type) => (
                    <option key={type} value={type}>
                      {eventTypeLabels[type]}
                    </option>
                  ))}
                </select>
                <select
                  value={search.priority ?? ""}
                  onChange={(event) => patchSearch({ priority: event.target.value || undefined })}
                  className={selectClass}
                  aria-label="Filtrar por prioridade"
                >
                  <option value="">Todas as prioridades</option>
                  {calendarPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priorityLabels[priority]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <nav className="mb-5">
            <Segmented
              aria-label="Subabas do Calendário"
              value={calendarTabs.includes(search.tab) ? search.tab : "geral"}
              onChange={(tab) => patchSearch({ tab })}
              options={tabConfig}
            />
          </nav>

          <TabContent
            tab={calendarTabs.includes(search.tab) ? search.tab : "geral"}
            tabProps={{
              model,
              events: visibleEvents,
              allEvents: model.events,
              filters,
              alerts,
              forecast: forecastQuery.data ?? [],
              now,
              demoMode,
              capabilities,
              search,
              patchSearch,
              onCreate: openCreate,
              onEdit: openEdit,
              onDuplicate: openDuplicate,
              mutations,
            }}
          />

          <EventFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            model={model}
            editing={editing}
            duplicating={duplicating}
            defaultDate={defaultDate}
            pending={mutations.saveEvent.isPending}
            onSubmit={({ id, event }) =>
              mutations.saveEvent.mutate(
                { id, event, baseUpdatedAt: editing?.updatedAt },
                {
                  onSuccess: () => {
                    toast.success(id ? "Tarefa atualizada." : "Tarefa criada.");
                    setFormOpen(false);
                  },
                },
              )
            }
          />
        </>
      )}
    </div>
  );
}

function TabContent({ tab, tabProps }: { tab: CalendarTab; tabProps: CalendarTabProps }) {
  switch (tab) {
    case "calendario":
      return <CalendarioTab {...tabProps} />;
    case "tarefas":
      return <TarefasTab {...tabProps} />;
    case "modelos":
      return <ModelosTab {...tabProps} />;
    case "relatorios":
      return <RelatoriosTab {...tabProps} />;
    default:
      return <VisaoGeralTab {...tabProps} />;
  }
}
