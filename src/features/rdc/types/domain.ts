// Tipos do módulo RDC (Relatório Diário de Campo).
// Persistido no store genérico `field_records` em 3 módulos: rdc-ficha / rdc-entry / rdc-photo.

export const SECOES = ["campo", "pecuaria", "observacoes", "equipe"] as const;
export type Secao = (typeof SECOES)[number];

export type RdcStatus = "Rascunho" | "Concluído";

export const SECAO_LABEL: Record<Secao, string> = {
  campo: "Campo",
  pecuaria: "Pecuária",
  observacoes: "Observações & Fotos",
  equipe: "Equipe & Máquinas",
};

/** Cabeçalho da ficha — module "rdc-ficha". */
export type RdcFicha = {
  id: string;
  data: string; // YYYY-MM-DD
  titulo: string;
  responsavel: string;
  local: string;
  safra: string;
  dia: string; // dia da operação/obra (ex.: "03")
  clima: string; // valor do toggle (CLIMA_OPTIONS)
  climaResumo: string; // nota livre opcional do clima
  atividades: string[]; // checklist de atividades executadas no dia
  atividadesOutros: string;
  resumo: string;
  status: RdcStatus;
  createdAt?: string;
};

/** Item de uma seção — module "rdc-entry" (payload.rdc_id aponta para a ficha). */
export type RdcEntry = {
  id: string;
  rdcId: string;
  secao: Secao;
  tipo: string;
  data: string;
  descricao: string;
  quantidade?: string;
  unidade?: string;
  custo?: number;
  severidade?: string;
  status?: string;
  responsavel?: string;
  talhaoId?: string;
  talhaoNome?: string;
  animalId?: string;
  animalNome?: string;
};

/** Foto — module "rdc-photo" (arquivo no bucket rdc-photos). */
export type RdcPhoto = {
  id: string;
  rdcId: string;
  secao: Secao;
  storagePath: string;
  url: string;
  legenda?: string;
  talhaoId?: string;
  animalId?: string;
};

/** Entrada do formulário (valores em string, como vêm dos inputs). */
export type RdcEntryInput = {
  secao: Secao;
  tipo: string;
  descricao: string;
  quantidade?: string;
  unidade?: string;
  custo?: string;
  severidade?: string;
  status?: string;
  responsavel?: string;
  talhaoId?: string;
  talhaoNome?: string;
  animalId?: string;
  animalNome?: string;
};

/** Modelo agregado de uma ficha, consumido pela página de detalhe. */
export type RdcModel = {
  ficha: RdcFicha;
  entriesBySecao: Record<Secao, RdcEntry[]>;
  photos: RdcPhoto[];
  totalCusto: number;
  totalItens: number;
  ocorrenciasAbertas: number;
};

/** Linha do histórico (ficha + contadores). */
export type RdcFichaSummary = RdcFicha & {
  itens: number;
  fotos: number;
  custo: number;
};

/** Resumo do dia para a Torre de Controle. */
export type RdcDailySummary = {
  data: string;
  fichas: number;
  itens: number;
  custoTotal: number;
  ocorrencias: number;
  talhoesTocados: number;
  animaisTocados: number;
};

/** Opção de vínculo (talhão ou animal). */
export type LinkOption = { id: string; nome: string };

export const isOcorrenciaTipo = (tipo: string) => ["Ocorrência", "Sanidade"].includes(tipo);

/** Condições climáticas (toggle no cabeçalho da ficha). */
export const CLIMA_OPTIONS = [
  "Sol",
  "Nublado",
  "Chuva",
  "Geada",
  "Vento",
  "Seco",
  "Outros",
] as const;

/** Checklist de atividades executadas no dia (adaptado ao agro). */
export const ATIVIDADES_AGRO = [
  "Plantio",
  "Pulverização",
  "Adubação/Fertilização",
  "Calagem/Gessagem",
  "Irrigação",
  "Capina/Roçada",
  "Aplicação de defensivo",
  "Manejo de pragas/doenças",
  "Preparo de solo",
  "Plantio de cobertura",
  "Colheita",
  "Monitoramento/Inspeção",
  "Manutenção de máquinas",
  "Abastecimento",
  "Transporte/Logística",
  "Manejo do rebanho",
  "Vacinação/Sanidade",
  "Limpeza/Organização",
] as const;
