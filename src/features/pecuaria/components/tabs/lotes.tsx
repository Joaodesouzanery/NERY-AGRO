import { useMemo, useState } from "react";
import { Layers, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { SectionLabel } from "@/components/section-label";
import { Segmented } from "@/components/segmented";
import { StatusPill, type StatusPillTone } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoteDetail } from "@/features/pecuaria/components/lote-detail";
import { NovoLoteModal } from "@/features/pecuaria/components/novo-lote-modal";
import {
  useAnimais,
  useCarencia,
  useConfig,
  useEventosSanitarios,
  useGmd,
  useLotes,
  usePesagens,
  carenciaByAnimal,
  gmdByAnimal,
  groupPesagensByAnimal,
} from "@/features/pecuaria/hooks/use-pecuaria";
import { useRentabilidadeLotes } from "@/features/pecuaria/hooks/use-rentabilidade";
import {
  DIAS_PESAGEM_ATRASADA,
  diasDesde,
  emCarencia,
  ultimoPeso,
} from "@/features/pecuaria/lib/derived";
import { FASE_LABEL, type Fase, type PecLote } from "@/features/pecuaria/types/domain";

const FASE_ALL = "todas";
const VIEW_KEY = "pec-lotes-view";

type View = "cards" | "lista";
type LoteStatus = "carencia" | "pesagem" | "em-dia";

const STATUS_META: Record<LoteStatus, { label: string; tone: StatusPillTone; ordem: number }> = {
  carencia: { label: "carência ativa", tone: "destructive", ordem: 0 },
  pesagem: { label: "pesagem atrasada", tone: "warning", ordem: 1 },
  "em-dia": { label: "em dia", tone: "muted", ordem: 2 },
};

type LoteLinha = {
  lote: PecLote;
  cabecas: number;
  pesoMedio: number | null;
  gmdMedio: number | null;
  custoArroba: number | null;
  dias: number;
  metaDias: number | null;
  status: LoteStatus;
  carenciaAte: string | null;
  diasUltimaPesagem: number | null;
};

