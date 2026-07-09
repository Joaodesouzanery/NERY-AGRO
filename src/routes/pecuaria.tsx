import { createFileRoute } from "@tanstack/react-router";
import { PecuariaPage } from "@/features/pecuaria/components/pecuaria-page";

export const Route = createFileRoute("/pecuaria")({
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
  component: PecuariaPage,
});
