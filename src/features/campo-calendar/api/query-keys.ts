export const campoCalendarKeys = {
  root: ["campo-calendar"] as const,
  records: (demoMode: boolean) => [...campoCalendarKeys.root, "records", demoMode] as const,
};
