import { createFileRoute } from "@tanstack/react-router";
import { LandingStatic } from "@/components/landing/landing-static";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nery Agro — Torre de Controle do campo ao financeiro" },
      {
        name: "description",
        content:
          "Gestão agro em tempo real: campo, pecuária, logística, financeiro e sustentabilidade numa única torre de controle, com KPIs, alertas e mapa operacional.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
      // CSS da landing — carrega depois do appCss (vence em conflito) só na home.
      { rel: "stylesheet", href: "/css/styles.css" },
    ],
  }),
  component: LandingStatic,
});
