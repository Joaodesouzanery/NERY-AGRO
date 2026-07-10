// Contrato de provider climático do Calendário. O MVP usa um provider mockado
// determinístico (semente = data) — trocar por API real é implementar a mesma
// interface e liberar a origem na CSP de src/server.ts. Previsão dinâmica nunca
// se mistura com snapshot salvo no evento (weather_summary/weather_risk).
import { addDays, format } from "date-fns";

export type DailyForecast = {
  date: string;
  rainChancePct: number;
  rainMm: number;
  tempMinC: number;
  tempMaxC: number;
  windKmh: number;
};

export interface WeatherProvider {
  /** Previsão diária a partir de `now` (inclusive). */
  getForecast(now: Date, days: number): Promise<DailyForecast[]>;
}

/** Hash determinístico simples (string → 0..99) para o mock ser estável por dia. */
function seededPct(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 997;
  }
  return hash % 100;
}

export function mockForecast(now: Date, days: number): DailyForecast[] {
  return Array.from({ length: days }, (_, index) => {
    const date = format(addDays(now, index), "yyyy-MM-dd");
    const rain = seededPct(`rain:${date}`);
    const heat = seededPct(`heat:${date}`);
    return {
      date,
      rainChancePct: rain,
      rainMm: rain >= 60 ? Math.round((rain - 50) * 0.8) : 0,
      tempMinC: 18 + (heat % 6),
      tempMaxC: 29 + (heat % 12),
      windKmh: 6 + (seededPct(`wind:${date}`) % 18),
    };
  });
}

export const mockWeatherProvider: WeatherProvider = {
  getForecast: (now, days) => Promise.resolve(mockForecast(now, days)),
};

// ── Central interna de notificações: estado "lida" fica no dispositivo ──
// (adapter de e-mail é bloco futuro; nada aqui simula envio real).

const READ_KEY = "campo-calendar-alerts-read-v1";

export function listReadAlertKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markAlertRead(key: string) {
  if (typeof window === "undefined") return;
  const next = listReadAlertKeys();
  next.add(key);
  window.localStorage.setItem(READ_KEY, JSON.stringify([...next]));
}

/** Interface do futuro adapter de e-mail — implementação real em bloco separado. */
export interface NotificationAdapter {
  notify(subject: string, body: string): Promise<void>;
}
