import { useMemo, useState } from "react";
import { Layers, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tag } from "@/features/pecuaria/components/tag";
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
import { diasDesde, ultimoPeso } from "@/features/pecuaria/lib/derived";
import {
  FASE_LABEL,
  SISTEMA_LABEL,
  type Fase,
  type GmdAnimal,
  type PecAnimal,
  type PecLote,
  type PecPesagem,
  type Sistema,
} from "@/features/pecuaria/types/domain";

const FASE_STRIP: Record<Fase, string> = {
  cria: "bg-sky-500",
  recria: "bg-amber-500",
  engorda: "bg-violet-500",
  terminacao: "bg-emerald-500",
};

export function LotesTab() {
  const lotesQ = useLotes();
  const animaisQ = useAnimais();
  const pesagensQ = usePesagens();
  const gmdQ = useGmd();
  const carenciaQ = useCarencia();
  const sanitariosQ = useEventosSanitarios();
  const configQ = useConfig();

  const lotes = lotesQ.data ?? [];
  const animais = animaisQ.data ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [novoOpen, setNovoOpen] = useState(false);

  const pesagensMap = useMemo(() => groupPesagensByAnimal(pesagensQ.data ?? []), [pesagensQ.data]);
  const gmdMap = useMemo(() => gmdByAnimal(gmdQ.data ?? []), [gmdQ.data]);
  const carenciaMap = useMemo(() => carenciaByAnimal(carenciaQ.data ?? []), [carenciaQ.data]);
  const { data: rentabilidade } = useRentabilidadeLotes();

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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {lotes.length} {lotes.length === 1 ? "lote" : "lotes"}
        </p>
        <Button onClick={() => setNovoOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo lote
        </Button>
      </div>

      {lotes.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {lotes.map((lote) => (
            <LoteCard
              key={lote.id}
              lote={lote}
              animais={animais}
              pesagensMap={pesagensMap}
              gmdMap={gmdMap}
              carenciaMap={carenciaMap}
              metaDias={
                lote.fase ? (configQ.data?.metaDiasPorFase[lote.fase as Fase] ?? null) : null
              }
              custoArroba={rentabilidade.get(lote.id)?.custoArroba ?? null}
              onOpen={() => setSelectedId(lote.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum lote cadastrado"
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

      <NovoLoteModal open={novoOpen} onOpenChange={setNovoOpen} />
    </div>
  );
}

function LoteCard({
  lote,
  animais,
  pesagensMap,
  gmdMap,
  carenciaMap,
  metaDias,
  custoArroba,
  onOpen,
}: {
  lote: PecLote;
  animais: PecAnimal[];
  pesagensMap: Map<string, PecPesagem[]>;
  gmdMap: Map<string, GmdAnimal>;
  carenciaMap: Map<string, string>;
  metaDias: number | null;
  custoArroba: number | null;
  onOpen: () => void;
}) {
  const lista = animais.filter((a) => a.lote_id === lote.id);
  const pesos = lista
    .map((a) => ultimoPeso(pesagensMap.get(a.id) ?? []))
    .filter((v): v is number => v !== null);
  const pesoMedio = pesos.length ? pesos.reduce((s, v) => s + v, 0) / pesos.length : null;
  const gmds = lista
    .map((a) => gmdMap.get(a.id)?.gmd_medio ?? null)
    .filter((v): v is number => v !== null);
  const gmdMedioLote = gmds.length ? gmds.reduce((s, v) => s + v, 0) / gmds.length : null;

  const dias = diasDesde(lote.aberto_em) ?? 0;
  const progresso = metaDias && metaDias > 0 ? Math.min(1, dias / metaDias) : null;

  const temCarencia = lista.some((a) => carenciaMap.has(a.id));
  const ultimaPesagem = lista
    .flatMap((a) => pesagensMap.get(a.id) ?? [])
    .map((p) => p.data)
    .sort()
    .at(-1);
  const pesagemAtrasada =
    lista.length > 0 && (!ultimaPesagem || (diasDesde(ultimaPesagem) ?? 0) > 45);

  const strip = lote.fase ? FASE_STRIP[lote.fase as Fase] : "bg-border";

  return (
    <button
      onClick={onOpen}
      className="overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary/40"
    >
      <div className={cn("h-1", strip)} />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold tracking-tight">{lote.nome}</h3>
          <span className="text-xs text-muted-foreground">{dias}d de ciclo</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {lote.fase && <Tag tone="primary">{FASE_LABEL[lote.fase as Fase]}</Tag>}
          {lote.sistema && <Tag tone="neutral">{SISTEMA_LABEL[lote.sistema as Sistema]}</Tag>}
        </div>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <Metric label="Cabeças" value={lista.length.toLocaleString("pt-BR")} />
          <Metric
            label="Peso méd."
            value={pesoMedio !== null ? `${Math.round(pesoMedio)}kg` : "—"}
          />
          <Metric
            label="GMD"
            value={
              gmdMedioLote !== null
                ? gmdMedioLote.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                : "—"
            }
          />
          <Metric
            label="Custo/@"
            value={
              custoArroba !== null
                ? custoArroba.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    maximumFractionDigits: 0,
                  })
                : "—"
            }
          />
        </div>
        {progresso !== null && (
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progresso * 100}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {dias} / {metaDias} dias da meta da fase
            </div>
          </div>
        )}
        <div>
          {temCarencia ? (
            <Tag tone="danger">Carência ativa no lote</Tag>
          ) : pesagemAtrasada ? (
            <Tag tone="warning">Pesagem atrasada</Tag>
          ) : (
            <Tag tone="success">Sem alertas</Tag>
          )}
        </div>
      </div>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-medium tabular-nums">{value}</div>
    </div>
  );
}
