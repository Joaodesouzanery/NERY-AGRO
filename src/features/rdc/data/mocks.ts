import type { FieldRecord } from "@/lib/supabase-field";
import type { LinkOption } from "@/features/rdc/types/domain";
import { demoTalhaoRecords } from "@/features/talhao-360/data/mocks";

function record(module: string, id: string, payload: Record<string, string>): FieldRecord {
  return {
    id,
    module,
    payload,
    created_at: "2026-06-24T08:00:00.000Z",
    updated_at: "2026-06-24T08:00:00.000Z",
  };
}

// Vínculos demo — talhões reaproveitam os mocks do Talhão 360 (ids reais de demo).
export const demoTalhaoOptions: LinkOption[] = demoTalhaoRecords.map((r) => ({
  id: r.id,
  nome: r.payload.talhao || r.id,
}));

export const demoAnimalOptions: LinkOption[] = [{ id: "demo-pecuaria-animal-1", nome: "BR-0421" }];

// Duas fichas no mesmo dia (prova "várias por dia" + histórico).
const fichas: FieldRecord[] = [
  record("rdc-ficha", "rdc-demo-1", {
    data: "2026-06-24",
    titulo: "RDC 24/06 — Turno manhã",
    responsavel: "João Silva",
    local: "Fazenda Santa Helena",
    clima_resumo: "Ensolarado, 28°C, sem chuva",
    resumo: "Pulverização do Talhão 03 e manejo do rebanho concluídos.",
    status: "Concluído",
  }),
  record("rdc-ficha", "rdc-demo-2", {
    data: "2026-06-24",
    titulo: "RDC 24/06 — Turno tarde",
    responsavel: "Ana Costa",
    local: "Fazenda Santa Helena",
    clima_resumo: "Nublado à tarde",
    resumo: "",
    status: "Rascunho",
  }),
];

const entries: FieldRecord[] = [
  // Seção 1 — CAMPO (atividade, insumo, ocorrência, clima), linkado ao Talhão 03
  record("rdc-entry", "rdc-e-1", {
    rdc_id: "rdc-demo-1",
    secao: "campo",
    tipo: "Atividade",
    data: "2026-06-24",
    descricao: "Pulverização pós-emergente",
    responsavel: "João Silva",
    status: "Concluído",
    talhao_id: "talhao-demo-03",
    talhao_nome: "Talhão 03",
  }),
  record("rdc-entry", "rdc-e-2", {
    rdc_id: "rdc-demo-1",
    secao: "campo",
    tipo: "Insumo",
    data: "2026-06-24",
    descricao: "Herbicida glifosato",
    quantidade: "40",
    unidade: "L",
    custo: "1280",
    talhao_id: "talhao-demo-03",
    talhao_nome: "Talhão 03",
  }),
  record("rdc-entry", "rdc-e-3", {
    rdc_id: "rdc-demo-1",
    secao: "campo",
    tipo: "Ocorrência",
    data: "2026-06-24",
    descricao: "Foco de lagarta detectado",
    ocorrencia: "Foco de lagarta",
    severidade: "Alta",
    talhao_id: "talhao-demo-03",
    talhao_nome: "Talhão 03",
  }),
  record("rdc-entry", "rdc-e-4", {
    rdc_id: "rdc-demo-1",
    secao: "campo",
    tipo: "Clima",
    data: "2026-06-24",
    descricao: "Temp 28°C · umidade 55% · vento 8 km/h",
  }),

  // Seção 2 — PECUÁRIA (manejo, sanidade, observação), linkado ao animal BR-0421
  record("rdc-entry", "rdc-e-5", {
    rdc_id: "rdc-demo-1",
    secao: "pecuaria",
    tipo: "Manejo",
    data: "2026-06-24",
    descricao: "Pesagem de rotina",
    quantidade: "422",
    unidade: "kg",
    animal_id: "demo-pecuaria-animal-1",
    animal_nome: "BR-0421",
  }),
  record("rdc-entry", "rdc-e-6", {
    rdc_id: "rdc-demo-1",
    secao: "pecuaria",
    tipo: "Sanidade",
    data: "2026-06-24",
    descricao: "Reforço vacinal clostridial",
    ocorrencia: "Reforço clostridial",
    severidade: "Atenção",
    custo: "35",
    animal_id: "demo-pecuaria-animal-1",
    animal_nome: "BR-0421",
  }),
  record("rdc-entry", "rdc-e-7", {
    rdc_id: "rdc-demo-1",
    secao: "pecuaria",
    tipo: "Observação",
    data: "2026-06-24",
    descricao: "Animal ativo, sem sinais clínicos",
    animal_id: "demo-pecuaria-animal-1",
    animal_nome: "BR-0421",
  }),

  // Seção 3 — OBSERVAÇÕES GERAIS
  record("rdc-entry", "rdc-e-8", {
    rdc_id: "rdc-demo-1",
    secao: "observacoes",
    tipo: "Pendência",
    data: "2026-06-24",
    descricao: "Estrada interna do Talhão 03 precisa de cascalho.",
    status: "Pendente",
    talhao_id: "talhao-demo-03",
    talhao_nome: "Talhão 03",
  }),

  // Seção 4 — EQUIPE & MÁQUINAS (mão de obra, implemento)
  record("rdc-entry", "rdc-e-9", {
    rdc_id: "rdc-demo-1",
    secao: "equipe",
    tipo: "Mão de obra",
    data: "2026-06-24",
    descricao: "2 operadores · 6h",
    quantidade: "12",
    unidade: "h",
    custo: "480",
  }),
  record("rdc-entry", "rdc-e-10", {
    rdc_id: "rdc-demo-1",
    secao: "equipe",
    tipo: "Implemento",
    data: "2026-06-24",
    descricao: "Trator 01 + pulverizador",
    status: "Operacional",
    custo: "320",
    talhao_id: "talhao-demo-03",
    talhao_nome: "Talhão 03",
  }),

  // Itens na 2ª ficha (prova agregação multi-ficha)
  record("rdc-entry", "rdc-e-11", {
    rdc_id: "rdc-demo-2",
    secao: "campo",
    tipo: "Atividade",
    data: "2026-06-24",
    descricao: "Inspeção do sistema de irrigação",
  }),
];

const photos: FieldRecord[] = [
  record("rdc-photo", "rdc-p-1", {
    rdc_id: "rdc-demo-1",
    secao: "observacoes",
    storage_path: "demo/lagarta.jpg",
    url: "https://placehold.co/600x400/16a34a/ffffff?text=Talh%C3%A3o+03",
    legenda: "Foco de lagarta no Talhão 03",
    talhao_id: "talhao-demo-03",
  }),
  record("rdc-photo", "rdc-p-2", {
    rdc_id: "rdc-demo-1",
    secao: "pecuaria",
    storage_path: "demo/br0421.jpg",
    url: "https://placehold.co/600x400/2563eb/ffffff?text=BR-0421",
    legenda: "BR-0421 na pesagem",
    animal_id: "demo-pecuaria-animal-1",
  }),
];

export const demoRdcRecords: FieldRecord[] = [...fichas, ...entries, ...photos];
