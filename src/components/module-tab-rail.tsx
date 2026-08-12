import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Barra de abas dos módulos: coluna à esquerda no desktop, faixa rolável no
// celular.
//
// Por que este formato ganhou dos cartões: Campo tem 19 abas e Logística 13, em
// grid de cartões `min-h-16`. No celular isso são SETE linhas — 496px, com o
// conteúdo começando por volta de 676px. Dois terços da primeira tela gastos
// escolhendo onde ir, antes de ver qualquer coisa.
//
// Na coluna, a navegação custa ZERO altura no desktop (fica ao lado) e ~48px no
// celular (uma faixa que rola). O padrão já estava no produto — Otimização
// COGS, Sustentabilidade, Inteligência e Equipe & Vendas usam desde sempre —,
// só não tinha sido levado para os três módulos maiores, que são justamente os
// que mais sofrem.

export type ModuleTabItem = {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  /** Contador opcional à direita (nº de registros, alertas...). */
  badge?: number;
};

export function ModuleTabRail({
  items,
  active,
  onSelect,
  children,
  className,
}: {
  items: ModuleTabItem[];
  active: string;
  onSelect: (id: string) => void;
  /** Conteúdo da aba — fica ao lado da barra no desktop. */
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("md:flex md:items-start md:gap-6", className)}>
      <nav
        aria-label="Abas do módulo"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 md:mx-0 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:pb-0"
      >
        {items.map((item) => (
          <ModuleTabButton
            key={item.id}
            label={item.label}
            icon={item.icon}
            badge={item.badge}
            active={active === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </nav>

      <div className="mt-3 min-w-0 flex-1 md:mt-0">{children}</div>
    </div>
  );
}

function ModuleTabButton({
  label,
  icon: Icon,
  badge,
  active,
  onClick,
}: {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        // `min-w` só no celular: na coluna do desktop o botão ocupa a largura
        // toda, e um mínimo ali criaria rolagem horizontal dentro da coluna.
        "relative flex min-w-[8.5rem] shrink-0 items-center gap-2 rounded-md px-3.5 py-2.5 text-left text-sm font-semibold transition-colors md:min-w-0",
        active
          ? "bg-primary text-primary-foreground shadow-sm md:after:absolute md:after:right-[-9px] md:after:top-1/2 md:after:-translate-y-1/2 md:after:border-[7px] md:after:border-transparent md:after:border-l-primary md:after:content-['']"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-primary-foreground" : "text-muted-foreground",
          )}
        />
      )}
      <span className="truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] tabular-nums",
            active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
