/* eslint-disable react-refresh/only-export-components */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AgroMap } from "@/components/agro-map";
import type { MapPoint, MapRoute } from "@/components/carto-map";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { listOperationRecordsByArea } from "@/lib/supabase-operations";

type RawRecord = {
  id: string;
  module: string;
  area: string;
  payload: Record<string, string>;
};

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function statusTone(status?: string): MapPoint["tone"] {
  const s = (status ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  if (s.includes("entregue") || s.includes("conclu")) return "success";
  if (s.includes("atras") || s.includes("critic")) return "danger";
  if (s.includes("aten") || s.includes("aguard") || s.includes("carreg")) return "warning";
  if (s.includes("transito") || s.includes("rota")) return "primary";
  return "neutral";
}

const demoRecords: RawRecord[] = [
  {
    id: "c1",
    area: "logistica",
    module: "cargas",
    payload: {
      codigo: "#100512-SP",
      origem: "Curitiba, PR",
      destino: "São Paulo, SP",
      origem_lat: "-25.43",
      origem_lng: "-49.27",
      destino_lat: "-23.55",
      destino_lng: "-46.63",
      status: "Em trânsito",
      motorista: "João Pereira",
      placa: "NER-2A45",
      eta: "14:40",
    },
  },
  {
    id: "c2",
    area: "logistica",
    module: "cargas",
    payload: {
      codigo: "#170845-RJ",
      origem: "São Paulo, SP",
      destino: "Rio de Janeiro, RJ",
      origem_lat: "-23.55",
      origem_lng: "-46.63",
      destino_lat: "-22.91",
      destino_lng: "-43.17",
      status: "Em trânsito",
      motorista: "Carla Souza",
      placa: "NER-9R21",
      eta: "18:10",
    },
  },
  {
    id: "c3",
    area: "logistica",
    module: "cargas",
    payload: {
      codigo: "#220915-DF",
      origem: "Goiânia, GO",
      destino: "Brasília, DF",
      origem_lat: "-16.68",
      origem_lng: "-49.25",
      destino_lat: "-15.78",
      destino_lng: "-47.93",
      status: "Entregue",
      motorista: "Marcos Lima",
      placa: "NER-4D88",
      eta: "Concluído",
    },
  },
  {
    id: "c4",
    area: "logistica",
    module: "cargas",
    payload: {
      codigo: "#330217-RS",
      origem: "Florianópolis, SC",
      destino: "Porto Alegre, RS",
      origem_lat: "-27.59",
      origem_lng: "-48.55",
      destino_lat: "-30.03",
      destino_lng: "-51.23",
      status: "Atrasado",
      motorista: "Ana Ribeiro",
      placa: "NER-7P30",
      eta: "+2h",
    },
  },
  {
    id: "b1",
    area: "logistica",
    module: "bases",
    payload: {
      nome: "Base Central - SP",
      lat: "-23.55",
      lng: "-46.63",
      tipo: "Matriz",
      responsavel: "Operação Sudeste",
    },
  },
  {
    id: "b2",
    area: "logistica",
    module: "bases",
    payload: {
      nome: "CD Nordeste - Recife",
      lat: "-8.05",
      lng: "-34.88",
      tipo: "Centro de Distribuição",
      responsavel: "Operação Nordeste",
    },
  },
];

async function fetchLogistics(): Promise<RawRecord[]> {
  return listOperationRecordsByArea("logistica");
}

export function useTrackingData() {
  const { demoMode } = useDemoMode();
  const query = useQuery({
    queryKey: ["operation-records", "logistica", "all"],
    queryFn: fetchLogistics,
    enabled: !demoMode,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const records = demoMode ? demoRecords : (query.data ?? []);
  const cargas = records.filter((r) => r.module === "cargas");
  const motoristas = records.filter((r) => r.module === "motoristas");
  const bases = records.filter((r) => r.module === "bases");
  const frota = records.filter((r) => r.module === "frota");
  const rotas = records.filter((r) => r.module === "rotas" || r.module === "roteirizacao");

  const points: MapPoint[] = [];
  const routes: MapRoute[] = [];

  cargas.forEach((c) => {
    const oLat = num(c.payload.origem_lat);
    const oLng = num(c.payload.origem_lng);
    const dLat = num(c.payload.destino_lat);
    const dLng = num(c.payload.destino_lng);
    const tone = statusTone(c.payload.status);
    const sharedMeta = {
      origem: c.payload.origem,
      destino: c.payload.destino,
      motorista: c.payload.motorista,
      placa: c.payload.placa,
      ETA: c.payload.eta,
      status: c.payload.status,
    };
    if (oLat !== undefined && oLng !== undefined) {
      points.push({
        id: `o-${c.id}`,
        label: c.payload.codigo || "Carga",
        caption: `Origem - ${c.payload.origem ?? ""}`,
        lat: oLat,
        lng: oLng,
        tone: "info",
        meta: { tipo: "Origem", ...sharedMeta },
      });
    }
    if (dLat !== undefined && dLng !== undefined) {
      points.push({
        id: `d-${c.id}`,
        label: c.payload.codigo || "Carga",
        caption: `${c.payload.status ?? ""} - ${c.payload.destino ?? ""}`,
        lat: dLat,
        lng: dLng,
        tone,
        meta: { tipo: "Destino", ...sharedMeta },
      });
    }
    if (oLat !== undefined && oLng !== undefined && dLat !== undefined && dLng !== undefined) {
      routes.push({
        id: `r-${c.id}`,
        label: c.payload.codigo || "Rota da carga",
        tone,
        status: c.payload.status,
        description: `${c.payload.origem ?? ""} -> ${c.payload.destino ?? ""}`,
        meta: sharedMeta,
        points: [
          { lat: oLat, lng: oLng },
          { lat: dLat, lng: dLng },
        ],
      });
    }
  });

  motoristas.forEach((m) => {
    const lat = num(m.payload.atual_lat);
    const lng = num(m.payload.atual_lng);
    if (lat !== undefined && lng !== undefined) {
      points.push({
        id: `m-${m.id}`,
        label: m.payload.nome || "Motorista",
        caption: m.payload.status,
        lat,
        lng,
        tone: statusTone(m.payload.status),
        meta: {
          status: m.payload.status,
          telefone: m.payload.telefone,
          veiculo: m.payload.veiculo,
          rota: m.payload.rota,
        },
      });
    }
  });

  frota.forEach((f) => {
    const lat = num(f.payload.atual_lat);
    const lng = num(f.payload.atual_lng);
    if (lat !== undefined && lng !== undefined) {
      points.push({
        id: `f-${f.id}`,
        label: f.payload.placa || f.payload.nome || "Veículo",
        caption: f.payload.status,
        lat,
        lng,
        tone: statusTone(f.payload.status),
        meta: {
          status: f.payload.status,
          placa: f.payload.placa,
          motorista: f.payload.motorista,
          tipo: f.payload.tipo,
        },
      });
    }
  });

  bases.forEach((b) => {
    const lat = num(b.payload.lat);
    const lng = num(b.payload.lng);
    if (lat !== undefined && lng !== undefined) {
      points.push({
        id: `b-${b.id}`,
        label: b.payload.nome || "Base",
        caption: b.payload.tipo,
        lat,
        lng,
        tone: "info",
        meta: {
          tipo: b.payload.tipo,
          endereco: b.payload.endereco,
          responsavel: b.payload.responsavel,
        },
      });
    }
  });

  rotas.forEach((route) => {
    const oLat = num(route.payload.origem_lat);
    const oLng = num(route.payload.origem_lng);
    const dLat = num(route.payload.destino_lat);
    const dLng = num(route.payload.destino_lng);
    if (oLat !== undefined && oLng !== undefined && dLat !== undefined && dLng !== undefined) {
      const tone = statusTone(route.payload.status);
      points.push({
        id: `ro-${route.id}`,
        label: route.payload.nome || "Rota",
        caption: `Origem - ${route.payload.origem ?? ""}`,
        lat: oLat,
        lng: oLng,
        tone: "info",
        meta: {
          tipo: "Origem",
          origem: route.payload.origem,
          destino: route.payload.destino,
          status: route.payload.status,
        },
      });
      points.push({
        id: `rd-${route.id}`,
        label: route.payload.nome || "Rota",
        caption: `Destino - ${route.payload.destino ?? ""}`,
        lat: dLat,
        lng: dLng,
        tone,
        meta: {
          tipo: "Destino",
          origem: route.payload.origem,
          destino: route.payload.destino,
          status: route.payload.status,
        },
      });
      routes.push({
        id: `rr-${route.id}`,
        label: route.payload.nome || "Rota",
        tone,
        status: route.payload.status,
        description: `${route.payload.origem ?? ""} -> ${route.payload.destino ?? ""}`,
        points: [
          { lat: oLat, lng: oLng },
          { lat: dLat, lng: dLng },
        ],
      });
    }
  });

  const stats = useMemo(() => {
    const trans = cargas.filter((c) =>
      (c.payload.status ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .includes("transito"),
    ).length;
    const entregues = cargas.filter((c) =>
      (c.payload.status ?? "").toLowerCase().includes("entregue"),
    ).length;
    const atrasadas = cargas.filter((c) =>
      (c.payload.status ?? "").toLowerCase().includes("atras"),
    ).length;
    return { trans, entregues, atrasadas, total: cargas.length };
  }, [cargas]);

  const moduleVolume = useMemo(() => {
    const counts = { cargas, motoristas, bases, frota, rotas };
    return Object.entries(counts).map(([label, list]) => ({
      label: label[0].toUpperCase() + label.slice(1),
      valor: list.length,
    }));
  }, [cargas, motoristas, bases, frota, rotas]);

  return { points, routes, stats, moduleVolume, loading: !demoMode && query.isLoading };
}

export function TrackingMap({
  height = "h-[520px]",
  title = "Mapa de Rastreamento",
  subtitle = "Cargas, motoristas e bases ao vivo da operação AgroTorre.",
}: {
  height?: string;
  title?: string;
  subtitle?: string;
}) {
  const { points, routes, stats, loading } = useTrackingData();
  const mapStats = [
    { label: "Em trânsito", value: stats.trans, tone: "primary" as const },
    { label: "Entregues", value: stats.entregues, tone: "success" as const },
    { label: "Atrasadas", value: stats.atrasadas, tone: "danger" as const },
    { label: "Total de cargas", value: stats.total, tone: "neutral" as const },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          {loading ? "Carregando..." : "Ao vivo"}
        </span>
      </div>
      <div className="px-5 pb-5">
        <AgroMap
          points={points}
          routes={routes}
          stats={mapStats}
          className={height}
          title="Rastreamento logístico"
          subtitle="Cargas, rotas, motoristas, frota e bases com detalhes por clique."
        />
      </div>
    </section>
  );
}
