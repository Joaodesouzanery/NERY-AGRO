import { localDateOf } from "@/lib/date-local";
import type { OperationRecord } from "@/lib/supabase-operations";

// Vitrine DEMO da Logística.
//
// Morava dentro de `src/routes/logistica.tsx` — uma rota de 1936 linhas — com
// datas fixas: todo registro nascia com `created_at: "2026-01-01"` e só 6 dos
// ~60 payloads tinham `payload.data`. Como a barra de filtros abre em "Este
// mês" e `dataDoRegistro` cai no `created_at` quando não há `payload.data`
// (filtro-registros.ts), **as tabelas das 12 abas abriam vazias em DEMO** —
// enquanto os painéis logo acima, que recebiam a lista sem filtro, apareciam
// cheios. A mesma tela se contradizia.
//
// Aqui as datas são relativas a `now`, que entra por PARÂMETRO: `Math.random()`
// e `Date.now()` dentro de dado de exemplo quebram o guard `no-fake-data` e,
// pior, tornariam a vitrine irreprodutível entre dois renders. É o mesmo
// desenho de `demoPecuariaData(now)`.
//
// Invariante que faz a vitrine nunca sumir: **toda aba tem pelo menos um
// registro de hoje**, e `created_at` fica sempre no mesmo dia de `payload.data`
// — senão as duas pernas de `dataDoRegistro` discordam entre si.

const AREA = "logistica";

/** Data local (YYYY-MM-DD) de N dias atrás em relação a `now`. */
function dia(now: Date, diasAtras: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - diasAtras);
  return localDateOf(d.toISOString());
}

/**
 * Monta um registro. `emDias` alinha o `created_at` ao dia de `payload.data`:
 * meio-dia local do mesmo dia, para não escorregar de data por fuso.
 */
