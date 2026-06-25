import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Beef } from "lucide-react";
import { useTalhao360Records } from "@/features/talhao-360/hooks/use-talhao-360";
import { farmGeometryFromRecords } from "@/features/talhao-360/api/services";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import { PECUARIA_VOCACOES } from "@/features/talhao-360/types/domain";
import { TalhaoMapOverview } from "@/features/talhao-360/map/talhao-map-overview";

function number(value?: string) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function area(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ha`;
}

export function PecuariaTalhoesSection() {
  const navigate = useNavigate();
  const { data, isLoading } = useTalhao360Records();
  const records = useMemo(() => data ?? [], [data]);
  const farmGeometry = useMemo(() => farmGeometryFromRecords(records), [records]);
  const talhoes = useMemo(
    () =>
      (records.filter((record) => record.module === "areas") as TalhaoRecord[]).filter(
        (item) => !!item.payload.vocacao && PECUARIA_VOCACOES.includes(item.payload.vocacao),
      ),
    [records],
  );

  const open = (fieldId: string) =>
    void navigate({
      to: "/campo/talhoes/$fieldId",
      params: { fieldId },
      search: { tab: "pecuaria" },
    });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando talhões…</p>;
  }

  if (talhoes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <Beef className="mx-auto h-9 w-9 text-primary" />
        <h2 className="mt-4 font-semibold">Nenhum talhão de pecuária</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Marque a vocação de um talhão como “Pecuária” ou “Integração lavoura-pecuária” em Campo →
          Talhões para vê-lo aqui.
        </p>
      </div>
    );
  }

  const totalArea = talhoes.reduce((sum, item) => sum + number(item.payload.area_ha), 0);
  const totalCapacity = talhoes.reduce((sum, item) => sum + number(item.payload.capacidade_ua), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label="Talhões de pecuária" value={String(talhoes.length)} />
        <Kpi label="Área de pastagem" value={area(totalArea)} />
        <Kpi label="Capacidade total" value={`${totalCapacity.toLocaleString("pt-BR")} UA`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TalhaoMapOverview
          talhoes={talhoes}
          farmGeometry={farmGeometry}
          onSelect={open}
          className="h-[420px]"
        />
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[340px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {["Talhão", "Área", "Lotação", "Descanso", ""].map((label) => (
                  <th key={label} className="px-3 py-2 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {talhoes.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-medium">{item.payload.talhao}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.payload.lote_atual || "Sem lote"}
                    </div>
                  </td>
                  <td className="px-3 py-2">{area(number(item.payload.area_ha))}</td>
                  <td className="px-3 py-2">
                    {item.payload.lotacao_ua_ha ? `${item.payload.lotacao_ua_ha} UA/ha` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {item.payload.dias_descanso ? `${item.payload.dias_descanso} d` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => open(item.id)}
                      className="inline-flex h-8 items-center rounded-lg border border-primary/30 px-2 text-xs font-medium text-primary hover:bg-primary/5"
                    >
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
