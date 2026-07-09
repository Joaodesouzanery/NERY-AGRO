import { createFileRoute } from "@tanstack/react-router";
import { ModoCurral } from "@/features/pecuaria/components/modo-curral";

export const Route = createFileRoute("/pecuaria_/curral")({
  head: () => ({
    meta: [{ title: "Modo Curral - AgroTorre" }],
  }),
  component: ModoCurral,
});
