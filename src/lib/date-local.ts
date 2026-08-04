// "Hoje" no fuso do usuário — e por que isto precisa existir.
//
// `new Date().toISOString().slice(0, 10)` devolve a data em **UTC**. No Brasil
// (UTC−3), tudo que acontece a partir das 21h já está no dia seguinte lá. Uma
// sessão de curral que vira a noite gravava metade das pesagens com a data de
// amanhã — e o GMD, que é Δpeso ÷ Δdias, saía errado por causa disso. O mesmo
// valia para movimentação de insumo, saída de ocupação e transferência.
//
// Estas funções são a fonte única. `src/lib/date-local.guard.test.ts` proíbe
// `toISOString().slice(0, 10)` no resto do código, com uma allowlist onde cada
// exceção precisa de motivo escrito.

/** Data local (YYYY-MM-DD) de um timestamp ISO. String vazia se inválido. */
export function localDateOf(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatarLocal(d);
}

/** Hoje (YYYY-MM-DD) no fuso do dispositivo. */
export function localToday(): string {
  return formatarLocal(new Date());
}

/** Data de N dias atrás (YYYY-MM-DD), no fuso do dispositivo. */
export function localDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatarLocal(d);
}

/** Primeiro dia do mês corrente (YYYY-MM-DD), no fuso do dispositivo. */
export function localMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-01`;
}

function dois(n: number): string {
  return String(n).padStart(2, "0");
}

// getFullYear/getMonth/getDate leem o fuso do dispositivo — é o que diferencia
// esta função do toISOString. Nada de subtrair getTimezoneOffset e reserializar:
// isso funciona, mas esconde a intenção atrás de aritmética de milissegundos.
function formatarLocal(d: Date): string {
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}
