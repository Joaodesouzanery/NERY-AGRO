import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { FinancialAgroCrud } from "@/components/financial-agro-crud";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { PeriodPicker, defaultPeriod, type PeriodValue } from "@/components/period-picker";

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
          <button
            onClick={() => toast.success(`Exportação preparada para ${period.label}.`)}
            className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      <FinancialAgroCrud />
    </div>
  );
}
