import { z } from "zod";

export const field360Tabs = [
  "overview",
  "registration",
  "cycles",
  "map",
  "pecuaria",
  "timeline",
  "alerts",
  "reports",
] as const;

export const field360SearchSchema = z.object({
  tab: z.enum(field360Tabs).catch("overview"),
  seasonId: z.string().min(1).optional().catch(undefined),
  cycleId: z.string().min(1).optional().catch(undefined),
});

export type Field360Search = z.infer<typeof field360SearchSchema>;

// Talhões hub (the list page reformulated as a map-first, tabbed control center).
export const talhoesTabs = ["mapa", "lista", "ciclos", "alertas", "relatorios"] as const;

export const talhoesSearchSchema = z.object({
  tab: z.enum(talhoesTabs).catch("mapa"),
});

export type TalhoesSearch = z.infer<typeof talhoesSearchSchema>;
