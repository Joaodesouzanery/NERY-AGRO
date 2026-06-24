import { createFileRoute } from "@tanstack/react-router";
import { RdcDetailPage } from "@/features/rdc/components/rdc-detail-page";

export const Route = createFileRoute("/rdc_/$id")({
  head: () => ({
    meta: [
      { title: "RDC — Ficha · Nery Agro" },
      { name: "description", content: "Ficha do Relatório Diário de Campo." },
    ],
  }),
  component: RdcDetailRoute,
});

function RdcDetailRoute() {
  const { id } = Route.useParams();
  return <RdcDetailPage rdcId={id} />;
}
