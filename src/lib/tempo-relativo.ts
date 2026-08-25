// "há 16 min" — tempo relativo curto, em pt-BR.
//
// O `formatDistanceToNow` do date-fns faria parecido, mas devolve texto longo
// ("há 16 minutos") e lê o relógio por dentro — o que torna qualquer teste
// dependente do instante em que roda. Aqui `agora` entra por parâmetro, o
// mesmo desenho de `demoSnapshotDe(now)` e das métricas puras.

const MINUTO = 60_000;
const HORA = 3_600_000;
const DIA = 86_400_000;

/**
 * "agora" · "há 16 min" · "há 3 h" · "ontem" · "há 5 dias" · "12/08/2026".
 * Datas no futuro (relógio dessincronizado) e inválidas viram a data absoluta:
 * inventar "daqui a −3 min" seria pior que mostrar o dia.
 */
export function tempoRelativo(iso: string, agora: Date): string {
  const alvo = new Date(iso);
  if (Number.isNaN(alvo.getTime())) return "-";
  const delta = agora.getTime() - alvo.getTime();
  if (delta < 0) return alvo.toLocaleDateString("pt-BR");
  if (delta < MINUTO) return "agora";
  if (delta < HORA) return `há ${Math.floor(delta / MINUTO)} min`;
  if (delta < DIA) return `há ${Math.floor(delta / HORA)} h`;
  // Até 24h a granularidade é de horas (acima), mesmo que o calendário já
  // diga "ontem" — "há 12 h" informa mais. Daqui em diante conta-se por dia de
  // CALENDÁRIO: 25h atrás às 23h de hoje é "ontem", não "há 1 dia".
  const dias = diasDeCalendario(alvo, agora);
  if (dias === 1) return "ontem";
  if (dias <= 30) return `há ${dias} dias`;
  return alvo.toLocaleDateString("pt-BR");
}

function diasDeCalendario(de: Date, ate: Date): number {
  const a = new Date(de.getFullYear(), de.getMonth(), de.getDate());
  const b = new Date(ate.getFullYear(), ate.getMonth(), ate.getDate());
  return Math.round((b.getTime() - a.getTime()) / DIA);
}
