import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { loadTalhaoIntegrations } from "@/features/talhao-360/api/integrations";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";

export function PecuariaTab({
  talhao,
  demoMode,
  onEditCadastro,
}: {
  talhao: TalhaoRecord;
  demoMode: boolean;
  onEditCadastro: () => void;
}) {
  const payload = talhao.payload;
  const integrations = useQuery({
    queryKey: ["talhao-integrations", talhao.id],
    queryFn: () => loadTalhaoIntegrations(talhao),
    enabled: !demoMode,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const operations = integrations.data?.operations ?? [];

  const stats: Array<[string, string]> = [
    ["Vocação", payload.vocacao || "Agricultura"],
    ["Lote/rebanho", payload.lote_atual || "—"],
    ["Forrageira", payload.forrageira || "—"],
    ["Lotação (UA/ha)", payload.lotacao_ua_ha || "—"],
    ["Capacidade (UA)", payload.capacidade_ua || "—"],
    ["Dias de descanso", payload.dias_descanso || "—"],
    ["Área (ha)", payload.area_ha || "—"],
    ["Status", payload.status || "—"],
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Resumo da pecuária</h2>
          <button
            type="button"
            onClick={onEditCadastro}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Editar no Cadastro
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Registros de pecuária vinculados</h2>
        {demoMode ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Pastagens, lotes e animais vinculados a este talhão aparecem aqui no modo real
            (Supabase).
          </p>
        ) : integrations.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Carregando registros vinculados…</p>
        ) : operations.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum registro vinculado. Vincule pastagens/lotes a este talhão na aba Pecuária.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {["Módulo", "Detalhe"].map((label) => (
                    <th key={label} className="px-3 py-2 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {operations.map((op) => (
                  <tr key={op.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium capitalize">{op.module}</td>
                    <td className="px-3 py-2 text-muted-foreground">{summarize(op.payload)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function summarize(payload: Record<string, string>) {
  const parts = Object.entries(payload)
    .filter(([, value]) => value)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${value}`);
  return parts.join(" · ") || "—";
}
