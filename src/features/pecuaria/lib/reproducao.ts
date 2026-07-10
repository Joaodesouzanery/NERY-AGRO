// Métricas reprodutivas — funções puras. Nada persistido: taxa de prenhez, DG
// pendente, IEP e previsão de parto saem sempre de pec_evento_reprodutivo.

/** Gestação bovina: 285 dias da concepção ao parto. */
export const GESTACAO_DIAS = 285;

/** Protocolo IATF padrão (D0–D11), editável pelo gestor. */
export const PROTOCOLO_IATF_PADRAO = [
  { dia: 0, acao: "Implante de progesterona + benzoato de estradiol" },
  { dia: 8, acao: "Retirada do implante + PGF2α + eCG + cipionato" },
  { dia: 10, acao: "Inseminação artificial em tempo fixo" },
  { dia: 11, acao: "Fim do protocolo" },
] as const;

export type EventoRepro = {
  animal_id: string | null;
  tipo: string | null;
  resultado: string | null;
  data: string;
};

function addDias(iso: string, dias: number): string {
  const t = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(t)) return iso;
  return new Date(t + dias * 86_400_000).toISOString().slice(0, 10);
}

const ehPositivo = (r: string | null) => (r ?? "").toLowerCase().startsWith("pos");

/** Taxa de prenhez = DG positivos ÷ total de DG realizados. null se não houve DG. */
export function taxaPrenhez(eventos: EventoRepro[]): number | null {
  const dgs = eventos.filter((e) => e.tipo === "dg");
  if (!dgs.length) return null;
  return dgs.filter((e) => ehPositivo(e.resultado)).length / dgs.length;
}

/**
 * Animais com inseminação/monta sem DG posterior — o DG está pendente.
 * Retorna os animal_id distintos.
 */
export function dgPendente(eventos: EventoRepro[]): string[] {
  const coberturas = new Map<string, string>(); // animal → data da última cobertura
  for (const e of eventos) {
    if (!e.animal_id) continue;
    if (e.tipo === "iatf" || e.tipo === "monta") {
      const atual = coberturas.get(e.animal_id);
      if (!atual || e.data > atual) coberturas.set(e.animal_id, e.data);
    }
  }
  const pendentes: string[] = [];
  for (const [animalId, dataCobertura] of coberturas) {
    const temDgDepois = eventos.some(
      (e) => e.animal_id === animalId && e.tipo === "dg" && e.data >= dataCobertura,
    );
    if (!temDgDepois) pendentes.push(animalId);
  }
  return pendentes;
}

export type PrevisaoParto = { animal_id: string; previsto: string };

/**
 * Previsão de parto: DG positivo + 285 dias contados da cobertura anterior.
 * Uma previsão POR ANIMAL — reconfirmar a gestação com um segundo DG positivo
 * não cria uma segunda gestação. Vale o DG positivo mais recente.
 */
export function previsoesParto(eventos: EventoRepro[]): PrevisaoParto[] {
  const porAnimal = new Map<string, PrevisaoParto>();
  const dgsPositivos = eventos
    .filter((e) => e.tipo === "dg" && ehPositivo(e.resultado) && e.animal_id)
    .sort((a, b) => a.data.localeCompare(b.data)); // mais recente sobrescreve

  for (const dg of dgsPositivos) {
    const animalId = dg.animal_id as string;
    // Já pariu depois desse DG? Então a gestação terminou.
    const jaPariu = eventos.some(
      (e) => e.animal_id === animalId && e.tipo === "parto" && e.data > dg.data,
    );
    if (jaPariu) {
      porAnimal.delete(animalId);
      continue;
    }
    const cobertura = eventos
      .filter(
        (e) =>
          e.animal_id === animalId &&
          (e.tipo === "iatf" || e.tipo === "monta") &&
          e.data <= dg.data,
      )
      .sort((a, b) => b.data.localeCompare(a.data))[0];
    const base = cobertura?.data ?? dg.data;
    porAnimal.set(animalId, { animal_id: animalId, previsto: addDias(base, GESTACAO_DIAS) });
  }
  return [...porAnimal.values()];
}

/**
 * IEP (intervalo entre partos) médio, em dias — média das diferenças entre
 * partos consecutivos do mesmo animal. null se ninguém tem 2 partos.
 */
export function iepMedioDias(eventos: EventoRepro[]): number | null {
  const partosPorAnimal = new Map<string, string[]>();
  for (const e of eventos) {
    if (e.tipo !== "parto" || !e.animal_id) continue;
    const lista = partosPorAnimal.get(e.animal_id) ?? [];
    lista.push(e.data);
    partosPorAnimal.set(e.animal_id, lista);
  }
  const intervalos: number[] = [];
  for (const datas of partosPorAnimal.values()) {
    const ord = [...datas].sort();
    for (let i = 1; i < ord.length; i++) {
      const a = Date.parse(`${ord[i - 1]}T00:00:00Z`);
      const b = Date.parse(`${ord[i]}T00:00:00Z`);
      if (!Number.isNaN(a) && !Number.isNaN(b) && b > a) {
        intervalos.push(Math.round((b - a) / 86_400_000));
      }
    }
  }
  if (!intervalos.length) return null;
  return intervalos.reduce((s, v) => s + v, 0) / intervalos.length;
}

/** Curva de nascimentos projetada: contagem de previsões de parto por mês. */
export function nascimentosPorMes(
  previsoes: PrevisaoParto[],
): Array<{ mes: string; total: number }> {
  const contagem = new Map<string, number>();
  for (const p of previsoes) {
    const mes = p.previsto.slice(0, 7);
    contagem.set(mes, (contagem.get(mes) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}
