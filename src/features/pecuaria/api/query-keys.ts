// Chaves de cache do React Query para a Pecuária v2. Centralizadas para
// invalidação consistente após mutações.
export const pecKeys = {
  all: ["pecuaria-v2"] as const,
  lotes: () => [...pecKeys.all, "lotes"] as const,
  animais: () => [...pecKeys.all, "animais"] as const,
  pesagens: (animalId?: string) => [...pecKeys.all, "pesagens", animalId ?? "todas"] as const,
  sanitarios: () => [...pecKeys.all, "sanitarios"] as const,
  reprodutivos: () => [...pecKeys.all, "reprodutivos"] as const,
  gmd: () => [...pecKeys.all, "gmd"] as const,
  carencia: () => [...pecKeys.all, "carencia"] as const,
  config: () => [...pecKeys.all, "config"] as const,
  header: () => [...pecKeys.all, "header"] as const,
  ocupacoes: () => [...pecKeys.all, "ocupacoes"] as const,
  talhoes: () => [...pecKeys.all, "talhoes"] as const,
  dossie: (animalId: string) => [...pecKeys.all, "dossie", animalId] as const,
  semen: () => [...pecKeys.all, "estoque-semen"] as const,
  gta: () => [...pecKeys.all, "gta"] as const,
  producao: () => [...pecKeys.all, "producao"] as const,
  pdfs: (animalId: string) => [...pecKeys.all, "pdfs", animalId] as const,
};
