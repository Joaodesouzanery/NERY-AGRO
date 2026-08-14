import { createFileRoute } from "@tanstack/react-router";
import { ColheitaPage } from "@/features/remessa/components/colheita-page";

export const Route = createFileRoute("/campo_/colheita")({
  head: () => ({
    meta: [
      { title: "Lançamentos de colheita - AgroTorre" },
      {
        name: "description",
        content:
          "Corte, carregamento e diárias da colheita, com fechamento de pagamento por período.",
      },
    ],
  }),
  component: ColheitaPage,
});
