import { createFileRoute } from "@tanstack/react-router";
import { InsumosPage } from "@/features/insumos/components/insumos-page";

export const Route = createFileRoute("/campo_/insumos")({
  head: () => ({
    meta: [
      { title: "Insumos - AgroTorre" },
      {
        name: "description",
        content: "Estoque, lotes, validade, reservas e custo de insumos da fazenda ativa.",
      },
    ],
  }),
  component: InsumosPage,
});
