import { Factory } from "lucide-react";
import { useConnectedAgroData } from "@/lib/connected-agro-data";
import { buildCarbonMetrics, carbonByCategoria } from "@/lib/carbon-emissions-metrics";
import { talhaoMatches } from "@/features/talhao-360/lib/talhao-match";
import { RichBarList, RichTabKpis } from "@/components/rich-tab";

// Emissões (tCO₂e) atribuídas a este talhão. Casa o `talhao` (texto livre) dos
// apontamentos de carbono com o nome/número do talhão. Só aparece quando a
// empresa já registra carbono — senão fica oculto para não poluir o 360.
function fmtT(kg: number) {
  return `${(kg / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} t`;
}

export function CarbonByTalhaoPanel({ talhaoNome }: { talhaoNome: string }) {
  const { snapshot } = useConnectedAgroData();
  const allCarbon = snapshot.operations.filter(
    (item) => item.area === "sustentabilidade" && item.module === "carbono",
  );
  if (allCarbon.length === 0) return null; // empresa não usa Emissão de Carbono

  const matched = allCarbon.filter((item) => talhaoMatches(item.payload.talhao ?? "", talhaoNome));
  const metrics = buildCarbonMetrics(matched);
  const categorias = carbonByCategoria(matched).map((c) => ({ label: c.label, value: c.co2e }));

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <Factory className="h-4 w-4 text-primary" />
        Emissões de carbono do talhão
      </h2>
      {matched.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum apontamento de carbono vinculado a este talhão ainda. Registre em Emissão de
          Carbono informando o talhão.
        </p>
      ) : (
        <div className="space-y-4">
          <RichTabKpis
            kpis={[
              {
                label: "Pegada total",
                value: `${metrics.totalT.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} tCO₂e`,
                icon: Factory,
              },
              { label: "Escopo 1", value: fmtT(metrics.scope1) },
              { label: "Escopo 2", value: fmtT(metrics.scope2) },
              { label: "Escopo 3", value: fmtT(metrics.scope3) },
            ]}
          />
          {categorias.length > 0 && (
            <RichBarList
              items={categorias}
              format={(v) =>
                `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} t`
              }
            />
          )}
        </div>
      )}
    </section>
  );
}
