// Chaves de cache do React Query para a Pecuária v2. Centralizadas para
// invalidação consistente após mutações.
//
// `demoMode` é OBRIGATÓRIO em toda folha, de propósito: DEMO e REAL não podem
// dividir a mesma entrada de cache. Dividiam — e `invalidateQueries()` marca
// stale mas ENTREGA o valor antigo enquanto refaz a consulta, então ao desligar
// o DEMO os números da vitrine apareciam como se fossem da empresa (e para
// query inativa ficavam até o gcTime). Como o parâmetro é obrigatório, o
// typecheck aponta qualquer call site novo que esqueça de passá-lo.
export const pecKeys = {
  all: ["pecuaria-v2"] as const,
  lotes: (demo: boolean) => [...pecKeys.all, "lotes", demo] as const,
  animais: (demo: boolean) => [...pecKeys.all, "animais", demo] as const,
  pesagens: (demo: boolean, animalId?: string) =>
    [...pecKeys.all, "pesagens", demo, animalId ?? "todas"] as const,
  sanitarios: (demo: boolean) => [...pecKeys.all, "sanitarios", demo] as const,
  reprodutivos: (demo: boolean) => [...pecKeys.all, "reprodutivos", demo] as const,
  gmd: (demo: boolean) => [...pecKeys.all, "gmd", demo] as const,
  carencia: (demo: boolean) => [...pecKeys.all, "carencia", demo] as const,
  config: (demo: boolean) => [...pecKeys.all, "config", demo] as const,
  ocupacoes: (demo: boolean) => [...pecKeys.all, "ocupacoes", demo] as const,
  talhoes: (demo: boolean) => [...pecKeys.all, "talhoes", demo] as const,
  dossie: (demo: boolean, animalId: string) => [...pecKeys.all, "dossie", demo, animalId] as const,
  semen: (demo: boolean) => [...pecKeys.all, "estoque-semen", demo] as const,
  gta: (demo: boolean) => [...pecKeys.all, "gta", demo] as const,
  producao: (demo: boolean) => [...pecKeys.all, "producao", demo] as const,
  pdfs: (demo: boolean, animalId: string) => [...pecKeys.all, "pdfs", demo, animalId] as const,
};
