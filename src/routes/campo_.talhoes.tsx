import { createFileRoute } from "@tanstack/react-router";
import { TalhoesPage } from "@/features/talhao-360/components/talhoes-page";
import { talhoesSearchSchema } from "@/features/talhao-360/schemas/navigation";

export const Route = createFileRoute("/campo_/talhoes")({
  validateSearch: (search) => talhoesSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Talhões - Nery Agro" },
      { name: "description", content: "Mapa da fazenda e centro de controle dos talhões." },
    ],
  }),
  component: TalhoesRoute,
});

function TalhoesRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <TalhoesPage
      search={search}
      onSearchChange={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
