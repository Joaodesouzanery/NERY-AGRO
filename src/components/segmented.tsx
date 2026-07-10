import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
  title?: string;
};

// Segmented control no padrão das Tabs do design system: trilho bg-muted p-1,
// item ativo bg-background. Usado para abas de módulo, filtros neutros e
// alternadores (Cards/Lista, camadas do mapa) — pill colorida é só para status.
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-9 w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-md bg-muted p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={option.disabled}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground",
              option.disabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
