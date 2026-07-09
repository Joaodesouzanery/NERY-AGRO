import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Map as MapIcon, Sprout, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { RichTabKpis, RichTabPanel } from "@/components/rich-tab";
import { TalhaoMapOverview } from "@/features/talhao-360/map/talhao-map-overview";
import { parsePolygon, polygonAreaHa } from "@/features/talhao-360/map/geometry";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import {
  useAnimais,
  useConfig,
  useLotes,
  useOcupacoes,
  usePesagens,
  useTalhoes,
  groupPesagensByAnimal,
} from "@/features/pecuaria/hooks/use-pecuaria";
import { moverLote } from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import {
  diasDesde,
  faixaLotacao,
  lotacaoRecomendadaUAha,
  lotacaoUAha,
  ultimoPeso,
} from "@/features/pecuaria/lib/derived";
import { NDVI_DISPONIVEL, descansoMinimoDias } from "@/features/pecuaria/lib/apartacao-config";
import { Tag } from "@/features/pecuaria/components/tag";
import { OcupacaoTimeline } from "@/features/pecuaria/components/ocupacao-timeline";

type Camada = "lotacao" | "uso" | "ndvi";

const USO_COR = { pasto: "#16a34a", lavoura: "#d97706", descanso: "#64748b" } as const;

/** Área do talhão: prefere o valor declarado; cai para o cálculo do polígono. */
function areaHaDoTalhao(t: TalhaoRecord): number | null {
  const declarada = Number.parseFloat(t.payload.area_ha ?? "");
  if (Number.isFinite(declarada) && declarada > 0) return declarada;
  const poly = parsePolygon(t.payload.geometry_geojson);
  if (!poly) return null;
  const area = polygonAreaHa(poly.coordinates[0] as Array<[number, number]>);
  return area > 0 ? area : null;
}

export type TalhaoOcupado = {
  talhao: TalhaoRecord;
  areaHa: number | null;
  ocupacaoId: string | null;
  loteId: string | null;
  loteNome: string | null;
  cabecas: number;
  pesoVivoKg: number;
  uaHa: number | null;
  diasOcupacao: number | null;
  /** Dias desde a última saída (null = nunca ocupado). */
  diasDescanso: number | null;
  emLavoura: boolean;
};

