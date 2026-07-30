import { useMemo } from "react";
import { Syringe } from "lucide-react";
import { ModuleOverview } from "@/components/module-overview";
import { RichTabPanel } from "@/components/rich-tab";
import { EmptyState } from "@/components/empty-state";
import { buildPecuariaOverview } from "@/lib/overview/pecuaria";
import { useDemoMode } from "@/hooks/use-demo-mode";
import {
  useAnimais,
  useCarencia,
  useConfig,
  useEventosReprodutivos,
  useEventosSanitarios,
  useGmd,
  useGta,
  useLotes,
  useOcupacoes,
  usePesagens,
  useProducao,
  useTalhoes,
  carenciaByAnimal,
  gmdByAnimal,
  groupPesagensByAnimal,
} from "@/features/pecuaria/hooks/use-pecuaria";
import { useRentabilidadeLotes } from "@/features/pecuaria/hooks/use-rentabilidade";
import { diasEntre } from "@/features/pecuaria/lib/derived";
import { Tag } from "@/features/pecuaria/components/tag";

// A visão geral é o dashboard do módulo inteiro: KPIs e gráficos das 6 abas
// saem de `buildPecuariaOverview` (dado puro, reusando as libs de custo,
// lotação, reprodução e conformidade). O que continua aqui é o que o spec não
// cobre por ser lista acionável e não agregação: as carências prestes a vencer.

export function VisaoGeralTab({ onSelectTab }: { onSelectTab?: (tabId: string) => void }) {
  const { demoMode } = useDemoMode();
  const lotesQ = useLotes();
  const animaisQ = useAnimais();
  const pesagensQ = usePesagens();
  const gmdQ = useGmd();
  const carenciaQ = useCarencia();
  const sanitariosQ = useEventosSanitarios();
  const reprodutivosQ = useEventosReprodutivos();
  const producaoQ = useProducao();
  const gtaQ = useGta();
  const ocupacoesQ = useOcupacoes();
  const talhoesQ = useTalhoes();
  const configQ = useConfig();
  const { data: rentabilidade } = useRentabilidadeLotes();

  const animais = useMemo(() => animaisQ.data ?? [], [animaisQ.data]);
  const carencia = useMemo(() => carenciaQ.data ?? [], [carenciaQ.data]);

  const pesagensPorAnimal = useMemo(
    () => groupPesagensByAnimal(pesagensQ.data ?? []),
    [pesagensQ.data],
  );
  const gmdPorAnimal = useMemo(() => gmdByAnimal(gmdQ.data ?? []), [gmdQ.data]);
  const carenciaPorAnimal = useMemo(() => carenciaByAnimal(carencia), [carencia]);

  const spec = useMemo(
    () =>
      buildPecuariaOverview(
        {
          lotes: lotesQ.data ?? [],
          animais,
          pesagensPorAnimal,
          gmdPorAnimal,
          carenciaPorAnimal,
          sanitarios: sanitariosQ.data ?? [],
          reprodutivos: reprodutivosQ.data ?? [],
          producao: producaoQ.data ?? [],
          gta: gtaQ.data ?? [],
          ocupacoes: ocupacoesQ.data ?? [],
          talhoes: talhoesQ.data ?? [],
          rentabilidade,
          config: configQ.data,
        },
        demoMode,
      ),
    [
      demoMode,
      lotesQ.data,
      animais,
      pesagensPorAnimal,
      gmdPorAnimal,
      carenciaPorAnimal,
      sanitariosQ.data,
      reprodutivosQ.data,
      producaoQ.data,
      gtaQ.data,
      ocupacoesQ.data,
      talhoesQ.data,
      rentabilidade,
      configQ.data,
    ],
  );

  // Carências vencendo em ≤ 7 dias — lista de brincos, não agregação.
  const hoje = new Date().toISOString().slice(0, 10);
  const vencendo = useMemo(() => {
    const brinco = new Map<string, string>();
    for (const a of animais) brinco.set(a.id, a.brinco_visual ?? "—");
    return carencia
      .map((c) => ({
        animalId: c.animal_id ?? "",
        liberaEm: c.libera_em ?? "",
        dias: c.libera_em ? (diasEntre(hoje, c.libera_em) ?? 0) : 0,
      }))
      .filter((c) => c.dias >= 0 && c.dias <= 7)
      .sort((a, b) => a.dias - b.dias)
      .map((c) => ({ ...c, brinco: brinco.get(c.animalId) ?? "—" }));
  }, [carencia, animais, hoje]);

  return (
    <div className="space-y-5">
      <ModuleOverview spec={spec} onSelectTab={onSelectTab} />

      <RichTabPanel
        title="Carências vencendo"
        description="Liberação para abate/venda nos próximos 7 dias"
      >
        {vencendo.length ? (
          <ul className="divide-y divide-border text-sm">
            {vencendo.map((c) => (
              <li key={c.animalId} className="flex items-center justify-between gap-3 py-2">
                <span className="flex items-center gap-2">
                  <Syringe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Brinco {c.brinco}</span>
                </span>
                <Tag tone={c.dias <= 2 ? "danger" : "warning"}>
                  {c.dias === 0 ? "libera hoje" : `libera em ${c.dias}d`}
                </Tag>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nenhuma carência vencendo"
            description="Nenhum animal com liberação nos próximos 7 dias."
            icon={Syringe}
          />
        )}
      </RichTabPanel>
    </div>
  );
}
