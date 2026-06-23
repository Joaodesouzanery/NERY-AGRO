import { createFileRoute } from "@tanstack/react-router";
import { Field360Page } from "@/features/talhao-360/components/field-360-page";
import { field360SearchSchema } from "@/features/talhao-360/schemas/navigation";

export const Route = createFileRoute("/campo_/talhoes_/$fieldId")({
  validateSearch: (search) => field360SearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Talhão 360° - Nery Agro" },
      {
        name: "description",
        content: "Contexto agronômico, operacional e estratégico do talhão.",
      },
    ],
  }),
  component: Field360Route,
});

function Field360Route() {
  const { fieldId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <Field360Page
      fieldId={fieldId}
      search={search}
      onSearchChange={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
