import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarRange } from "lucide-react";
import { parseCycles } from "@/features/talhao-360/api/services";
import type { TalhaoCycle, TalhaoRecord } from "@/features/talhao-360/types/domain";

type Row = { talhao: TalhaoRecord; cycle: TalhaoCycle };

export function FarmCyclesTab({ talhoes }: { talhoes: TalhaoRecord[] }) {
  const bySeason = useMemo(() => {
    const groups = new Map<string, Row[]>();
    for (const talhao of talhoes) {
      for (const cycle of parseCycles(talhao.payload)) {
        const season = cycle.safra || talhao.payload.safra || "Sem safra";
        const list = groups.get(season) ?? [];
        list.push({ talhao, cycle });
        groups.set(season, list);
      }
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [talhoes]);

  if (!bySeason.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <CalendarRange className="mx-auto h-9 w-9 text-primary" />
        <h2 className="mt-4 font-semibold">Nenhum ciclo cadastrado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Abra um talhão no 360° e registre as safras e ciclos na aba “Safras e Ciclos”.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bySeason.map(([season, rows]) => (
        <section key={season} className="rounded-xl border border-border bg-card">
          <header className="flex items-center justify-between gap-3 border-b border-border p-4">
            <h2 className="font-semibold">Safra {season}</h2>
            <span className="text-sm text-muted-foreground">{rows.length} ciclo(s)</span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {["Talhão", "Ciclo", "Cultura", "Tipo", "Status", "Área", "Período", ""].map(
                    (label) => (
                      <th key={label} className="px-4 py-3 font-medium">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ talhao, cycle }) => (
                  <tr
                    key={`${talhao.id}-${cycle.id}`}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{talhao.payload.talhao}</td>
                    <td className="px-4 py-3">{cycle.nome}</td>
                    <td className="px-4 py-3">{cycle.cultura || "—"}</td>
                    <td className="px-4 py-3">{cycle.tipo}</td>
                    <td className="px-4 py-3">{cycle.status}</td>
                    <td className="px-4 py-3">
                      {cycle.areaHa ? `${cycle.areaHa.toLocaleString("pt-BR")} ha` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cycle.inicio || "—"} → {cycle.fimPrevisto || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/campo/talhoes/$fieldId"
                        params={{ fieldId: talhao.id }}
                        search={{ tab: "cycles", seasonId: season, cycleId: cycle.id }}
                        className="inline-flex h-9 items-center rounded-lg border border-primary/30 px-3 text-xs font-medium text-primary hover:bg-primary/5"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
