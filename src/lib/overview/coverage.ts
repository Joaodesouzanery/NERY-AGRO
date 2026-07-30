import type { ModuleOverviewSpec } from "@/lib/overview/types";

// O pedido era "dashboards e gráficos de TODAS as abas, em todas as visões
// gerais". Isso é fácil de cumprir hoje e fácil de quebrar amanhã, quando
// alguém adicionar uma aba nova e esquecer da visão geral. Aqui a regra vira
// mecânica: cada módulo tem um teste `expect(missing).toEqual([])`.

export type Coverage = {
  /** Abas com pelo menos um KPI, gráfico ou tabela apontando para elas. */
  covered: string[];
  /** Abas sem nada na visão geral — o teste falha se sobrar alguma. */
  missing: string[];
  /** tabId citado que não existe em `tabs` (pega erro de digitação). */
  orphan: string[];
};

export function overviewCoverage(spec: ModuleOverviewSpec): Coverage {
  const abas = spec.tabs.map((t) => t.id);
  const citados = new Set<string>();
  for (const k of spec.kpis) if (k.tabId) citados.add(k.tabId);
  for (const c of spec.charts) citados.add(c.tabId);
  for (const t of spec.tables ?? []) citados.add(t.tabId);

  return {
    covered: abas.filter((id) => citados.has(id)),
    missing: abas.filter((id) => !citados.has(id)),
    orphan: [...citados].filter((id) => !abas.includes(id)),
  };
}

/** Mensagem pronta para o `expect` falhar explicando o que fazer. */
export function coverageReport(spec: ModuleOverviewSpec): string {
  const { missing, orphan } = overviewCoverage(spec);
  const partes: string[] = [];
  if (missing.length) {
    partes.push(
      `${spec.moduleLabel}: sem KPI/gráfico na visão geral para a(s) aba(s) ${missing.join(", ")}`,
    );
  }
  if (orphan.length) {
    partes.push(`${spec.moduleLabel}: tabId inexistente ${orphan.join(", ")}`);
  }
  return partes.join(" · ");
}
