import type { FieldAlert, TalhaoRecord, TimelineEvent } from "@/features/talhao-360/types/domain";
import { SectionLabel } from "@/components/section-label";
import { AlertsTab } from "@/features/talhao-360/components/tabs/alerts-tab";
import { TimelineTab } from "@/features/talhao-360/components/tabs/timeline-tab";

// Aba "Atividade": funde Alertas + Timeline num hub único do que aconteceu e
// do que pede ação no talhão. As duas seções preservam seus componentes
// (KPIs de severidade, ações de resolver, filtros e registro de evento).
export function ActivityTab({
  talhao,
  events,
  alerts,
  demoMode,
}: {
  talhao: TalhaoRecord;
  events: TimelineEvent[];
  alerts: FieldAlert[];
  demoMode: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Alertas do talhão" className="flex flex-col gap-3">
        <SectionLabel>Alertas</SectionLabel>
        <AlertsTab alerts={alerts} demoMode={demoMode} />
      </section>
      <section aria-label="Linha do tempo do talhão" className="flex flex-col gap-3">
        <SectionLabel>Linha do tempo</SectionLabel>
        <TimelineTab talhao={talhao} events={events} demoMode={demoMode} />
      </section>
    </div>
  );
}
