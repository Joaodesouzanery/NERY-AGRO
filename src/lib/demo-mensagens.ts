// Textos do modo DEMO, num lugar só.
//
// Havia SEIS redações do mesmo conceito espalhadas pelo produto — "Dados demo
// não podem ser excluídos", "Itens demo não podem ser excluídos", "Fotos demo
// não podem ser removidas", "Fichas demo não podem ser excluídas" — e dois
// verbos diferentes para a mesma instrução: "Desligue o modo DEMO" e "Desative
// o modo DEMO". Quem lê duas delas na mesma sessão fica em dúvida se são a
// mesma coisa.

/** A instrução, sempre igual: o botão na barra lateral diz "Modo DEMO". */
export const DEMO_INSTRUCAO =
  "Desligue o modo DEMO na barra lateral para trabalhar com dados reais.";

/**
 * Aviso ao tentar escrever em modo DEMO.
 *
 * Mostrado como INFORMAÇÃO, não como erro. Antes, na Pecuária, a mutação
 * disparava, `assertNotDemo()` lançava e a mensagem chegava vermelha, como se
 * algo tivesse quebrado — a pessoa achava que o produto tinha falhado quando
 * estava apenas usando a vitrine.
 */
export function demoBloqueado(acao = "alterar"): string {
  return `Você está no modo DEMO: não dá para ${acao} os dados de exemplo. ${DEMO_INSTRUCAO}`;
}

/** A mensagem que `assertNotDemo()` lança, para reconhecê-la no catch. */
export const DEMO_ERRO_MARCADOR = "Modo DEMO";

export function ehErroDeDemo(erro: unknown): boolean {
  return erro instanceof Error && erro.message.includes(DEMO_ERRO_MARCADOR);
}
