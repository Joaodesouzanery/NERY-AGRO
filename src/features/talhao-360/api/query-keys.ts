export const talhao360Keys = {
  root: ["talhao-360"] as const,
  records: (demoMode: boolean) => [...talhao360Keys.root, "records", demoMode] as const,
  field: (fieldId: string, demoMode: boolean) =>
    [...talhao360Keys.records(demoMode), "field", fieldId] as const,
};
