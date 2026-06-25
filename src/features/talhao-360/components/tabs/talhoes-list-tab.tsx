import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPinned, Search } from "lucide-react";
import type { FieldRecord } from "@/lib/supabase-field";
import { parseCycles } from "@/features/talhao-360/api/services";
import type { TalhaoPayload, TalhaoRecord } from "@/features/talhao-360/types/domain";
import { statusTone, vocacaoTone, VOCACAO_OPTIONS } from "@/features/talhao-360/types/domain";
import { cn } from "@/lib/utils";

function number(value?: string) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function area(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ha`;
}

export function TalhoesListTab({
  talhoes,
  records,
}: {
  talhoes: TalhaoRecord[];
  records: FieldRecord[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [crop, setCrop] = useState("Todas");
  const [season, setSeason] = useState("Todas");
  const [vocacao, setVocacao] = useState("Todas");
  const [alertsOnly, setAlertsOnly] = useState(false);

  const alertsByField = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of records) {
      if (record.module !== "talhao360-alert" || record.payload.status === "Resolvido") continue;
      const key = record.payload.talhao_id || record.payload.talhao;
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [records]);

  const filtered = talhoes.filter((item) => {
    const text = `${item.payload.talhao} ${item.payload.codigo}`.toLowerCase();
    const alertCount = alertsByField.get(item.id) ?? alertsByField.get(item.payload.talhao) ?? 0;
    return (
      text.includes(search.toLowerCase()) &&
      (status === "Todos" || item.payload.status === status) &&
      (crop === "Todas" || item.payload.cultura === crop) &&
      (season === "Todas" || item.payload.safra === season) &&
      (vocacao === "Todas" || (item.payload.vocacao || "Agricultura") === vocacao) &&
      (!alertsOnly || alertCount > 0)
    );
  });

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-7">
        <label className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou código"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
          />
        </label>
        <Filter
          value={status}
          onChange={setStatus}
          options={["Todos", ...unique(talhoes, "status")]}
        />
        <Filter
          value={crop}
          onChange={setCrop}
          options={["Todas", ...unique(talhoes, "cultura")]}
        />
        <Filter
          value={season}
          onChange={setSeason}
          options={["Todas", ...unique(talhoes, "safra")]}
        />
        <Filter value={vocacao} onChange={setVocacao} options={["Todas", ...VOCACAO_OPTIONS]} />
        <label className="flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm">
          <input
            type="checkbox"
            checked={alertsOnly}
            onChange={(event) => setAlertsOnly(event.target.checked)}
          />
          Com alertas
        </label>
      </div>

      {talhoes.length === 0 ? (
        <StateCard
          title="Nenhum talhão cadastrado"
          description="Cadastre o primeiro talhão usando a mesma estrutura de Áreas e Talhões do módulo Campo."
        />
      ) : filtered.length === 0 ? (
        <StateCard
          title="Nenhum resultado"
          description="Ajuste os filtros para visualizar outros talhões."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {[
                  "Talhão",
                  "Área",
                  "Cultura",
                  "Safra",
                  "Ciclo atual",
                  "Status",
                  "Vocação",
                  "Alertas",
                  "Última operação",
                  "",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const cycles = parseCycles(item.payload);
                const current = cycles.find((cycle) => cycle.status === "Em andamento");
                const event = records.find(
                  (record) =>
                    record.module === "talhao360-event" &&
                    (record.payload.talhao_id === item.id ||
                      record.payload.talhao === item.payload.talhao),
                );
                const alertCount =
                  alertsByField.get(item.id) ?? alertsByField.get(item.payload.talhao) ?? 0;
                return (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.payload.talhao}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.payload.codigo || "Sem código"}
                      </div>
                    </td>
                    <td className="px-4 py-3">{area(number(item.payload.area_ha))}</td>
                    <td className="px-4 py-3">{item.payload.cultura || "—"}</td>
                    <td className="px-4 py-3">{item.payload.safra || "—"}</td>
                    <td className="px-4 py-3">
                      {current?.nome || item.payload.ciclo_atual || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.payload.status || "Planejado"} />
                    </td>
                    <td className="px-4 py-3">
                      <VocacaoBadge vocacao={item.payload.vocacao} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(alertCount > 0 && "font-semibold text-destructive")}>
                        {alertCount}
                      </span>
                    </td>
                    <td className="max-w-48 truncate px-4 py-3">
                      {event?.payload.type || event?.payload.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/campo/talhoes/$fieldId"
                        params={{ fieldId: item.id }}
                        search={{ tab: "overview", seasonId: item.payload.safra || undefined }}
                        className="inline-flex h-9 items-center rounded-lg border border-primary/30 px-3 text-xs font-medium text-primary hover:bg-primary/5"
                      >
                        Abrir Talhão 360°
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function unique(talhoes: TalhaoRecord[], key: keyof TalhaoPayload) {
  return Array.from(new Set(talhoes.map((item) => item.payload[key]).filter(Boolean))) as string[];
}

function Filter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="inline-flex rounded-full border px-2 py-1 text-xs font-medium"
      style={{
        color: statusTone[status as keyof typeof statusTone] ?? "#64748b",
        borderColor: `${statusTone[status as keyof typeof statusTone] ?? "#64748b"}55`,
        backgroundColor: `${statusTone[status as keyof typeof statusTone] ?? "#64748b"}12`,
      }}
    >
      {status}
    </span>
  );
}

function VocacaoBadge({ vocacao }: { vocacao?: string }) {
  const value = (vocacao || "Agricultura") as keyof typeof vocacaoTone;
  const tone = vocacaoTone[value] ?? "#64748b";
  const label = value === "Integração lavoura-pecuária" ? "Integração" : value;
  return (
    <span
      className="inline-flex rounded-full border px-2 py-1 text-xs font-medium"
      style={{ color: tone, borderColor: `${tone}55`, backgroundColor: `${tone}12` }}
    >
      {label}
    </span>
  );
}

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="m-6 rounded-xl border border-dashed border-border p-10 text-center">
      <MapPinned className="mx-auto h-9 w-9 text-primary" />
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