const brl0 = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function LotesTab() {
  const lotesQ = useLotes();
  const animaisQ = useAnimais();
  const pesagensQ = usePesagens();
  const gmdQ = useGmd();
  const carenciaQ = useCarencia();
  const sanitariosQ = useEventosSanitarios();
  const configQ = useConfig();

  const lotes = useMemo(() => lotesQ.data ?? [], [lotesQ.data]);
  const animais = useMemo(() => animaisQ.data ?? [], [animaisQ.data]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [novoOpen, setNovoOpen] = useState(false);
  const [fase, setFase] = useState<string>(FASE_ALL);
  const [view, setView] = useState<View>(() => {
    if (typeof window === "undefined") return "cards";
    return window.localStorage.getItem(VIEW_KEY) === "lista" ? "lista" : "cards";
  });
  const changeView = (next: View) => {
    setView(next);
    if (typeof window !== "undefined") window.localStorage.setItem(VIEW_KEY, next);
  };

  const pesagensMap = useMemo(() => groupPesagensByAnimal(pesagensQ.data ?? []), [pesagensQ.data]);
  const gmdMap = useMemo(() => gmdByAnimal(gmdQ.data ?? []), [gmdQ.data]);
  const carenciaMap = useMemo(() => carenciaByAnimal(carenciaQ.data ?? []), [carenciaQ.data]);
  const { data: rentabilidade } = useRentabilidadeLotes();

  const linhas: LoteLinha[] = useMemo(
    () =>
      lotes.map((lote) => {
        const lista = animais.filter((a) => a.lote_id === lote.id);
        const pesos = lista
          .map((a) => ultimoPeso(pesagensMap.get(a.id) ?? []))
          .filter((v): v is number => v !== null);
        const gmds = lista
          .map((a) => gmdMap.get(a.id)?.gmd_medio ?? null)
          .filter((v): v is number => v !== null);

        const carencias = lista
          .map((a) => carenciaMap.get(a.id))
          .filter((v): v is string => Boolean(v) && emCarencia(v ?? null));
        const carenciaAte = carencias.length ? [...carencias].sort().at(-1)! : null;

        const ultimaPesagem = lista
          .flatMap((a) => pesagensMap.get(a.id) ?? [])
          .map((p) => p.data)
          .sort()
          .at(-1);
        const diasUltimaPesagem = ultimaPesagem ? diasDesde(ultimaPesagem) : null;
        const pesagemAtrasada =
          lista.length > 0 && (!ultimaPesagem || (diasUltimaPesagem ?? 0) > DIAS_PESAGEM_ATRASADA);

        return {
          lote,
          cabecas: lista.length,
          pesoMedio: pesos.length ? pesos.reduce((s, v) => s + v, 0) / pesos.length : null,
          gmdMedio: gmds.length ? gmds.reduce((s, v) => s + v, 0) / gmds.length : null,
          custoArroba: rentabilidade.get(lote.id)?.custoArroba ?? null,
          dias: diasDesde(lote.aberto_em) ?? 0,
          metaDias: lote.fase ? (configQ.data?.metaDiasPorFase[lote.fase as Fase] ?? null) : null,
          status: carenciaAte ? "carencia" : pesagemAtrasada ? "pesagem" : "em-dia",
          carenciaAte,
          diasUltimaPesagem,
        } satisfies LoteLinha;
      }),
    [lotes, animais, pesagensMap, gmdMap, carenciaMap, rentabilidade, configQ.data],
  );

  const filtradas = useMemo(
    () =>
      [...linhas]
        .filter((l) => fase === FASE_ALL || l.lote.fase === fase)
        .sort(
          (a, b) =>
            STATUS_META[a.status].ordem - STATUS_META[b.status].ordem ||
            a.lote.nome.localeCompare(b.lote.nome),
        ),
    [linhas, fase],
  );
  const urgentes = filtradas.filter((l) => l.status !== "em-dia");
  const emDia = filtradas.filter((l) => l.status === "em-dia");

  const selected = lotes.find((l) => l.id === selectedId) ?? null;
  if (selected) {
    return (
      <LoteDetail
        lote={selected}
        animais={animais}
        pesagensMap={pesagensMap}
        gmdMap={gmdMap}
        carenciaMap={carenciaMap}
        sanitarios={sanitariosQ.data ?? []}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          aria-label="Filtrar por fase"
          value={fase}
          onChange={setFase}
          options={[
            { value: FASE_ALL, label: "Todas as fases" },
            ...(Object.entries(FASE_LABEL) as [Fase, string][]).map(([value, label]) => ({
              value: value as string,
              label,
            })),
          ]}
        />
        <div className="flex items-center gap-2">
          <Segmented
            aria-label="Modo de exibição"
            value={view}
            onChange={changeView}
            options={[
              { value: "cards", label: "Cards" },
              { value: "lista", label: "Lista" },
            ]}
          />
          <Button onClick={() => setNovoOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo lote
          </Button>
        </div>
      </div>

      {!filtradas.length && (
        <EmptyState
          title="Nenhum lote nesta fase"
          description="Crie um lote para organizar o rebanho por fase e sistema."
          icon={Layers}
          action={
            <Button onClick={() => setNovoOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo lote
            </Button>
          }
        />
      )}

      {view === "lista" && filtradas.length > 0 && (
        <ListaLotes linhas={filtradas} onOpen={setSelectedId} />
      )}

      {view === "cards" && urgentes.length > 0 && (
        <>
          <SectionLabel>Precisa de ação</SectionLabel>
          <div className="grid gap-3 md:grid-cols-2">
            {urgentes.map((l) => (
              <LoteCardUrgente key={l.lote.id} linha={l} onOpen={() => setSelectedId(l.lote.id)} />
            ))}
          </div>
        </>
      )}

      {view === "cards" && emDia.length > 0 && (
        <>
          <SectionLabel>Sem alertas</SectionLabel>
          <div className="grid gap-3 md:grid-cols-2">
            {emDia.map((l) => (
              <LoteCardEmDia key={l.lote.id} linha={l} onOpen={() => setSelectedId(l.lote.id)} />
            ))}
          </div>
        </>
      )}

      <NovoLoteModal open={novoOpen} onOpenChange={setNovoOpen} />
    </div>
  );
}

function MetricaInline({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="font-heading mt-1.5 text-lg font-semibold leading-none tabular-nums">
        {value}
        {unit && (
          <span className="font-display text-xs font-medium tracking-normal text-muted-foreground">
            {" "}
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

/** Card com borda tingida pelo estado e 4 métricas inline (lotes com alerta). */
function LoteCardUrgente({ linha, onOpen }: { linha: LoteLinha; onOpen: () => void }) {
  const meta = STATUS_META[linha.status];
  return (
    <button
      onClick={onOpen}
      className={cn(
        "rounded-md border bg-card px-5 py-[18px] text-left transition-colors hover:bg-accent/30",
        linha.status === "carencia" ? "border-destructive/40" : "border-warning/35",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold">{linha.lote.nome}</span>
        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-x-8 gap-y-3">
        <MetricaInline label="Cabeças" value={linha.cabecas.toLocaleString("pt-BR")} />
        <MetricaInline
          label="GMD"
          value={
            linha.gmdMedio !== null
              ? linha.gmdMedio.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
              : "—"
          }
          unit={linha.gmdMedio !== null ? "kg/dia" : undefined}
        />
        <MetricaInline
          label="Custo/@"
          value={linha.custoArroba !== null ? brl0(linha.custoArroba) : "—"}
        />
        {linha.status === "carencia" ? (
          <MetricaInline label="Carência até" value={dataCurta(linha.carenciaAte)} />
        ) : (
          <MetricaInline
            label="Últ. pesagem"
            value={linha.diasUltimaPesagem !== null ? `${linha.diasUltimaPesagem} dias` : "nunca"}
          />
        )}
      </div>
    </button>
  );
}

/** Card calmo: pill muted "em dia" + progresso da meta da fase. */
function LoteCardEmDia({ linha, onOpen }: { linha: LoteLinha; onOpen: () => void }) {
  const progresso =
    linha.metaDias && linha.metaDias > 0 ? Math.min(1, linha.dias / linha.metaDias) : null;
  return (
    <button
      onClick={onOpen}
      className="rounded-md border border-border bg-card px-5 py-[18px] text-left transition-colors hover:bg-accent/30"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold">{linha.lote.nome}</span>
        <StatusPill tone="muted">em dia</StatusPill>
      </div>
      <div className="mt-3.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {linha.lote.fase ? `Meta da fase · ${FASE_LABEL[linha.lote.fase as Fase]}` : "Ciclo"}
        </span>
        <span className="tabular-nums">
          {linha.metaDias ? `${linha.dias} / ${linha.metaDias} dias` : `${linha.dias} dias`}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-success"
          style={{ width: `${(progresso ?? 0) * 100}%` }}
        />
      </div>
    </button>
  );
}

function ListaLotes({ linhas, onOpen }: { linhas: LoteLinha[]; onOpen: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <Th>Lote</Th>
            <Th>Fase</Th>
            <Th className="text-right">Cabeças</Th>
            <Th className="text-right">Peso méd.</Th>
            <Th className="text-right">GMD</Th>
            <Th className="text-right">Custo/@</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const meta = STATUS_META[l.status];
            return (
              <tr
                key={l.lote.id}
                onClick={() => onOpen(l.lote.id)}
                className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50"
              >
                <td className="px-3 py-2.5 font-medium">{l.lote.nome}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {l.lote.fase ? FASE_LABEL[l.lote.fase as Fase] : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{l.cabecas}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {l.pesoMedio !== null ? `${Math.round(l.pesoMedio)} kg` : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {l.gmdMedio !== null
                    ? l.gmdMedio.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                    : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {l.custoArroba !== null ? brl0(l.custoArroba) : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("h-10 px-3 text-left text-sm font-medium text-muted-foreground", className)}>
      {children}
    </th>
  );
}

function dataCurta(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}
