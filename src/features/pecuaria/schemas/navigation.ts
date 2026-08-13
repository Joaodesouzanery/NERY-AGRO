import { z } from "zod";

export const pecuariaTabs = [
  "visao-geral",
  "lotes",
  "manejo",
  "pastos",
  "rebanho",
  "resultados",
  "rastreabilidade",
] as const;

export type PecuariaTab = (typeof pecuariaTabs)[number];

export const pecuariaSearchSchema = z.object({
  tab: z.enum(pecuariaTabs).catch("visao-geral"),
});

export type PecuariaSearch = z.infer<typeof pecuariaSearchSchema>;
