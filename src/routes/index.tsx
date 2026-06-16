import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nery Agro - Gestão agro em tempo real" },
      {
        name: "description",
        content:
          "Plataforma de gestão agro que conecta campo, pecuária, logística, financeiro e sustentabilidade em tempo real.",
      },
    ],
  }),
  component: LandingPage,
});
