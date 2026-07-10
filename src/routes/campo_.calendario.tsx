import { createFileRoute } from "@tanstack/react-router";
import { CampoCalendarPage } from "@/features/campo-calendar/components/calendar-page";
import { calendarSearchSchema } from "@/features/campo-calendar/schemas/navigation";

export const Route = createFileRoute("/campo_/calendario")({
  validateSearch: (search) => calendarSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Calendário de Campo - AgroTorre" },
      {
        name: "description",
        content:
          "Calendário operacional da fazenda: tarefas, ciclos, decisões, compras como ações e alertas integrados ao Talhão 360.",
      },
    ],
  }),
  component: CampoCalendarioRoute,
});

function CampoCalendarioRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <CampoCalendarPage
      search={search}
      onSearchChange={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
