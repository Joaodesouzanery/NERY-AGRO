import type { OperationRecord } from "@/lib/supabase-operations";

// Helpers puros da Pecuária — sem dependência de React/Supabase, para serem
// testáveis e reutilizados pelos gráficos/visualizações.

export type WeightPoint = { label: string; peso: number };

/**
 * Lê o campo livre `historico_pesagens` (ex.: "2026-03: 398 kg; 2026-05: 418 kg")
 * e devolve uma série ordenável para o gráfico de curva de peso. Aceita separador
 * `;` ou quebra de linha; extrai o primeiro número de cada valor (kg opcional).
 */
export function parseWeightHistory(raw: string | undefined | null): WeightPoint[] {
  if (!raw) return [];
  return raw
    .split(/[;\n]+/)
    .map((part): WeightPoint | null => {
      const idx = part.indexOf(":");
      if (idx === -1) return null;
      const label = part.slice(0, idx).trim();
      const value = part.slice(idx + 1);
      const match = value.match(/-?\d+(?:[.,]\d+)?/);
      if (!label || !match) return null;
      const peso = Number(match[0].replace(",", "."));
      if (!Number.isFinite(peso) || peso === 0) return null;
      return { label, peso };
    })
    .filter((p): p is WeightPoint => p !== null);
}

export type VaccinationEntry = {
  id: string;
  animalLote: string;
  vacina: string;
  proximaDose: string;
  status: string;
  overdue: boolean;
  daysUntil: number;
};

/**
 * Próximas vacinações ordenadas por data (`proxima_dose`), com flag de vencida
 * em relação a `today` (ISO yyyy-mm-dd, injetado para a função ser pura).
 */
export function upcomingVaccinations(
  records: OperationRecord[],
  today: string,
): VaccinationEntry[] {
  const todayMs = Date.parse(today);
  return records
    .filter(
      (r) => r.module === "vacinacao" && /^\d{4}-\d{2}-\d{2}$/.test(r.payload.proxima_dose ?? ""),
    )
    .map((r): VaccinationEntry => {
      const proximaDose = r.payload.proxima_dose;
      const diffMs = Date.parse(proximaDose) - todayMs;
      const daysUntil = Math.round(diffMs / 86_400_000);
      return {
        id: r.id,
        animalLote: r.payload.animal_lote || r.payload.animal || "-",
        vacina: r.payload.vacina || "-",
        proximaDose,
        status: r.payload.status || "",
        overdue: daysUntil < 0,
        daysUntil,
      };
    })
    .sort((a, b) => a.proximaDose.localeCompare(b.proximaDose));
}