export function PastosOcupacaoTab() {
  const queryClient = useQueryClient();
  const talhoesQ = useTalhoes();
  const ocupacoesQ = useOcupacoes();
  const lotesQ = useLotes();
  const animaisQ = useAnimais();
  const pesagensQ = usePesagens();
  const configQ = useConfig();

  const [camada, setCamada] = useState<Camada>("lotacao");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cfg = configQ.data;
  const talhoes = useMemo(() => talhoesQ.data ?? [], [talhoesQ.data]);
  const ocupacoes = useMemo(() => ocupacoesQ.data ?? [], [ocupacoesQ.data]);
  const lotes = useMemo(() => lotesQ.data ?? [], [lotesQ.data]);

  const pesoPorAnimal = useMemo(() => {
    const grupos = groupPesagensByAnimal(pesagensQ.data ?? []);
    const map = new Map<string, number>();
    for (const [animalId, ps] of grupos) {
      const peso = ultimoPeso(ps);
      if (peso !== null) map.set(animalId, peso);
    }
    return map;
  }, [pesagensQ.data]);

  const recomendada = useMemo(
    () =>
      cfg ? lotacaoRecomendadaUAha(cfg.ofertaForragemKgMsHaMes, cfg, cfg.diasPastejoPeriodo) : null,
    [cfg],
  );

  const linhas: TalhaoOcupado[] = useMemo(() => {
    const animais = animaisQ.data ?? [];
    return talhoes.map((talhao) => {
      const areaHa = areaHaDoTalhao(talhao);
      const aberta = ocupacoes.find((o) => o.talhao_id === talhao.id && !o.data_saida) ?? null;
      const fechadas = ocupacoes.filter((o) => o.talhao_id === talhao.id && o.data_saida);
      const ultimaSaida = fechadas
        .map((o) => o.data_saida as string)
        .sort((a, b) => b.localeCompare(a))[0];

      const lote = aberta ? (lotes.find((l) => l.id === aberta.lote_id) ?? null) : null;
      const doLote = lote
        ? animais.filter((a) => a.lote_id === lote.id && a.status === "ativo")
        : [];
      const pesoVivoKg = doLote.reduce((s, a) => s + (pesoPorAnimal.get(a.id) ?? 0), 0);
      const uaHa =
        areaHa && pesoVivoKg > 0 ? lotacaoUAha(pesoVivoKg, areaHa, cfg?.pesoUAkg ?? 450) : null;

      const cultura = (talhao.payload.cultura ?? "").toLowerCase();
      const emLavoura = !aberta && cultura !== "" && !cultura.includes("past");

      return {
        talhao,
        areaHa,
        ocupacaoId: aberta?.id ?? null,
        loteId: lote?.id ?? null,
        loteNome: lote?.nome ?? null,
        cabecas: doLote.length,
        pesoVivoKg,
        uaHa,
        diasOcupacao: aberta ? diasDesde(aberta.data_entrada) : null,
        diasDescanso: aberta ? null : ultimaSaida ? diasDesde(ultimaSaida) : null,
        emLavoura,
      };
    });
  }, [talhoes, ocupacoes, lotes, animaisQ.data, pesoPorAnimal, cfg?.pesoUAkg]);

  // Recolore os talhões conforme a camada — reusa TalhaoMapOverview sem alterá-lo.
  const talhoesColoridos = useMemo(
    () =>
      linhas.map(({ talhao, uaHa, ocupacaoId, emLavoura }) => {
        const cor =
          camada === "lotacao"
            ? faixaLotacao(uaHa).color
            : emLavoura
              ? USO_COR.lavoura
              : ocupacaoId
                ? USO_COR.pasto
                : USO_COR.descanso;
        return { ...talhao, payload: { ...talhao.payload, cor_mapa: cor } };
      }),
    [linhas, camada],
  );

  const selecionado = linhas.find((l) => l.talhao.id === selectedId) ?? null;

  // Rotação: talhão superlotado → destino em descanso suficiente e sem ocupação.
  const sugestoes = useMemo(() => {
    if (!cfg) return [];
    const livres = linhas.filter((l) => !l.ocupacaoId && !l.emLavoura && l.areaHa);
    return linhas
      .filter((l) => l.ocupacaoId && faixaLotacao(l.uaHa).id === "superlotado")
      .flatMap((origem) => {
        const destino = livres
          .filter((d) => {
            const min = descansoMinimoDias(d.talhao.payload.cultura, cfg);
            return d.diasDescanso === null || d.diasDescanso >= min;
          })
          .map((d) => ({
            ...d,
            uaResultante: lotacaoUAha(origem.pesoVivoKg, d.areaHa as number, cfg.pesoUAkg),
          }))
          .filter((d) => d.uaResultante !== null)
          .sort((a, b) => (a.uaResultante as number) - (b.uaResultante as number))[0];
        return destino ? [{ origem, destino }] : [];
      });
  }, [linhas, cfg]);

  const mover = useMutation({
    mutationFn: ({ loteId, talhaoId }: { loteId: string; talhaoId: string }) =>
      moverLote(loteId, talhaoId),
    onSuccess: () => {
      toast.success("Lote movimentado. Ocupação anterior encerrada.");
      void queryClient.invalidateQueries({ queryKey: pecKeys.ocupacoes() });
    },
    onError: (e: Error) => toast.error(`Falha ao movimentar: ${e.message}`),
  });

  const ocupados = linhas.filter((l) => l.ocupacaoId).length;
  const superlotados = linhas.filter(
    (l) => l.ocupacaoId && faixaLotacao(l.uaHa).id === "superlotado",
  ).length;
  const areaPasto = linhas.filter((l) => l.ocupacaoId).reduce((s, l) => s + (l.areaHa ?? 0), 0);

  if (talhoesQ.isLoading || configQ.isLoading) {
    return <RichTabPanel title="Pastos & Ocupação">Carregando…</RichTabPanel>;
  }

  if (!talhoes.length) {
    return (
      <RichTabPanel title="Pastos & Ocupação" description="Ocupação de talhões e lotação">
        <EmptyState
          title="Nenhum talhão cadastrado"
          description="Cadastre talhões no módulo Campo (Talhão 360°) para acompanhar ocupação e lotação."
          icon={Sprout}
        />
      </RichTabPanel>
    );
  }

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          { label: "Talhões ocupados", value: `${ocupados}/${talhoes.length}`, icon: MapIcon },
          { label: "Área em pasto", value: `${areaPasto.toLocaleString("pt-BR")} ha` },
          {
            label: "Superlotados",
            value: superlotados,
            icon: TriangleAlert,
            trendDir: superlotados ? "down" : "neutral",
          },
          {
            label: "Lotação recomendada",
            value: recomendada ? `${recomendada.toFixed(2)} UA/ha` : "—",
            hint: NDVI_DISPONIVEL ? undefined : "estimativa (sem NDVI)",
          },
        ]}
      />

      <RichTabPanel
        title="Mapa de ocupação"
        description="Mesma base do Talhão 360°, colorida pela camada escolhida"
        action={
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {(
              [
                { id: "lotacao", label: "Lotação" },
                { id: "uso", label: "Uso do solo" },
                { id: "ndvi", label: "NDVI" },
              ] as const
            ).map((c) => {
              const indisponivel = c.id === "ndvi" && !NDVI_DISPONIVEL;
              return (
                <button
                  key={c.id}
                  disabled={indisponivel}
                  onClick={() => setCamada(c.id)}
                  title={indisponivel ? "Sem fonte de NDVI no sistema" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    camada === c.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                    indisponivel && "cursor-not-allowed opacity-40 hover:bg-transparent",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <TalhaoMapOverview
            talhoes={talhoesColoridos}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <PainelTalhao
            linha={selecionado}
            recomendada={recomendada}
            onMover={(loteId, talhaoId) => mover.mutate({ loteId, talhaoId })}
            talhoesDestino={linhas.filter((l) => !l.ocupacaoId && l.talhao.id !== selectedId)}
            movendo={mover.isPending}
          />
        </div>
        <Legenda camada={camada} />
      </RichTabPanel>

      {sugestoes.length > 0 && (
        <RichTabPanel
          title="Sugestão de rotação"
          description={
            NDVI_DISPONIVEL
              ? "Talhões superlotados com queda de NDVI"
              : "Critério: apenas superlotação (sem NDVI, a queda de vigor não é avaliada)"
          }
        >
          <div className="space-y-2">
            {sugestoes.map(({ origem, destino }) => (
              <div
                key={origem.talhao.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3"
              >
                <div className="text-sm">
                  <span className="font-medium">{origem.talhao.payload.talhao}</span>{" "}
                  <Tag tone="danger">{origem.uaHa?.toFixed(2)} UA/ha</Tag>
                  <ArrowRightLeft className="mx-2 inline h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{destino.talhao.payload.talhao}</span>{" "}
                  <Tag tone="success">→ {destino.uaResultante?.toFixed(2)} UA/ha</Tag>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {destino.diasDescanso === null
                      ? "Destino nunca ocupado"
                      : `Destino em descanso há ${destino.diasDescanso} dias`}
                  </p>
                </div>
                <button
                  disabled={mover.isPending || !origem.loteId}
                  onClick={() =>
                    origem.loteId &&
                    mover.mutate({ loteId: origem.loteId, talhaoId: destino.talhao.id })
                  }
                  className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Programar rotação
                </button>
              </div>
            ))}
          </div>
        </RichTabPanel>
      )}

      <OcupacaoTimeline talhoes={talhoes} ocupacoes={ocupacoes} lotes={lotes} />
    </div>
  );
}

function Legenda({ camada }: { camada: Camada }) {
  const itens =
    camada === "lotacao"
      ? [
          { cor: "#64748b", label: "< 1,0 subutilizado" },
          { cor: "#16a34a", label: "1,0–1,6 ideal" },
          { cor: "#d97706", label: "1,6–1,9 atenção" },
          { cor: "#dc2626", label: "> 1,9 superlotado" },
        ]
      : [
          { cor: USO_COR.pasto, label: "Pasto (ocupado)" },
          { cor: USO_COR.lavoura, label: "Lavoura" },
          { cor: USO_COR.descanso, label: "Descanso" },
        ];
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {itens.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.cor }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function PainelTalhao({
  linha,
  recomendada,
  talhoesDestino,
  onMover,
  movendo,
}: {
  linha: TalhaoOcupado | null;
  recomendada: number | null;
  talhoesDestino: TalhaoOcupado[];
  onMover: (loteId: string, talhaoId: string) => void;
  movendo: boolean;
}) {
  const [destino, setDestino] = useState("");

  if (!linha) {
    return (
      <aside className="rounded-xl border border-border bg-card p-4">
        <EmptyState title="Selecione um talhão" description="Clique num polígono do mapa." />
      </aside>
    );
  }

  const faixa = faixaLotacao(linha.uaHa);
  return (
    <aside className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div>
        <h4 className="text-sm font-semibold">{linha.talhao.payload.talhao}</h4>
        <p className="text-xs text-muted-foreground">
          {linha.areaHa ? `${linha.areaHa.toLocaleString("pt-BR")} ha` : "Área não informada"}
          {linha.talhao.payload.cultura ? ` · ${linha.talhao.payload.cultura}` : ""}
        </p>
      </div>

      <dl className="space-y-1.5 text-sm">
        <Linha rotulo="Lote ocupante" valor={linha.loteNome ?? "Livre"} />
        <Linha rotulo="Cabeças" valor={linha.cabecas ? String(linha.cabecas) : "—"} />
        <Linha
          rotulo="Dias de ocupação"
          valor={linha.diasOcupacao !== null ? `${linha.diasOcupacao} d` : "—"}
        />
        <Linha
          rotulo="Descanso"
          valor={
            linha.ocupacaoId
              ? "—"
              : linha.diasDescanso !== null
                ? `${linha.diasDescanso} d`
                : "nunca ocupado"
          }
        />
        <div className="flex items-center justify-between gap-2 pt-1">
          <dt className="text-xs text-muted-foreground">UA/ha atual × recomendada</dt>
          <dd className="flex items-center gap-1.5">
            <span className="tabular-nums font-medium" style={{ color: faixa.color }}>
              {linha.uaHa !== null ? linha.uaHa.toFixed(2) : "—"}
            </span>
            <span className="text-muted-foreground">×</span>
            <span className="tabular-nums text-muted-foreground">
              {recomendada !== null ? recomendada.toFixed(2) : "—"}
            </span>
          </dd>
        </div>
        {linha.uaHa !== null && (
          <div className="pt-0.5">
            <Tag
              tone={
                faixa.id === "ideal"
                  ? "success"
                  : faixa.id === "superlotado"
                    ? "danger"
                    : faixa.id === "atencao"
                      ? "warning"
                      : "neutral"
              }
            >
              {faixa.label}
            </Tag>
          </div>
        )}
      </dl>

      {linha.loteId && (
        <div className="space-y-2 border-t border-border pt-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Movimentar lote para
          </label>
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
          >
            <option value="">Selecione o talhão destino…</option>
            {talhoesDestino.map((t) => (
              <option key={t.talhao.id} value={t.talhao.id}>
                {t.talhao.payload.talhao}
                {t.areaHa ? ` — ${t.areaHa} ha` : ""}
              </option>
            ))}
          </select>
          <button
            disabled={!destino || movendo}
            onClick={() => linha.loteId && onMover(linha.loteId, destino)}
            className="h-9 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {movendo ? "Movimentando…" : "Movimentar lote"}
          </button>
        </div>
      )}
    </aside>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm font-medium">{valor}</dd>
    </div>
  );
}
