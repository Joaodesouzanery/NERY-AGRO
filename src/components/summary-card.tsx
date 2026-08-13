import { cn } from "@/lib/utils";

/** Link discreto de navegação entre abas ("ver aba →", "Ver tudo →"). */
export function TabLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </button>
  );
}

/** Mini-painel do strip "resumo das abas": número-chave + link para a aba. */
export function SummaryCard({
  label,
  value,
  support,
  onOpen,
  className,
}: {
  label: string;
  value: string;
  support?: string;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-card p-4", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <TabLink onClick={onOpen}>ver aba →</TabLink>
      </div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
      {support && <div className="mt-1 text-xs text-muted-foreground">{support}</div>}
    </div>
  );
}
