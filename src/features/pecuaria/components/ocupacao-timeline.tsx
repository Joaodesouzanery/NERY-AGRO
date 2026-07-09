import { useMemo } from "react";
import { RichTabPanel } from "@/components/rich-tab";
import { EmptyState } from "@/components/empty-state";
import { CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import { parseCycles } from "@/features/talhao-360/api/services";
import type { PecLote, PecOcupacao } from "@/features/pecuaria/types/domain";

// Timeline de ocupação: uma linha por talhão, uma coluna por mês. Mostra qual
// lote ocupou cada período, os meses de LAVOURA (lidos dos ciclos do módulo
// Campo — é o ILP: o mesmo polígono é soja numa parte do ano e pasto na outra)
// e os períodos de descanso.

const MESES = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const FASE_COR: Record<string, string> = {
  cria: "#0ea5e9",
  recria: "#8b5cf6",
  engorda: "#16a34a",
  terminacao: "#f59e0b",
};
const COR_LOTE_PADRAO = "#0ea5e9";
const COR_LAVOURA = "#d97706";

type Celula =
  | { tipo: "pasto"; label: string; cor: string }
  | { tipo: "lavoura"; label: string }
  | { tipo: "descanso" };

/** "2026-03" → "2026-03-31" (último dia do mês). */
function fimDoMes(mesIso: string): string {
  const [ano, mes] = mesIso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10);
}

/** Um intervalo [inicio, fim] cobre algum dia do mês? `fim` nulo = em aberto. */
export function sobrepoeMes(inicio: string, fim: string | null, mesIso: string): boolean {
  if (!inicio) return false;
  const mesInicio = `${mesIso}-01`;
  const mesFim = fimDoMes(mesIso);
  return inicio <= mesFim && (fim === null || fim >= mesInicio);
}

export function OcupacaoTimeline({
  talhoes,
  ocupacoes,
  lotes,
}: {
  talhoes: TalhaoRecord[];
  ocupacoes: PecOcupacao[];
  lotes: PecLote[];
}) {
  const ano = new Date().getUTCFullYear();
  const meses = useMemo(
    () => Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, "0")}`),
    [ano],
  );

  const linhas = useMemo(
    () =>
      talhoes.map((talhao) => {
        const ocupacoesDoTalhao = ocupacoes.filter((o) => o.talhao_id === talhao.id);
        const ciclos = parseCycles(talhao.payload).filter((c) => c.tipo !== "Pastagem" && c.inicio);

        const celulas: Celula[] = meses.map((mes) => {
          const ocupacao = ocupacoesDoTalhao.find((o) =>
            sobrepoeMes(o.data_entrada, o.data_saida, mes),
          );
          if (ocupacao) {
            const lote = lotes.find((l) => l.id === ocupacao.lote_id);
            return {
              tipo: "pasto",
              label: lote?.nome ?? "Lote",
              cor: (lote?.fase && FASE_COR[lote.fase]) || COR_LOTE_PADRAO,
            };
          }
          const ciclo = ciclos.find((c) =>
            sobrepoeMes(
              c.inicio.slice(0, 10),
              (c.fimReal || c.fimPrevisto || "").slice(0, 10) || null,
              mes,
            ),
          );
          if (ciclo) return { tipo: "lavoura", label: ciclo.cultura || ciclo.nome || "Lavoura" };
          return { tipo: "descanso" };
        });

        return { talhao, celulas };
      }),
    [talhoes, ocupacoes, lotes, meses],
  );

  const temAlgo = linhas.some((l) => l.celulas.some((c) => c.tipo !== "descanso"));

  return (
    <RichTabPanel
      title={`Timeline de ocupação · ${ano}`}
      description="Pasto, lavoura (ILP) e descanso no mesmo talhão ao longo da safra"
    >
      {!temAlgo ? (
        <EmptyState
          title="Sem ocupação nem ciclo registrado"
          description="Movimente um lote para um talhão, ou cadastre ciclos no Talhão 360°."
          icon={CalendarRange}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-1 text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="w-40 text-left font-medium">Talhão</th>
                {MESES.map((m, i) => (
                  <th key={`${m}-${i}`} className="px-0.5 text-center font-medium">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ talhao, celulas }) => (
                <tr key={talhao.id}>
                  <td className="truncate pr-2 text-sm font-medium">{talhao.payload.talhao}</td>
                  {celulas.map((celula, i) => (
                    <td key={i} className="px-0.5">
                      <div
                        title={
                          celula.tipo === "descanso"
                            ? "Descanso"
                            : `${celula.tipo === "pasto" ? "Pasto" : "Lavoura"}: ${celula.label}`
                        }
                        className={cn("h-6 rounded-sm", celula.tipo === "descanso" && "bg-muted")}
                        style={
                          celula.tipo === "pasto"
                            ? { background: celula.cor }
                            : celula.tipo === "lavoura"
                              ? {
                                  background: `repeating-linear-gradient(45deg, ${COR_LAVOURA}, ${COR_LAVOURA} 4px, transparent 4px, transparent 8px)`,
                                  border: `1px solid ${COR_LAVOURA}`,
                                }
                              : undefined
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {Object.entries(FASE_COR).map(([fase, cor]) => (
              <span key={fase} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: cor }} />
                Pasto · {fase}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{
                  background: `repeating-linear-gradient(45deg, ${COR_LAVOURA}, ${COR_LAVOURA} 2px, transparent 2px, transparent 4px)`,
                  border: `1px solid ${COR_LAVOURA}`,
                }}
              />
              Lavoura (ILP)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-muted" />
              Descanso
            </span>
          </div>
        </div>
      )}
    </RichTabPanel>
  );
}
