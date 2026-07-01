import { createFileRoute } from "@tanstack/react-router";
import { RdcListPage } from "@/features/rdc/components/rdc-list-page";

export const Route = createFileRoute("/rdc")({
  head: () => ({
    meta: [
      { title: "RDC — Diário de Campo · AgroTorre" },
      {
        name: "description",
        content:
          "Relatório Diário de Campo — registre atividades, pecuária, observações e fotos do dia e exporte em PDF.",
      },
    ],
  }),
  component: RdcListPage,
});
