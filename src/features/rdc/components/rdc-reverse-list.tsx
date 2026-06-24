import { Link } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { useRdcByAnimal, useRdcByTalhao } from "@/features/rdc/hooks/use-rdc";
import type { RdcEntry } from "@/features/rdc/types/domain";

function fmtDate(value: string) {
  if (!value) return "";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("pt-BR");
}

function EntryList({ entries, emptyHint }: { entries: RdcEntry[]; emptyHint: string }) {
  if (!entries.length) return <p className="text-sm text-muted-foreground">{emptyHint}</p>;
  return (
    <ul className="space-y-2">
      {entries.slice(0, 8).map((entry) => (
        <li
          key={entry.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5 text-sm"
        >
          <div className="min-w-0">
            <div className="truncate font-medium">
              {entry.tipo} · {entry.descricao}
            </div>
            <div className="text-xs text-muted-foreground">
              {fmtDate(entry.data)}
              {entry.severidade ? ` · ${entry.severidade}` : ""}
            </div>
          </div>
          <Link
            to="/rdc/$id"
            params={{ id: entry.rdcId }}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            Abrir ficha
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Header() {
  return (
    <h2 className="mb-3 flex items-center gap-2 font-semibold">
      <ClipboardList className="h-4 w-4 text-primary" />
      Registros de RDC
    </h2>
  );
}

export function RdcByTalhaoPanel({ talhaoId }: { talhaoId: string }) {
  const { entries } = useRdcByTalhao(talhaoId);
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <Header />
      <EntryList entries={entries} emptyHint="Nenhum item de RDC vinculado a este talhão ainda." />
    </section>
  );
}

export function RdcByAnimalPanel({ animalId }: { animalId: string }) {
  const { entries } = useRdcByAnimal(animalId);
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <Header />
      <EntryList entries={entries} emptyHint="Nenhum item de RDC vinculado a este animal ainda." />
    </div>
  );
}
