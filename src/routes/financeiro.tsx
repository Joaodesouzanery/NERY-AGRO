import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FinancialAgroCrud } from "@/components/financial-agro-crud";
import { financialModules } from "@/lib/financeiro-config";
import { demoFinancialRecords } from "@/lib/demo/financeiro";
import { ModuleExportButtons } from "@/components/module-export-buttons";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { PeriodPicker, defaultPeriod, type PeriodValue } from "@/components/period-picker";
import { agora, buildModuleWorkbook, specMinimo } from "@/lib/export-module";
import { listAllFinancialRecords } from "@/lib/supabase-financial";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro Agro - AgroTorre" },
      {
        name: "description",
        content: "Gestão financeira agro completa com dados reais e modo demo separado.",
      },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { demoMode } = useDemoMode();
  const [period, setPeriod] = useState<PeriodValue>(defaultPeriod());

  return (
    <div className="px-8 py-6 max-w-[1600px] mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financeiro Agro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {demoMode
              ? "Modo DEMO ligado: dados demonstrativos isolados dos cadastros reais."
              : "Modo DEMO desligado: exibindo somente dados reais do Supabase."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodPicker value={period} onChange={setPeriod} />
          {/* Antes: toast "Exportação preparada" que NÃO gerava arquivo. */}
          <ModuleExportButtons
            workbook={async () => {
              const todos = demoMode ? null : await listAllFinancialRecords();
              const tabs = financialModules.map((m) => ({
                id: m.id,
                label: m.label,
                fields: m.fields.map((f) => ({ key: f.key, label: f.label })),
                records: todos
                  ? todos.filter((r) => r.module === m.id)
                  : (demoFinancialRecords[m.id] ?? []),
              }));
              return buildModuleWorkbook({
                spec: specMinimo({
                  moduleId: "financeiro",
                  moduleLabel: "Financeiro Agro",
                  tabs,
                  demoMode,
                  periodLabel: period.label,
                }),
                tabs,
                geradoEm: agora(),
              });
            }}
          />
        </div>
      </div>

      <FinancialAgroCrud />
    </div>
  );
}
