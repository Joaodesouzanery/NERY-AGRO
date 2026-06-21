import { z } from "zod";

export const talhaoRegistrationSchema = z.object({
  talhao: z.string().trim().min(1, "Informe o nome do talhão."),
  codigo: z.string().trim().min(1, "Informe o código."),
  area_ha: z.string().trim().min(1, "Informe a área."),
  area_util: z.string().optional(),
  status: z.enum(["Plantado", "Em preparo", "Colhido", "Pousio", "Planejado", "Inativo"]),
});

export const cycleSchema = z
  .object({
    safra: z.string().trim().min(3),
    nome: z.string().trim().min(2),
    cultura: z.string().trim().min(2),
    tipo: z.enum(["Produção", "Cobertura", "Pousio", "Reforma", "Pastagem", "Experimental"]),
    areaHa: z.number().positive(),
    inicio: z.string().date(),
    fimPrevisto: z.string().date(),
  })
  .refine((value) => value.fimPrevisto >= value.inicio, {
    message: "O encerramento previsto deve ser posterior ao início.",
    path: ["fimPrevisto"],
  });

const linearRingSchema = z
  .array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]))
  .min(4)
  .refine(
    (ring) => {
      const first = ring[0];
      const last = ring.at(-1);
      return first[0] === last?.[0] && first[1] === last?.[1];
    },
    { message: "O polígono precisa estar fechado." },
  );

export const polygonGeometrySchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(linearRingSchema).min(1),
});
