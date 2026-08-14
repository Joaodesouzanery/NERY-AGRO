import { localDateOf, localToday } from "@/lib/date-local";
import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type PeriodGranularity = "todo" | "diario" | "semanal" | "mensal" | "custom";

export type PeriodValue = {
  granularity: PeriodGranularity;
  start?: string; // ISO date
  end?: string;
  label: string;
};

const presets: { id: PeriodGranularity; label: string; hint: string }[] = [
  { id: "todo", label: "Todo o período", hint: "Sem recorte de data" },
  { id: "diario", label: "Diário", hint: "Hoje" },
  { id: "semanal", label: "Semanal", hint: "Últimos 7 dias" },
  { id: "mensal", label: "Mensal", hint: "Este mês" },
  { id: "custom", label: "Período selecionado", hint: "Escolher intervalo" },
];

function todayIso() {
  return localToday();
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localDateOf(d.toISOString());
}

function monthStartIso() {
  const d = new Date();
  d.setDate(1);
  return localDateOf(d.toISOString());
}

/**
 * Sem recorte de data.
 *
 * Existe porque `defaultPeriod()` ("Este mês") como estado INICIAL de uma
 * tabela de cadastro esconde o acervo: registro sem `payload.data` cai no
 * `created_at`, e tudo que foi cadastrado antes do dia 1º some da tela sem
 * que ninguém tenha pedido filtro nenhum. Frota, Bases, Rotas e Motoristas
 * são cadastros — não têm por que serem lidos "por mês".
 */
export function periodoTodo(): PeriodValue {
  return { granularity: "todo", label: "Todo o período" };
}

export function defaultPeriod(): PeriodValue {
  return {
    granularity: "mensal",
    start: monthStartIso(),
    end: todayIso(),
    label: "Este mês",
  };
}

export function PeriodPicker({
  value,
  onChange,
  className,
}: {
  value: PeriodValue;
  onChange: (next: PeriodValue) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.start ?? monthStartIso());
  const [customEnd, setCustomEnd] = useState(value.end ?? todayIso());

  const choose = (g: PeriodGranularity) => {
    if (g === "todo") {
      // start/end indefinidos: `dentroDoPeriodo` deixa passar tudo e
      // `temFiltroAtivo` responde false — o contador diz "N registros", sem
      // o "de M", que é a verdade.
      onChange(periodoTodo());
      setOpen(false);
    } else if (g === "diario") {
      const d = todayIso();
      onChange({ granularity: g, start: d, end: d, label: "Hoje" });
      setOpen(false);
    } else if (g === "semanal") {
      onChange({
        granularity: g,
        start: daysAgoIso(6),
        end: todayIso(),
        label: "Últimos 7 dias",
      });
      setOpen(false);
    } else if (g === "mensal") {
      onChange({
        granularity: g,
        start: monthStartIso(),
        end: todayIso(),
        label: "Este mês",
      });
      setOpen(false);
    }
  };

  const applyCustom = () => {
    onChange({
      granularity: "custom",
      start: customStart,
      end: customEnd,
      label: `${formatBr(customStart)} – ${formatBr(customEnd)}`,
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "h-10 px-4 rounded-lg border border-border bg-card text-sm flex items-center gap-2 hover:bg-muted transition-colors",
            className,
          )}
        >
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{value.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="p-2">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => choose(p.id)}
              className={cn(
                "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors",
                value.granularity === p.id && "bg-muted",
              )}
            >
              <span className="font-medium">{p.label}</span>
              <span className="text-xs text-muted-foreground">{p.hint}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-border p-3 space-y-2">
          <div className="text-[11px] font-semibold tracking-wide text-muted-foreground">
            INTERVALO PERSONALIZADO
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">
              Início
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Fim
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              />
            </label>
          </div>
          <button
            onClick={applyCustom}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            Aplicar período
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatBr(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}
