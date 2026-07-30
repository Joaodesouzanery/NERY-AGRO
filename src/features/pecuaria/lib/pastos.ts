import { parsePolygon, polygonAreaHa } from "@/features/talhao-360/map/geometry";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";

// Regras de pasto que a aba Pastos, a aba Resultados e a visão geral do módulo
// leem IGUAIS. Estavam copiadas em cada tela — três cópias do mesmo `if`, três
// chances de divergir no dia em que a regra mudar. Função pura: roda no Vitest
// sem React nem Supabase.

/**
 * Área do talhão em hectares: prefere o valor DECLARADO no cadastro; sem ele,
 * calcula do polígono desenhado. null quando não dá para saber (sem área
 * informada e sem desenho) — quem chama decide o que fazer com a ausência.
 */
export function areaHaDoTalhao(t: TalhaoRecord): number | null {
  const declarada = Number.parseFloat(t.payload.area_ha ?? "");
  if (Number.isFinite(declarada) && declarada > 0) return declarada;
  const poly = parsePolygon(t.payload.geometry_geojson);
  if (!poly) return null;
  const area = polygonAreaHa(poly.coordinates[0] as Array<[number, number]>);
  return area > 0 ? area : null;
}
