// Persistência local do modo DEMO do Calendário — isolada do Talhão 360 e do
// Supabase (dados demo NUNCA são enviados ao servidor). Implementada sobre o
// store genérico de src/lib/demo-store.ts; guarda apenas o delta sobre os
// mocks: registros criados/editados e ids excluídos.
import type { FieldRecord } from "@/lib/supabase-field";
import { createDemoStore, DEMO_STORE_KEYS } from "@/lib/demo-store";
import { demoCalendarRecords } from "@/features/campo-calendar/data/mocks";

const store = createDemoStore(DEMO_STORE_KEYS.campoCalendar, demoCalendarRecords);

/** Snapshot demo = mocks (datas relativas a hoje) + delta local do usuário. */
export function loadDemoRecords(now = new Date()): FieldRecord[] {
  return store.load(now);
}

export function demoCreateRecord(module: string, payload: Record<string, string>): FieldRecord {
  return store.create(module, payload);
}

export function demoUpdateRecord(id: string, payload: Record<string, string>): FieldRecord {
  return store.update(id, payload, "calendar-event");
}

export function demoDeleteRecord(id: string) {
  store.remove(id);
}

/** Zera o delta local (útil em QA/testes). */
export function resetDemoStore() {
  store.reset();
}
