// Adapter SOMENTE LEITURA do Talhão 360. O Calendário consome talhões, ciclos e
// geometrias já existentes sem editar src/features/talhao-360/** — a integração
// bidirecional (Timeline lendo calendar-event) é um bloco futuro, após aprovação.
import type { FieldRecord } from "@/lib/supabase-field";
import { asTalhaoRecord, parseCycles } from "@/features/talhao-360/api/services";
import type { CalendarCycle, CalendarTalhao } from "@/features/campo-calendar/types/domain";

export function normalizeName(value?: string) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function parseGeometry(raw?: string): GeoJSON.Polygon | undefined {
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as GeoJSON.Polygon;
    return value?.type === "Polygon" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Talhões cadastrados (module = areas), com área/cor/geometria para o mapa resumido. */
export function listCalendarTalhoes(records: FieldRecord[]): CalendarTalhao[] {
  return records
    .filter((record) => record.module === "areas")
    .map(asTalhaoRecord)
    .filter((record) => record.payload.talhao)
    .map((record) => ({
      id: record.id,
      nome: record.payload.talhao,
      fazenda: record.payload.fazenda,
      areaHa: Number(record.payload.area_ha || record.payload.area_util || "") || undefined,
      safra: record.payload.safra,
      corMapa: record.payload.cor_mapa,
      geometry: parseGeometry(record.payload.geometry_geojson),
    }));
}

/** Ciclos por talhão (ciclos_json do Talhão 360) — fonte de verdade de período/cultura/área. */
export function listCalendarCycles(records: FieldRecord[]): CalendarCycle[] {
  return records
    .filter((record) => record.module === "areas")
    .map(asTalhaoRecord)
    .flatMap((record) =>
      parseCycles(record.payload).map((cycle) => ({
        id: cycle.id,
        talhaoId: record.id,
        talhaoName: record.payload.talhao,
        safra: cycle.safra,
        nome: cycle.nome,
        cultura: cycle.cultura,
        tipo: cycle.tipo,
        inicio: cycle.inicio,
        fimPrevisto: cycle.fimPrevisto,
        status: cycle.status,
        areaHa: cycle.areaHa,
        custoPrevistoHa: cycle.custoPrevistoHa,
      })),
    );
}

/** Resolve o talhão de um vínculo: preferir id; aceitar nome como fallback legado. */
export function resolveTalhao(
  talhoes: CalendarTalhao[],
  talhaoId?: string,
  talhaoName?: string,
): CalendarTalhao | undefined {
  if (talhaoId) {
    const byId = talhoes.find((talhao) => talhao.id === talhaoId);
    if (byId) return byId;
  }
  if (!talhaoName) return undefined;
  const normalized = normalizeName(talhaoName);
  return talhoes.find((talhao) => normalizeName(talhao.nome) === normalized);
}
