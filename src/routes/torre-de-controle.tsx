import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, LayoutDashboard, ListChecks, Map as MapIcon } from "lucide-react";
import { UnifiedMapPage } from "@/components/unified-map-page";
import { ControlTowerPage } from "@/components/control-tower-page";
import { buildControlTowerModel, useConnectedAgroData } from "@/lib/connected-agro-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/torre-de-controle")({
  head: () => ({
    meta: [
      { title: "Torre de Controle - AgroTorre" },
      {
        name: "description",
        content:
          "Mapa global, painel executivo (OTIF, vendas, capacidade) e fila de ações priorizada da fazenda.",
      },
    ],
  }),
  component: TorreDeControle,
});

const TABS = [
  { id: "mapa", label: "Mapa operacional", icon: MapIcon },
  { id: "painel", label: "Painel executivo", icon: LayoutDashboard },
  { id: "acoes", label: "Fila de ações", icon: ListChecks },
] as const;

type TorreTab = (typeof TABS)[number]["id"];

function TorreDeControle() {
  const [tab, setTab] = useState<TorreTab>("mapa");

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col md:h-svh">
      <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-card px-2">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "mapa" && <UnifiedMapPage heightClassName="h-full" />}
        {tab === "painel" && <ControlTowerPage />}
        {tab === "acoes" && <ActionsView />}
      </div>
    </div>
  );
}

// Origem do alerta (prefixo de `source`) → rota do módulo dono.
const sourceRoute: Record<string, string> = {
  logistica: "/logistica",
  financeiro: "/financeiro",
  campo: "/campo",
  pecuaria: "/pecuaria",
  cogs: "/otimizacao-cogs",
  sustentabilidade: "/sustentabilidade",
  inteligencia: "/inteligencia",
};

const ACTION_COLUMNS = [
  { key: "danger", label: "Crítico", tone: "border-destructive/30 bg-destructive/5" },
  { key: "warning", label: "Atenção", tone: "border-warning/30 bg-warning/5" },
  { key: "info", label: "Informativo", tone: "border-border bg-background/60" },
] as const;

function ActionsView() {
  const { snapshot, loading } = useConnectedAgroData();
  const model = useMemo(() => buildControlTowerModel(snapshot), [snapshot]);

  const bySeverity = (key: string) =>
    model.alerts.filter((a) =>
      key === "info" ? a.severity !== "danger" && a.severity !== "warning" : a.severity === key,
    );

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-8 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fila de ações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alertas de todos os módulos viram ações priorizadas — resolva antes de virar custo.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {ACTION_COLUMNS.map((col) => {
          const items = bySeverity(col.key);
          return (
            <section key={col.key} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((a) => {
                  const prefix = a.source.split("/")[0]?.toLowerCase() ?? "";
                  const href = sourceRoute[prefix];
                  return (
                    <div key={a.id} className={cn("rounded-lg border p-3", col.tone)}>
                      <div className="text-sm font-medium">{a.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{a.description}</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {a.source}
                        </span>
                        {href && (
                          <a
                            href={href}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Ir para origem <ArrowRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    {loading ? "Sincronizando..." : "Nada aqui."}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
