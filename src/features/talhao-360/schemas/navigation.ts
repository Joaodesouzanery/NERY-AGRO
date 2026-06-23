import { z } from "zod";

export const field360Tabs = [
  "overview",
  "registration",
  "cycles",
  "map",
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
