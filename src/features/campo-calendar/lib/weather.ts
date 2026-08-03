// Contrato de provider climático do Calendário.
//
// A única implementação existente é a da VITRINE (demoForecast): números
// derivados de um hash da data, não de medição meteorológica. Ela roda SÓ em
// modo DEMO — em REAL o calendário fica sem previsão, e é honesto que fique:
// alertas de chuva com percentual inventado levavam alguém a adiar pulverização
// de verdade. Ligar clima real é implementar esta mesma interface e liberar a
// origem na CSP de src/server.ts.
//
// Previsão dinâmica nunca se mistura com o snapshot salvo no evento
// (weather_summary/weather_risk), que é registro histórico do que se sabia.
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

/** Hash determinístico simples (string → 0..99): a vitrine é estável por dia. */
function seededPct(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 997;
  }
  return hash % 100;
}

export function demoForecast(now: Date, days: number): DailyForecast[] {
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

export const demoWeatherProvider: WeatherProvider = {
  getForecast: (now, days) => Promise.resolve(demoForecast(now, days)),
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
