import { Scissors, Truck, Wallet } from "lucide-react";
import { useConnectedAgroData } from "@/lib/connected-agro-data";
import { buildColheitaPagamento } from "@/lib/colheita-metrics";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Fechamento de pagamento da colheita do dia (corte + carregamento), alimentado
// pela "Caixa de entrada". Some sozinho quando não há registros de colheita.
export function ColheitaPagamentoCard() {
  const { snapshot } = useConnectedAgroData();
  const p = buildColheitaPagamento(snapshot.field);
  if (p.corte.registros === 0 && p.carregamento.registros === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Wallet className="h-4 w-4 text-primary" />
        Colheita &amp; Pagamento
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <PagStat
          icon={Scissors}
          label="Corte"
          caixas={p.corte.caixas}
          extra={`${p.corte.cortadores} cortadores`}
          valor={p.corte.valor}
        />
        <PagStat
          icon={Truck}
          label="Carregamento"
          caixas={p.carregamento.caixas}
          extra={`${p.carregamento.chapas} chapas`}
          valor={p.carregamento.valor}
        />
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total a pagar
          </div>
          <div className="mt-1 text-2xl font-semibold text-primary">{brl(p.total)}</div>
        </div>
      </div>
    </div>
  );
}

function PagStat({
  icon: Icon,
  label,
  caixas,
  extra,
  valor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  caixas: number;
  extra: string;
  valor: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{brl(valor)}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {caixas.toLocaleString("pt-BR")} caixas · {extra}
      </div>
    </div>
  );
}
