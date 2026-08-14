import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Molde único de card do AgroTorre.
//
// Eram quatro, divergentes, convivendo na mesma tela: `ChartFrame`
// (`rounded-md p-4`, header `mb-3`), `RichTabPanel` (`rounded-md p-5`, header
// `mb-4`), a section do CRUD da Logística (`rounded-xl p-5 shadow`) e o card do
// mapa (`h2 text-lg`). Nenhum deles separava o cabeçalho do conteúdo — título,
// descrição e gráfico flutuavam no mesmo bloco.
//
// Agora o cabeçalho é uma FAIXA, com fundo e linha embaixo. Não é vocabulário
// novo: é exatamente o que o `<thead>` do DataTable já faz (`bg-muted/40`).
//
// Duas decisões que fazem a faixa funcionar:
//
//  1. O padding SAI do container e vai para cabeçalho e corpo separadamente.
//     Com padding no container, a faixa não encosta na borda e vira um
//     retângulo cinza flutuando dentro do card.
//  2. O raio acompanha por `rounded-t-[inherit]`, e NÃO por `overflow-hidden`
//     no container. `overflow` num eixo coage o outro para `auto`: todo card
//     viraria um scroll container e mataria qualquer `position: sticky` dentro
//     dele — que é a regra documentada em `layout-sticky.guard.test.ts`.

type Pad = "md" | "lg";

const padX: Record<Pad, string> = { md: "px-4", lg: "px-5" };
const padTudo: Record<Pad, string> = { md: "p-4", lg: "p-5" };

/** Casca do card. O padding é dos filhos, para a faixa do cabeçalho sangrar até a borda. */
export function PanelShell({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-md border border-border bg-card", className)}>{children}</div>;
}

export function PanelHeader({
  title,
  description,
  icon: Icon,
  action,
  pad = "md",
  singleLine = false,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  pad?: Pad;
  /**
   * Trunca título e descrição em uma linha. Só a moldura de gráfico usa: ela
   * vive numa grade de três colunas com altura fixa, e uma descrição de duas
   * linhas desalinha a fileira inteira. Nos painéis largos truncar esconderia
   * texto que cabe.
   */
  singleLine?: boolean;
  className?: string;
}) {
  if (!title && !description && !action) return null;
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-t-[inherit] border-b border-border bg-muted/40 py-2.5",
        padX[pad],
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          {title && (
            <h3 className={cn("text-sm font-semibold tracking-tight", singleLine && "truncate")}>
              {title}
            </h3>
          )}
          {description && (
            <p className={cn("mt-0.5 text-xs text-muted-foreground", singleLine && "truncate")}>
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PanelBody({
  pad = "md",
  className,
  children,
}: {
  pad?: Pad;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(padTudo[pad], className)}>{children}</div>;
}
