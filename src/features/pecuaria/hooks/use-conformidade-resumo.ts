import { useMemo } from "react";
import {
  useAnimais,
  useConfig,
  useEventosSanitarios,
  useGta,
  usePesagens,
  groupPesagensByAnimal,
} from "@/features/pecuaria/hooks/use-pecuaria";
import {
  avaliarConformidade,
  ehAnabolizante,
  riscoEmArrobas,
} from "@/features/pecuaria/lib/conformidade";
import { arrobasCarcaca } from "@/features/pecuaria/lib/custos";
import { idadeMeses, ultimoPeso } from "@/features/pecuaria/lib/derived";

/**
 * Avaliação de conformidade + risco em arrobas — usada pela aba Rastreabilidade
 * e pelo resumo da Visão Geral ("@ fora do prêmio", GTAs sem NF-e).
 */
export function useConformidadeResumo() {
  const animaisQ = useAnimais();
  const pesagensQ = usePesagens();
  const sanitariosQ = useEventosSanitarios();
  const gtaQ = useGta();
  const configQ = useConfig();

  const pesagensMap = useMemo(() => groupPesagensByAnimal(pesagensQ.data ?? []), [pesagensQ.data]);
  const rendimento = configQ.data?.rendimentoCarcacaPct ?? 0.52;

  const animaisComAnabolizante = useMemo(() => {
    const set = new Set<string>();
    for (const e of sanitariosQ.data ?? []) {
      if (e.animal_id && ehAnabolizante(e.produto)) set.add(e.animal_id);
    }
    return set;
  }, [sanitariosQ.data]);

  const avaliacoes = useMemo(() => {
    const animais = (animaisQ.data ?? []).filter(
      (a) => a.status === "ativo" || a.status === "apto_abate",
    );
    return animais.map((animal) => {
      const peso = ultimoPeso(pesagensMap.get(animal.id) ?? []);
      const conformidade = avaliarConformidade(animal, {
        temAnabolizante: animaisComAnabolizante.has(animal.id),
        idadeMesesNoAbate: idadeMeses(animal.nascimento),
      });
      return {
        animal,
        conformidade,
        arrobas: peso ? arrobasCarcaca(peso, rendimento) : 0,
      };
    });
  }, [animaisQ.data, pesagensMap, animaisComAnabolizante, rendimento]);

  const riscos = useMemo(() => riscoEmArrobas(avaliacoes), [avaliacoes]);
  const gtaSemNfe = useMemo(
    () => (gtaQ.data ?? []).filter((g) => !g.nfe_vinculada?.trim()),
    [gtaQ.data],
  );

  return {
    avaliacoes,
    riscos,
    totalPendencias: riscos.reduce((s, r) => s + r.animais, 0),
    arrobasEmRisco: riscos.reduce((s, r) => s + r.arrobas, 0),
    gtaSemNfe,
    gtas: gtaQ.data ?? [],
    isLoading: animaisQ.isLoading || pesagensQ.isLoading,
  };
}
