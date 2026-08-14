// Proveniência da carga: por quais caminhos ela entrou no sistema. É o que
// permite olhar um registro conciliado e saber que aquele peso veio do ticket
// da balança e aquela quantidade veio da mensagem do apontador.

export type OrigemFonte = "texto-whatsapp" | "foto-romaneio" | "ticket-balanca" | "manual";

export type Fonte = { origem: OrigemFonte; em: string; por?: string };

export const ORIGEM_LABEL: Record<OrigemFonte, string> = {
  "texto-whatsapp": "Texto do WhatsApp",
  "foto-romaneio": "Foto do romaneio",
  "ticket-balanca": "Ticket da balança",
  manual: "Digitado no sistema",
};

export function lerFontes(payload: Record<string, string>): Fonte[] {
  try {
    const raw = payload.fontes ? JSON.parse(payload.fontes) : [];
    return Array.isArray(raw) ? (raw as Fonte[]) : [];
  } catch {
    return [];
  }
}

/**
 * Acrescenta uma fonte ao histórico do payload e devolve o JSON pronto para
 * gravar. Não deduplica de propósito: duas leituras da mesma origem em momentos
 * diferentes são dois eventos, e é isso que se quer auditar.
 */
export function registrarFonte(
  payload: Record<string, string>,
  origem: OrigemFonte,
  por?: string,
): string {
  const fontes = lerFontes(payload);
  fontes.push({ origem, em: new Date().toISOString(), ...(por ? { por } : {}) });
  return JSON.stringify(fontes);
}

/** Origem provável do que acabou de ser extraído, para carimbar a proveniência. */
export function origemDe(input: {
  veioDeOcr: boolean;
  campos: Record<string, string>;
}): OrigemFonte {
  if (!input.veioDeOcr) return "texto-whatsapp";
  // O ticket impresso é o único que traz nº de pesagem / pesos de entrada e saída.
  return input.campos.pesagem_num || input.campos.peso_entrada ? "ticket-balanca" : "foto-romaneio";
}
