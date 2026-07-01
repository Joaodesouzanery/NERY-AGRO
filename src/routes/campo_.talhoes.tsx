import { createFileRoute } from "@tanstack/react-router";
import { FieldsPage } from "@/features/talhao-360/components/fields-page";

export const Route = createFileRoute("/campo_/talhoes")({
  head: () => ({
    meta: [
      { title: "Talhões - AgroTorre" },
      { name: "description", content: "Seleção de talhões e acesso ao Talhão 360°." },
    ],
  }),
  component: FieldsPage,
});
