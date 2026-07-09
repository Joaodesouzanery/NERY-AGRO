import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Layers,
  ShieldCheck,
  Sprout,
  Syringe,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnimais, useLotes } from "@/features/pecuaria/hooks/use-pecuaria";
import { VisaoGeralTab } from "@/features/pecuaria/components/tabs/visao-geral";
import { LotesTab } from "@/features/pecuaria/components/tabs/lotes";
import { ManejoTab } from "@/features/pecuaria/components/tabs/manejo";
import { RebanhoTab } from "@/features/pecuaria/components/tabs/rebanho";
import { PastosOcupacaoTab } from "@/features/pecuaria/components/tabs/pastos-ocupacao";
import { ResultadosTab } from "@/features/pecuaria/components/tabs/resultados";
import { RastreabilidadeTab } from "@/features/pecuaria/components/tabs/rastreabilidade";

type TabId =
  | "visao-geral"
  | "lotes"
  | "manejo"
  | "pastos"
  | "rebanho"
  | "resultados"
  | "rastreabilidade";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  { id: "lotes", label: "Lotes", icon: Layers },
  { id: "manejo", label: "Manejo", icon: Syringe },
  { id: "pastos", label: "Pastos & Ocupação", icon: Sprout },
  { id: "rebanho", label: "Rebanho", icon: Users },
  { id: "resultados", label: "Resultados", icon: TrendingUp },
  { id: "rastreabilidade", label: "Rastreabilidade", icon: ShieldCheck },
];

export function PecuariaPage() {
  const [tab, setTab] = useState<TabId>("visao-geral");
  const animaisQ = useAnimais();
  const lotesQ = useLotes();

  const cabecasAtivas = (animaisQ.data ?? []).filter((a) => a.status === "ativo").length;
  const lotesAtivos = (lotesQ.data ?? []).filter((l) => !l.encerrado_em).length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pecuária</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cabecasAtivas.toLocaleString("pt-BR")} cabeças ativas ·{" "}
            {lotesAtivos.toLocaleString("pt-BR")} lotes ativos
          </p>
        </div>
        <Link
          to="/pecuaria/curral"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Zap className="h-4 w-4" />
          Modo Curral
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "min-h-16 rounded-lg border p-3 text-left text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="flex items-start gap-2">
                <t.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="line-clamp-2 leading-snug">{t.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {tab === "visao-geral" && <VisaoGeralTab />}
      {tab === "lotes" && <LotesTab />}
      {tab === "manejo" && <ManejoTab />}
      {tab === "rebanho" && <RebanhoTab />}
      {tab === "pastos" && <PastosOcupacaoTab />}
      {tab === "resultados" && <ResultadosTab />}
      {tab === "rastreabilidade" && <RastreabilidadeTab />}
    </div>
  );
}
