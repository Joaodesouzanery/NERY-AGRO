import { createFileRoute } from "@tanstack/react-router";
import { ControlTowerPage } from "@/components/control-tower-page";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Torre de Controle - AgroTorre" },
      {
        name: "description",
        content:
          "Visão consolidada da operação, logística, campo, financeiro, pecuária, sustentabilidade, inteligência e COGS.",
      },
    ],
  }),
  component: ControlTowerPage,
});