function registro(
  now: Date,
  module: string,
  id: string,
  emDias: number,
  payload: Record<string, string>,
): OperationRecord {
  const d = new Date(now);
  d.setDate(d.getDate() - emDias);
  d.setHours(12, 0, 0, 0);
  const iso = d.toISOString();
  return {
    id: `demo-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: iso,
    updated_at: iso,
  };
}

function build(now: Date): Record<string, OperationRecord[]> {
  const hoje = dia(now, 0);
  const ontem = dia(now, 1);
  const anteontem = dia(now, 2);

  return {
    remessa: [
      registro(now, "remessa", "1", 0, {
        data: hoje,
        fazenda: "Sato",
        talhao: "03",
        pivo: "51",
        cultura: "Cebola",
        variedade: "Taila",
        placa: "NFN-6I47",
        motorista: "Lorival",
        qtd_caixas: "881",
        unidade: "cx",
        peso_liquido: "19178",
        media: "21.7",
        hora_saida: "09:00",
        ordem_producao: "TL03 PV51 SATO",
        beneficiamento: "OK",
        status: "Recebida",
      }),
      registro(now, "remessa", "2", 1, {
        data: ontem,
        fazenda: "Sato",
        talhao: "03",
        pivo: "51",
        cultura: "Cebola",
        variedade: "Taila",
        placa: "NFN-6I47",
        qtd_caixas: "876",
        unidade: "cx",
        peso_liquido: "19368",
        media: "22.1",
        hora_saida: "09:45",
        status: "Recebida",
      }),
      registro(now, "remessa", "3", 2, {
        data: anteontem,
        fazenda: "Nascente",
        talhao: "02",
        pivo: "02",
        cultura: "Cebola",
        variedade: "vale sul",
        placa: "LJQ-8J12",
        motorista: "Severino",
        qtd_caixas: "32",
        unidade: "beg",
        hora_chegada: "13:15",
        hora_saida: "15:40",
        status: "Em recebimento",
      }),
    ],
    "caixas-vazias": [
      registro(now, "caixas-vazias", "1", 0, {
        data: hoje,
        fazenda: "Sato",
        placa: "GPC-2G22",
        tipo: "saida_campo",
        qtd: "936",
      }),
      registro(now, "caixas-vazias", "2", 1, {
        data: ontem,
        fazenda: "Sato",
        tipo: "retorno_campo",
        qtd: "400",
      }),
      registro(now, "caixas-vazias", "3", 2, {
        data: anteontem,
        fazenda: "Nascente",
        placa: "LJQ-8J12",
        tipo: "saida_campo",
        qtd: "500",
      }),
    ],
    roteirizacao: [
      registro(now, "roteirizacao", "1", 0, {
        rota: "Centro + Zona Sul",
        motorista: "João Pereira",
        veiculo: "VUC NRY-2045",
        bairros: "Centro, Batel, Água Verde",
        paradas: "18",
        distancia: "42",
        tempo_previsto: "4h20",
        status: "Planejada",
      }),
    ],
    embalagens: [
      registro(now, "embalagens", "1", 0, {
        item: "Caixa hortifruti P",
        sku: "CX-HF-P",
        saldo: "620",
        minimo: "300",
        fornecedor: "Pack Verde",
        // Validade no futuro: um vencimento fixo no passado faria a vitrine
        // acender alerta de embalagem vencida sem que nada tivesse acontecido.
        validade: dia(now, -60),
        status: "OK",
      }),
    ],
    cestas: [
      registro(now, "cestas", "1", 0, {
        cliente: "CSA Vila Verde",
        plano: "Família semanal",
        frequencia: "Semanal",
        proxima_entrega: dia(now, -3),
        itens_padrao: "Verduras, legumes, ovos",
        pausa_ate: "",
        status: "Ativa",
      }),
    ],
    expedicao: [
      registro(now, "expedicao", "1", 0, {
        pedido: "PED-8841",
        responsavel: "Carla Souza",
        itens: "24 cestas, 12 caixas de ovos",
        conferidos: "Sim",
        temperatura: "8 C",
        lacres: "L-225, L-226",
        status: "Aprovado",
      }),
    ],
    fretes: [
      registro(now, "fretes", "1", 0, {
        rota: "Curitiba > São Paulo",
        transportadora: "Frota própria",
        km: "408",
        custo: "3250",
        combustivel: "980",
        pedagio: "210",
        status: "Fechado",
      }),
    ],
    cargas: [
      registro(now, "cargas", "1", 0, {
        codigo: "CG-1001",
        cliente: "Ceagesp São Paulo",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "São Paulo/SP",
        destino_lat: "-23.55",
        destino_lng: "-46.63",
        peso: "24000",
        valor: "48000",
        motorista: "Lorival Souza",
        placa: "NFN-6I47",
        status: "Em trânsito",
        // ETA amanhã: em trânsito e dentro do prazo.
        eta: dia(now, -1),
      }),
      registro(now, "cargas", "2", 1, {
        codigo: "CG-1002",
        cliente: "Ceasa Campinas",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Campinas/SP",
        destino_lat: "-22.905",
        destino_lng: "-47.06",
        peso: "18000",
        valor: "36500",
        motorista: "Severino Lima",
        placa: "LJQ-8J12",
        status: "Entregue",
        eta: ontem,
      }),
      registro(now, "cargas", "3", 2, {
        codigo: "CG-1003",
        cliente: "Atacadão BH",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Belo Horizonte/MG",
        destino_lat: "-19.92",
        destino_lng: "-43.94",
        peso: "20000",
        valor: "39000",
        motorista: "João Pereira",
        placa: "GPC-2G22",
        status: "Atrasado",
        eta: anteontem,
      }),
    ],
    motoristas: [
      registro(now, "motoristas", "1", 0, {
        nome: "Lorival Souza",
        cnh: "E - 04788112233",
        telefone: "(61) 99812-4477",
        veiculo: "Carreta NFN-6I47",
        status: "Em rota",
        score: "92",
      }),
      registro(now, "motoristas", "2", 0, {
        nome: "Severino Lima",
        cnh: "E - 03399445566",
        telefone: "(61) 99655-1120",
        veiculo: "Truck LJQ-8J12",
        status: "Disponível",
        score: "88",
      }),
      registro(now, "motoristas", "3", 1, {
        nome: "João Pereira",
        cnh: "D - 02255778899",
        telefone: "(61) 99340-7781",
        veiculo: "VUC GPC-2G22",
        status: "Folga",
        score: "79",
      }),
    ],
    rotas: [
      registro(now, "rotas", "1", 0, {
        nome: "Cristalina → São Paulo",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "São Paulo/SP",
        destino_lat: "-23.55",
        destino_lng: "-46.63",
        distancia: "915",
        sla: "18",
        paradas: "Uberlândia",
      }),
      registro(now, "rotas", "2", 0, {
        nome: "Cristalina → Campinas",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Campinas/SP",
        destino_lat: "-22.905",
        destino_lng: "-47.06",
        distancia: "835",
        sla: "16",
        paradas: "Ribeirão Preto",
      }),
    ],
    frota: [
      registro(now, "frota", "1", 0, {
        placa: "NFN-6I47",
        modelo: "Scania R450",
        tipo: "Carreta",
        capacidade: "30000",
        status: "Em rota",
        ultima_manutencao: dia(now, 20),
      }),
      registro(now, "frota", "2", 0, {
        placa: "LJQ-8J12",
        modelo: "VW Constellation",
        tipo: "Truck",
        capacidade: "12000",
        status: "Disponível",
        ultima_manutencao: dia(now, 12),
      }),
      registro(now, "frota", "3", 0, {
        placa: "GPC-2G22",
        modelo: "Mercedes Accelo",
        tipo: "VUC",
        capacidade: "4000",
        status: "Manutenção",
        ultima_manutencao: dia(now, 5),
      }),
    ],
    bases: [
      registro(now, "bases", "1", 0, {
        nome: "Matriz Cristalina",
        tipo: "Matriz",
        endereco: "Rod. GO-118, km 12",
        cidade: "Cristalina/GO",
        lat: "-16.767",
        lng: "-47.613",
        responsavel: "Felipe Nery",
      }),
      registro(now, "bases", "2", 0, {
        nome: "CD São Paulo",
        tipo: "Centro de Distribuição",
        endereco: "Ceagesp, Vila Leopoldina",
        cidade: "São Paulo/SP",
        lat: "-23.53",
        lng: "-46.73",
        responsavel: "Carla Souza",
      }),
    ],
  };
}

// Cache por dia: sem ele, cada chamada devolve um objeto novo e os `useMemo`
// que dependem de `registros` recalculariam a cada render — a visão geral
// inteira, incluindo 13 gráficos.
let cache: { chave: string; dados: Record<string, OperationRecord[]> } | null = null;

/** Registros de exemplo da Logística, com datas relativas a hoje. */
export function demoLogisticaRecords(now: Date = new Date()): Record<string, OperationRecord[]> {
  const chave = localDateOf(now.toISOString());
  if (!cache || cache.chave !== chave) cache = { chave, dados: build(now) };
  return cache.dados;
}

/** A mesma vitrine achatada, para quem consome `operation_records` sem separar por aba. */
export function demoLogisticaOperations(now: Date = new Date()): OperationRecord[] {
  return Object.values(demoLogisticaRecords(now)).flat();
}
