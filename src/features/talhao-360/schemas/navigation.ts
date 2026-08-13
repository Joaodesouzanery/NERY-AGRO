import { z } from "zod";

export const field360Tabs = [
  "overview",
  "registration",
  "cycles",
  "insumos",
  "map",
  "activity",
] as const;

// Abas que existiam antes da consolidação (links salvos não podem quebrar):
// timeline/alerts viraram "activity"; reports virou dialog no header.
const legacyTabs: Record<string, (typeof field360Tabs)[number]> = {
  timeline: "activity",
  alerts: "activity",
  reports: "overview",
};

export const field360SearchSchema = z.object({
  tab: z.preprocess(
    (value) => (typeof value === "string" && legacyTabs[value]) || value,
    z.enum(field360Tabs).catch("overview"),
  ),
  seasonId: z.string().min(1).optional().catch(undefined),
  cycleId: z.string().min(1).optional().catch(undefined),
});

export type Field360Search = z.infer<typeof field360SearchSchema>;
