export const insumosKeys = {
  root: ["insumos"] as const,
  records: (demoMode: boolean) => [...insumosKeys.root, "records", demoMode] as const,
};
