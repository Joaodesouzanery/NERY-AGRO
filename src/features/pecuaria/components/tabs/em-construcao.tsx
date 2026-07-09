import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { RichTabPanel } from "@/components/rich-tab";

// Placeholder padrão para as pills que chegam nas Fases 4–6 (Pastos & Ocupação,
// Resultados, Rastreabilidade). Mantém a mesma cara do sistema (card + EmptyState).
export function EmConstrucao({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: ReactNode;
}) {
  return (
    <RichTabPanel title={title} description={description}>
      <EmptyState
        title="Em construção"
        description={children ? undefined : "Este módulo entra numa próxima fase do rollout."}
        icon={icon}
      />
      {children}
    </RichTabPanel>
  );
}
