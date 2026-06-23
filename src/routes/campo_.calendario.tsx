import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/features/campo-calendar";
import { calendarSearchSchema } from "@/features/campo-calendar/schemas/navigation";

export const Route = createFileRoute("/campo_/calendario")({
  validateSearch: (search) => calendarSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Calendário de Campo - Nery Agro" },
      {
        name: "description",
        content: "Agenda operacional, tarefas, decisões e ciclos da produção agrícola.",
      },
    ],
  }),
  component: CalendarRoute,
});

function CalendarRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <CalendarPage
      search={search}
      onSearchChange={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
