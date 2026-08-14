// Seções do formulário de cadastro, por aba da Logística.
//
// Opt-in de propósito: o diálogo é o MESMO para as 12 abas, e aba sem entrada
// aqui continua renderizando a grade plana de hoje, sem uma linha de diferença.
// Só Frota e Bases entraram, porque foram de 8 e 7 campos para ~24 e ~20 — e
// vinte campos numa lista corrida é um formulário que ninguém termina.
//
// Dado puro, sem React, pelo mesmo motivo de `cadastro-sections.ts` no Talhão
// 360: a mesma lista pode alimentar depois um indicador de "cadastro completo"
// sem que ninguém precise repetir os grupos num segundo lugar.

export type SecaoFormulario = {
  id: string;
  titulo: string;
  descricao: string;
  campos: string[];
};

export const SECOES_POR_ABA: Record<string, SecaoFormulario[]> = {
  frota: [
    {
      id: "identificacao",
      titulo: "Identificação",
      descricao: "Placa, modelo e de quem é o veículo",
      campos: ["placa", "modelo", "ano", "tipo", "posse", "transportadora"],
    },
    {
      id: "capacidade",
      titulo: "Capacidade e consumo",
      descricao: "Quanto leva e quanto gasta",
      campos: ["capacidade", "capacidade_caixas", "refrigerado", "combustivel", "consumo_km_l"],
    },
    {
      id: "documentos",
      titulo: "Documentos e vencimentos",
      descricao: "CRLV, ANTT e seguro",
      campos: [
        "renavam",
        "crlv_vencimento",
        "antt_rntrc",
        "antt_validade",
        "seguro_apolice",
        "seguro_vencimento",
      ],
    },
    {
      id: "operacao",
      titulo: "Operação e manutenção",
      descricao: "Situação, base, motorista e revisões",
      campos: [
        "status",
        "base",
        "motorista",
        "km_atual",
        "ultima_manutencao",
        "proxima_manutencao",
      ],
    },
    {
      id: "posicao",
      titulo: "Posição e observações",
      descricao: "Onde está e o que mais importa",
      campos: ["atual_lat", "atual_lng", "observacoes"],
    },
  ],
  bases: [
    {
      id: "identificacao",
      titulo: "Identificação",
      descricao: "Nome, tipo e contato",
      campos: ["nome", "codigo", "tipo", "status", "responsavel", "telefone"],
    },
    {
      id: "endereco",
      titulo: "Endereço e localização",
      descricao: "Onde fica e o pino no mapa",
      campos: ["endereco", "cidade", "cep", "lat", "lng"],
    },
    {
      id: "fiscal",
      titulo: "Dados fiscais",
      descricao: "Para nota e CT-e",
      campos: ["cnpj", "inscricao_estadual"],
    },
    {
      id: "estrutura",
      titulo: "Capacidade e estrutura",
      descricao: "O que a base consegue receber",
      campos: [
        "capacidade_t",
        "capacidade_caixas",
        "camara_fria",
        "balanca",
        "beneficiamento",
        "horario_funcionamento",
      ],
    },
    {
      id: "extras",
      titulo: "Observações",
      descricao: "O que não cabe nos campos",
      campos: ["observacoes"],
    },
  ],
};

/** A seção que contém um campo — usada para abrir a seção certa quando o Salvar reprova. */
export function secaoDoCampo(moduleId: string, campo: string): string | undefined {
  return SECOES_POR_ABA[moduleId]?.find((s) => s.campos.includes(campo))?.id;
}
