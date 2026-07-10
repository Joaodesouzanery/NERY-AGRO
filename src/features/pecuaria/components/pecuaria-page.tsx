import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { Segmented } from "@/components/segmented";
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

const TABS: { value: TabId; label: string }[] = [
  { value: "visao-geral", label: "Visão Geral" },
  { value: "lotes", label: "Lotes" },
  { value: "manejo", label: "Manejo" },
  { value: "pastos", label: "Pastos" },
  { value: "rebanho", label: "Rebanho" },
  { value: "resultados", label: "Resultados" },
  { value: "rastreabilidade", label: "Rastreab." },
];

export function PecuariaPage() {
  const [tab, setTab] = useState<TabId>("visao-geral");
  const animaisQ = useAnimais();
  const lotesQ = useLotes();

  const cabecasAtivas = (animaisQ.data ?? []).filter((a) => a.status === "ativo").length;
  const lotesAtivos = (lotesQ.data ?? []).filter((l) => !l.encerrado_em).length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-8 py-6">
      <div className="rounded-md border border-border bg-sidebar px-6 py-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-lg font-semibold">Pecuária</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {cabecasAtivas.toLocaleString("pt-BR")} cabeças ativas ·{" "}
              {lotesAtivos.toLocaleString("pt-BR")} lotes ativos
            </p>
          </div>
          <Link
            to="/pecuaria/curral"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Zap className="h-4 w-4" />
            Modo Curral
          </Link>
        </div>
      </div>

      <Segmented aria-label="Abas da Pecuária" value={tab} onChange={setTab} options={TABS} />

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
