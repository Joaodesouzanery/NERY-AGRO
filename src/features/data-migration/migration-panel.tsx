import { useCallback, useEffect, useState } from "react";
import { DatabaseZap, Download, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildBackupBlob,
  readLocalDataBundle,
  readMigrationLog,
  type LocalDataBundle,
} from "@/features/data-migration/local-data";
import {
  buildPreview,
  isPreviewEmpty,
  totalCount,
  type MigrationPreview,
} from "@/features/data-migration/plan";
import {
  runMigration,
  type MigrationProgress,
  type MigrationResult,
} from "@/features/data-migration/migrate";

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Painel de migração dos dados locais (modo DEMO / localStorage) para o banco real.
 * Só aparece quando há dados locais ainda não migrados. Pensado para ser executado
 * UMA vez, no ambiente onde o modo REAL conecta ao Supabase (ex.: localhost com .env).
 */
export function MigrationPanel({ demoMode }: { demoMode: boolean }) {
  const [bundle, setBundle] = useState<LocalDataBundle | null>(null);
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);

  // localStorage só existe no cliente — lê após montar e a cada refresh.
  const refresh = useCallback(() => {
    const next = readLocalDataBundle();
    setBundle(next);
    setPreview(buildPreview(next, new Set(readMigrationLog().migratedIds ?? [])));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleMigrate = useCallback(async () => {
    if (!bundle) return;
    setRunning(true);
    setProgress(null);
    try {
      const outcome = await runMigration(bundle, setProgress);
      setResult(outcome);
      refresh();
      if (outcome.failed === 0) {
        toast.success(`${outcome.inserted} registro(s) migrado(s) para o banco real.`);
      } else {
        toast.warning(`${outcome.inserted} migrado(s), ${outcome.failed} com erro.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao migrar os dados locais.");
    } finally {
      setRunning(false);
    }
  }, [bundle, refresh]);

  if (!bundle || !preview || (isPreviewEmpty(preview) && !result)) return null;

  const counts: { label: string; value: number }[] = [
    { label: "Talhões", value: preview.talhoes.length },
    { label: "Perímetro", value: preview.farm.length },
    { label: "Eventos do talhão", value: preview.events.length },
    { label: "Alertas", value: preview.alerts.length },
    { label: "Eventos do calendário", value: preview.calendarEvents.length },
    { label: "Status do calendário", value: preview.calendarStatuses.length },
  ].filter((item) => item.value > 0);

  return (
    <section className="mt-6 rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <DatabaseZap className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h2 className="text-sm font-semibold">
              Dados locais não enviados ao banco ({totalCount(preview)})
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Há informações criadas no modo demonstração que estão apenas neste navegador. Migre-as
              para o banco real (Supabase) para ficarem disponíveis em produção para todos. Rode
              esta ação no ambiente onde o modo REAL conecta ao banco.
            </p>
          </div>
        </div>
        <Badge variant={demoMode ? "secondary" : "outline"}>
          {demoMode ? "App em DEMO" : "App em REAL"}
        </Badge>
      </div>

      {counts.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {counts.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
            >
              <strong>{item.value}</strong> {item.label}
            </span>
          ))}
        </div>
      ) : null}

      {demoMode ? (
        <p className="mt-3 rounded-md bg-amber-100/70 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          O app está em modo DEMO — a migração grava no banco real mesmo assim, mas confirme que o
          ambiente tem as variáveis do Supabase configuradas (senão a migração falhará).
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            downloadText(
              `nery-backup-dados-locais-${new Date().toISOString().slice(0, 10)}.json`,
              buildBackupBlob(bundle),
            )
          }
        >
          <Download className="h-4 w-4" />
          Baixar backup (JSON)
        </Button>
        <Button type="button" onClick={handleMigrate} disabled={running || isPreviewEmpty(preview)}>
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          {running ? "Migrando…" : "Migrar para o banco real"}
        </Button>
        {progress ? (
          <span className="text-xs text-muted-foreground">
            {progress.done}/{progress.total} — {progress.step}
          </span>
        ) : null}
      </div>

      {result ? (
        <div className="mt-4 rounded-lg border border-border bg-background p-3">
          <p className="text-sm font-medium">
            Resultado: {result.inserted} inserido(s)
            {result.failed > 0 ? `, ${result.failed} com erro` : ""}.
          </p>
          {result.errors.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-destructive">
              {result.errors.slice(0, 8).map((error) => (
                <li key={error.id}>
                  {error.module}: {error.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Confira os dados no Supabase (tabela <code>field_records</code>) e recarregue a página
              em modo REAL.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
