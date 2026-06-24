export const rdcKeys = {
  root: ["rdc"] as const,
  records: (demoMode: boolean) => ["rdc", "records", demoMode] as const,
  ficha: (id: string, demoMode: boolean) => ["rdc", "records", demoMode, "ficha", id] as const,
  byTalhao: (talhaoId: string, demoMode: boolean) =>
    ["rdc", "records", demoMode, "talhao", talhaoId] as const,
  byAnimal: (animalId: string, demoMode: boolean) =>
    ["rdc", "records", demoMode, "animal", animalId] as const,
  animalOptions: (demoMode: boolean) => ["rdc", "animal-options", demoMode] as const,
};
