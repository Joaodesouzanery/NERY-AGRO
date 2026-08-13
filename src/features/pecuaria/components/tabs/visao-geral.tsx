import { useMemo } from "react";
import { QrCode, Syringe } from "lucide-react";
import { AlertRow } from "@/components/alert-row";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/kpi-card";
import { RichBarList, RichTabPanel } from "@/components/rich-tab";
import { StatusPill } from "@/components/status-pill";
import { SummaryCard, TabLink } from "@/components/summary-card";
import type { PecuariaTab } from "@/features/pecuaria/schemas/navigation";
import {
  groupPesagensByAnimal,
  useAnimais,
  useCarencia,
  useConfig,
  useGmd,
  useLotes,
  usePesagens,
} from "@/features/pecuaria/hooks/use-pecuaria";
import { useRentabilidadeLotes } from "@/features/pecuaria/hooks/use-rentabilidade";
import { useOcupacaoLinhas } from "@/features/pecuaria/hooks/use-ocupacao-linhas";
import { useConformidadeResumo } from "@/features/pecuaria/hooks/use-conformidade-resumo";
import {
  diasEntre,
  faixaLotacao,
  projecaoAbate,
  ultimoPeso,
} from "@/features/pecuaria/lib/derived";
import { FASE_LABEL, type Fase } from "@/features/pecuaria/types/domain";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// Painel de comando do módulo: KPIs, o que bloqueia (carências), o que vem
// (abates projetados) e o número-chave de cada aba com link direto.
export function VisaoGeralTab({ onNavigateTab }: { onNavigateTab: (tab: PecuariaTab) => void }) {
  const lotesQ = useLotes();
  const animaisQ = useAnimais();
  const gmdQ = useGmd();
  const carenciaQ = useCarencia();
  const pesagensQ = usePesagens();
  const configQ = useConfig();
  const rentabilidade = useRentabilidadeLotes();
  const ocupacao = useOcupacaoLinhas();
  const conformidade = useConformidadeResumo();

  const lotes = useMemo(() => lotesQ.data ?? [], [lotesQ.data]);
  const animais = useMemo(() => animaisQ.data ?? [], [animaisQ.data]);
  const gmd = useMemo(() => gmdQ.data ?? [], [gmdQ.data]);
  const carencia = useMemo(() => carenciaQ.data ?? [], [carenciaQ.data]);

  const hoje = new Date().toISOString().slice(0, 10);

  const cabecasAtivas = animais.filter((a) => a.status === "ativo").length;
  const lotesAtivos = lotes.filter((l) => !l.encerrado_em).length;

  const gmdMedioRebanho = useMemo(() => {
    const valores = gmd.map((g) => g.gmd_medio).filter((v): v is number => v !== null);
    if (!valores.length) return null;
    return valores.reduce((s, v) => s + v, 0) / valores.length;
  }, [gmd]);

  const emCarencia = carencia.length;

  // Custo/@ médio do rebanho: total de custo ÷ total de arrobas dos lotes ativos.
  const financeiro = useMemo(() => {
    let custoTotal = 0;
    let arrobas = 0;
    let resultado = 0;
    for (const lote of lotes) {
      if (lote.encerrado_em) continue;
      const r = rentabilidade.data.get(lote.id);
      if (!r) continue;
      custoTotal += r.custoTotal;
      arrobas += r.arrobas;
      resultado += r.resultado ?? 0;
    }
    const custoArroba = arrobas > 0 ? custoTotal / arrobas : null;
    const preco = configQ.data?.precoArrobaVenda ?? null;
    const margemArroba = custoArroba !== null && preco !== null ? preco - custoArroba : null;
    return { custoArroba, margemArroba, resultado };
  }, [lotes, rentabilidade.data, configQ.data?.precoArrobaVenda]);

  // Rebanho por fase (conta animais ativos pela fase do lote).
  const porFase = useMemo(() => {
    const loteFase = new Map<string, Fase | null>();
    for (const l of lotes) loteFase.set(l.id, (l.fase as Fase | null) ?? null);
    const counts = new Map<string, number>();
    for (const a of animais) {
      if (a.status !== "ativo") continue;
      const fase = a.lote_id ? loteFase.get(a.lote_id) : null;
      const label = fase ? FASE_LABEL[fase] : "Sem fase";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [animais, lotes]);

  // Carências vencendo em ≤ 7 dias.
  const vencendo = useMemo(() => {
    const porAnimal = new Map(animais.map((a) => [a.id, a]));
    return carencia
      .map((c) => ({
        animalId: c.animal_id ?? "",
        dias: c.libera_em ? (diasEntre(hoje, c.libera_em) ?? 0) : 0,
      }))
      .filter((c) => c.dias >= 0 && c.dias <= 7)
      .sort((a, b) => a.dias - b.dias)
      .map((c) => {
        const animal = porAnimal.get(c.animalId);
        return {
          ...c,
          brinco: animal?.brinco_visual ?? "—",
          lote: lotes.find((l) => l.id === animal?.lote_id)?.nome,
        };
      });
  }, [carencia, animais, lotes, hoje]);

  // Próximas ações: abates projetados ≤ 30 dias + carências liberando hoje.
  const abatesProximos = useMemo(() => {
    const pesagensMap = groupPesagensByAnimal(pesagensQ.data ?? []);
    const gmdPorAnimal = new Map(gmd.map((g) => [g.animal_id ?? "", g.gmd_medio]));
    return lotes
      .filter((l) => !l.encerrado_em && l.peso_alvo_kg)
      .flatMap((lote) => {
        const doLote = animais.filter((a) => a.lote_id === lote.id && a.status === "ativo");
        if (!doLote.length) return [];
        const pesos = doLote
          .map((a) => ultimoPeso(pesagensMap.get(a.id) ?? []))
          .filter((v): v is number => v !== null);
        const gmds = doLote
          .map((a) => gmdPorAnimal.get(a.id) ?? null)
          .filter((v): v is number => v !== null);
        if (!pesos.length || !gmds.length) return [];
        const pesoMedio = pesos.reduce((s, v) => s + v, 0) / pesos.length;
        const gmdLote = gmds.reduce((s, v) => s + v, 0) / gmds.length;
        const proj = projecaoAbate(pesoMedio, lote.peso_alvo_kg, gmdLote);
        if (!proj || proj.dias > 30) return [];
        return [{ lote, pesoMedio, dias: proj.dias }];
      })
      .sort((a, b) => a.dias - b.dias)
      .slice(0, 3);
  }, [lotes, animais, gmd, pesagensQ.data]);

  const liberamHoje = vencendo.filter((c) => c.dias === 0).length;
  const superlotados = ocupacao.linhas.filter(
    (l) => l.ocupacaoId && faixaLotacao(l.uaHa).id === "superlotado",
  ).length;
  const ocupados = ocupacao.linhas.filter((l) => l.ocupacaoId).length;

  const fmtGmd = (v: number | null) =>
    v === null ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Cabeças ativas" value={cabecasAtivas.toLocaleString("pt-BR")} hero />
        <KpiCard label="Lotes ativos" value={lotesAtivos.toLocaleString("pt-BR")} />
        <KpiCard label="GMD médio" value={fmtGmd(gmdMedioRebanho)} unit="kg/dia" />
        <KpiCard
          label="Em carência"
          value={emCarencia.toLocaleString("pt-BR")}
          state={emCarencia > 0 ? "warning" : undefined}
          support={emCarencia ? "bloqueados p/ abate ou venda" : "nenhum bloqueio"}
        />
        <KpiCard
          label="Custo/@ médio"
          value={financeiro.custoArroba === null ? "—" : brl(financeiro.custoArroba)}
          support={
            financeiro.margemArroba === null
              ? "sem custos lançados"
              : `margem média ${brl(financeiro.margemArroba)}/@`
          }
        />
      </div>

      <RichTabPanel
        title="Carências vencendo"
        description="Liberação para abate/venda nos próximos 7 dias"
        action={<TabLink onClick={() => onNavigateTab("rebanho")}>Ver rebanho →</TabLink>}
      >
        {vencendo.length ? (
          <div className="space-y-2">
            {vencendo.slice(0, 5).map((c) => (
              <AlertRow
                key={c.animalId}
                tone={c.dias <= 2 ? "destructive" : "warning"}
                title={`Brinco ${c.brinco}${c.lote ? ` · ${c.lote}` : ""}`}
                aside={
                  <StatusPill tone={c.dias <= 2 ? "destructive" : "warning"}>
                    {c.dias === 0 ? "libera hoje" : `libera em ${c.dias}d`}
                  </StatusPill>
                }
              />
            ))}
            {vencendo.length > 5 && (
              <p className="text-xs text-muted-foreground">
                + {vencendo.length - 5} animais com liberação na semana.
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma carência vencendo"
            description="Nenhum animal com liberação nos próximos 7 dias."
            icon={Syringe}
          />
        )}
      </RichTabPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel
          title="Próximas ações"
          description="Abates projetados e liberações derivados do rebanho"
        >
          {abatesProximos.length || liberamHoje ? (
            <div className="space-y-2">
              {abatesProximos.map(({ lote, pesoMedio, dias }) => (
                <AlertRow
                  key={lote.id}
                  tone="info"
                  title={`${lote.nome} — abate projetado ${dias === 0 ? "hoje" : `em ${dias} dias`}`}
                  support={`peso médio ${pesoMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kg · meta ${lote.peso_alvo_kg} kg`}
                  actions={<TabLink onClick={() => onNavigateTab("lotes")}>Ver lote →</TabLink>}
                />
              ))}
              {liberamHoje > 0 && (
                <AlertRow
                  tone="info"
                  title={`${liberamHoje} ${liberamHoje === 1 ? "animal libera" : "animais liberam"} carência hoje`}
                  support="aptos para venda"
                  actions={
                    <TabLink onClick={() => onNavigateTab("rebanho")}>Ver rebanho →</TabLink>
                  }
                />
              )}
            </div>
          ) : (
            <EmptyState
              title="Sem ações previstas"
              description="Nenhum lote perto da meta de abate nos próximos 30 dias."
              icon={QrCode}
            />
          )}
        </RichTabPanel>
        <RichTabPanel title="Rebanho por fase" description="Cabeças ativas por fase do lote">
          {porFase.length ? (
            <RichBarList items={porFase} />
          ) : (
            <EmptyState title="Sem animais cadastrados" icon={QrCode} />
          )}
        </RichTabPanel>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Resultados"
          value={brl(financeiro.resultado)}
          support={
            financeiro.custoArroba === null
              ? "sem custos lançados no período"
              : `custo médio ${brl(financeiro.custoArroba)}/@`
          }
          onOpen={() => onNavigateTab("resultados")}
        />
        <SummaryCard
          label="Rastreabilidade"
          value={`${conformidade.arrobasEmRisco.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} @ fora do prêmio`}
          support={`${conformidade.gtaSemNfe.length} ${conformidade.gtaSemNfe.length === 1 ? "GTA" : "GTAs"} sem NF-e`}
          onOpen={() => onNavigateTab("rastreabilidade")}
        />
        <SummaryCard
          label="Pastos"
          value={`${superlotados} ${superlotados === 1 ? "superlotado" : "superlotados"}`}
          support={`${ocupados} de ${ocupacao.linhas.length} talhões ocupados`}
          onOpen={() => onNavigateTab("pastos")}
        />
      </div>
    </div>
  );
}
