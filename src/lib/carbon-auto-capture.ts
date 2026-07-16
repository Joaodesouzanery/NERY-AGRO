import type { OperationRecord } from "@/lib/supabase-operations";
import { findCarbonFactor } from "@/lib/carbon-emissions-metrics";

// Captura automática de emissões: lê a operação que já existe (rebanho, cargas,
// fretes) e propõe registros de carbono prontos — o fazendeiro confere e salva
// (nada é gravado sem confirmação). Determinístico, sem IA. Premissas explícitas
// e editáveis. Pura (sem React/Supabase): testável.

function num(value: unknown): number {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// Distância aproximada (km) entre dois pontos — Haversine.
function distanciaKm(aLng: number, aLat: number, bLng: number, bLat: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export type CarbonSuggestion = {
  id: string;
  fonte: string; // de onde veio (Pecuária, Cargas, Fretes)
  atividade: string;
  categoria: string;
  escopo: "1" | "2" | "3";
  volume: number;
  unidade: string;
  fator: number;
  co2e: number; // kg CO₂e
  premissa: string; // explica a estimativa (o usuário pode ajustar antes de salvar)
};

export type AutoCaptureOptions = {
  dieselLPerKm?: number; // consumo assumido da frota (L/km)
  herdCategoria?: string; // qual fator de rebanho usar
};

const round = (v: number) => Math.round(v * 10) / 10;

/**
 * Propõe emissões a partir do snapshot. Cobre o que dá para derivar com segurança:
 * rebanho (metano entérico), frete das cargas (t·km via coords) e diesel dos fretes
 * (km × consumo). Maquinário/energia ficam de fora enquanto não houver o dado físico.
 */
export function buildCarbonSuggestions(
  input: { operations: OperationRecord[]; pecuariaCabecas: number },
  opts: AutoCaptureOptions = {},
): CarbonSuggestion[] {
  const out: CarbonSuggestion[] = [];

  // 1) Rebanho → metano entérico (por cabeça·ano)
  const herd = findCarbonFactor(opts.herdCategoria ?? "Bovino corte (metano entérico)");
  if (input.pecuariaCabecas > 0 && herd) {
    const co2e = input.pecuariaCabecas * herd.fator;
    out.push({
      id: "pec-enterico",
      fonte: "Pecuária",
      atividade: "Rebanho ativo — metano entérico (estimativa anual)",
      categoria: herd.categoria,
      escopo: herd.escopo,
      volume: input.pecuariaCabecas,
      unidade: herd.unidade,
      fator: herd.fator,
      co2e: round(co2e),
      premissa: `${input.pecuariaCabecas} cabeças × ${herd.fator} kg CO₂e/cabeça·ano`,
    });
  }

  // 2) Cargas → frete (t·km) usando peso × distância pelas coordenadas
  const frete = findCarbonFactor("Transporte (frete)");
  if (frete) {
    let tkm = 0;
    for (const c of input.operations) {
      if (c.area !== "logistica" || c.module !== "cargas") continue;
      const pesoT = num(c.payload.peso) / 1000;
      const d = distanciaKm(
        num(c.payload.origem_lng),
        num(c.payload.origem_lat),
        num(c.payload.destino_lng),
        num(c.payload.destino_lat),
      );
      if (pesoT > 0 && d > 0) tkm += pesoT * d;
    }
    if (tkm > 0) {
      out.push({
        id: "cargas-frete",
        fonte: "Cargas",
        atividade: "Frete das cargas (peso × distância)",
        categoria: frete.categoria,
        escopo: frete.escopo,
        volume: round(tkm),
        unidade: frete.unidade,
        fator: frete.fator,
        co2e: round(tkm * frete.fator),
        premissa: "peso × distância (coordenadas) somados de todas as cargas",
      });
    }
  }

  // 3) Fretes → diesel (km × consumo assumido)
  const diesel = findCarbonFactor("Diesel");
  const dieselLPerKm = opts.dieselLPerKm ?? 0.35;
  if (diesel) {
    let litros = 0;
    for (const f of input.operations) {
      if (f.area !== "logistica" || f.module !== "fretes") continue;
      const km = num(f.payload.km);
      if (km > 0) litros += km * dieselLPerKm;
    }
    if (litros > 0) {
      out.push({
        id: "fretes-diesel",
        fonte: "Fretes",
        atividade: "Diesel da frota (fretes)",
        categoria: diesel.categoria,
        escopo: diesel.escopo,
        volume: round(litros),
        unidade: diesel.unidade,
        fator: diesel.fator,
        co2e: round(litros * diesel.fator),
        premissa: `km dos fretes × ${dieselLPerKm} L/km`,
      });
    }
  }

  return out;
}

/** Converte uma sugestão no payload de um registro de carbono (operation_records). */
export function suggestionToPayload(s: CarbonSuggestion, periodo: string): Record<string, string> {
  return {
    atividade: s.atividade,
    escopo: s.escopo,
    categoria: s.categoria,
    fonte: s.fonte,
    volume: String(s.volume),
    unidade: s.unidade,
    fator: String(s.fator),
    co2e: String(s.co2e),
    periodo,
    status: "Estimado (auto)",
  };
}
