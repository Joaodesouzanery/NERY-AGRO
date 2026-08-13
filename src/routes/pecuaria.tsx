import { createFileRoute } from "@tanstack/react-router";
import { PecuariaPage } from "@/features/pecuaria/components/pecuaria-page";
import { pecuariaSearchSchema } from "@/features/pecuaria/schemas/navigation";

export const Route = createFileRoute("/pecuaria")({
  validateSearch: (search) => pecuariaSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Pecuária - AgroTorre" },
      {
        name: "description",
        content:
          "Rebanho, lotes, sanidade com carência, ocupação de pasto, custo por arroba, reprodução e rastreabilidade (SISBOV, PNIB, EUDR).",
      },
    ],
  }),
  component: PecuariaRoute,
});

function PecuariaRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <PecuariaPage
      tab={search.tab}
      onTabChange={(tab) => void navigate({ search: { tab }, replace: true })}
    />
  );
}
