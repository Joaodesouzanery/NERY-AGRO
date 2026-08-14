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
    // Seis itens, DOIS abaixo do mínimo: o KPI "embalagens abaixo do mínimo"
    // sempre mostrou 0 na vitrine, porque só havia um item e ele estava em dia.
    embalagens: [
      registro(now, "embalagens", "1", 0, {
        item: "Caixa hortifruti 20 kg",
        sku: "CX-HF-20",
        saldo: "620",
        minimo: "300",
        fornecedor: "Pack Verde",
        validade: dia(now, -180),
        status: "OK",
      }),
      registro(now, "embalagens", "2", 0, {
        item: "Caixa hortifruti P",
        sku: "CX-HF-P",
        saldo: "180",
        minimo: "300",
        fornecedor: "Pack Verde",
        validade: dia(now, -150),
        status: "Repor",
      }),
      registro(now, "embalagens", "3", 1, {
        item: "Big bag 500 kg",
        sku: "BB-500",
        saldo: "45",
        minimo: "60",
        fornecedor: "Sacaria Goiás",
        validade: dia(now, -300),
        status: "Repor",
      }),
      registro(now, "embalagens", "4", 1, {
        item: "Sacaria 10 kg",
        sku: "SC-10",
        saldo: "2400",
        minimo: "800",
        fornecedor: "Sacaria Goiás",
        validade: dia(now, -240),
        status: "OK",
      }),
      registro(now, "embalagens", "5", 2, {
        item: "Filme stretch",
        sku: "FL-ST",
        saldo: "96",
        minimo: "40",
        fornecedor: "Embala Centro-Oeste",
        validade: dia(now, -400),
        status: "OK",
      }),
      registro(now, "embalagens", "6", 2, {
        item: "Pallet PBR",
        sku: "PL-PBR",
        saldo: "310",
        minimo: "150",
        fornecedor: "Madeireira Cristalina",
        validade: "",
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
    // Seis conferências em três situações: o donut tinha uma fatia só, e o KPI
    // "expedição aprovada" dava sempre 100%.
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
      registro(now, "expedicao", "2", 0, {
        pedido: "PED-8842",
        responsavel: "Carla Souza",
        itens: "880 caixas de cebola",
        conferidos: "Sim",
        temperatura: "10 C",
        lacres: "L-227",
        status: "Aprovado",
      }),
      registro(now, "expedicao", "3", 1, {
        pedido: "PED-8843",
        responsavel: "Rogério Alves",
        itens: "640 caixas de cebola",
        conferidos: "Sim",
        temperatura: "9 C",
        lacres: "L-228",
        status: "Aprovado",
      }),
      registro(now, "expedicao", "4", 1, {
        pedido: "PED-8844",
        responsavel: "Rogério Alves",
        itens: "18 cestas",
        conferidos: "Não",
        temperatura: "12 C",
        lacres: "",
        status: "Revisar",
      }),
      registro(now, "expedicao", "5", 2, {
        pedido: "PED-8845",
        responsavel: "Carla Souza",
        itens: "420 caixas de cebola",
        conferidos: "Sim",
        temperatura: "8 C",
        lacres: "L-229",
        status: "Aprovado",
      }),
      registro(now, "expedicao", "6", 0, {
        pedido: "PED-8846",
        responsavel: "Rogério Alves",
        itens: "300 caixas de cebola",
        conferidos: "Não",
        temperatura: "",
        lacres: "",
        status: "Pendente",
      }),
    ],
    fretes: [
      registro(now, "fretes", "1", 0, {
        rota: "Cristalina → São Paulo",
        transportadora: "Frota própria",
        km: "915",
        custo: "4900",
        combustivel: "2650",
        pedagio: "480",
        status: "Fechado",
      }),
      registro(now, "fretes", "2", 3, {
        rota: "Cristalina → São Paulo",
        transportadora: "Frota própria",
        km: "915",
        custo: "4900",
        combustivel: "2710",
        pedagio: "480",
        status: "Fechado",
      }),
      registro(now, "fretes", "3", 1, {
        rota: "Cristalina → Campinas",
        transportadora: "Rodo Cerrado",
        km: "835",
        custo: "4450",
        combustivel: "2380",
        pedagio: "410",
        status: "Fechado",
      }),
      registro(now, "fretes", "4", 6, {
        rota: "Cristalina → Campinas",
        transportadora: "Rodo Cerrado",
        km: "835",
        custo: "4450",
        combustivel: "2410",
        pedagio: "410",
        status: "Fechado",
      }),
      registro(now, "fretes", "5", 2, {
        rota: "Cristalina → Brasília",
        transportadora: "Frota própria",
        km: "150",
        custo: "820",
        combustivel: "430",
        pedagio: "0",
        status: "Fechado",
      }),
      registro(now, "fretes", "6", 5, {
        rota: "Cristalina → Brasília",
        transportadora: "Frota própria",
        km: "150",
        custo: "820",
        combustivel: "445",
        pedagio: "0",
        status: "Fechado",
      }),
      registro(now, "fretes", "7", 4, {
        rota: "Cristalina → Goiânia",
        transportadora: "TransGoiás",
        km: "280",
        custo: "1560",
        combustivel: "810",
        pedagio: "60",
        status: "Fechado",
      }),
      registro(now, "fretes", "8", 8, {
        rota: "Cristalina → Uberlândia",
        transportadora: "TransGoiás",
        km: "330",
        custo: "1840",
        combustivel: "960",
        pedagio: "95",
        status: "Em negociação",
      }),
    ],
    // Dez cargas: 5 entregues, 1 atrasada → OTIF 83%, que não é número
    // redondo. E as ETAs cobrem os três níveis do SLA todo dia, sem retoque.
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
        eta: dia(now, -1),
      }),
      registro(now, "cargas", "2", 0, {
        codigo: "CG-1002",
        cliente: "Ceasa Brasília",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Brasília/DF",
        destino_lat: "-15.793",
        destino_lng: "-47.882",
        peso: "8000",
        valor: "15200",
        motorista: "Severino Lima",
        placa: "LJQ-8J12",
        status: "Em trânsito",
        // Vence hoje: entra como "em risco" nas horas finais.
        eta: hoje,
      }),
      registro(now, "cargas", "3", 1, {
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
      registro(now, "cargas", "4", 2, {
        codigo: "CG-1004",
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
        eta: anteontem,
      }),
      registro(now, "cargas", "5", 3, {
        codigo: "CG-1005",
        cliente: "Ceasa Goiânia",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Goiânia/GO",
        destino_lat: "-16.686",
        destino_lng: "-49.264",
        peso: "9500",
        valor: "17800",
        motorista: "Marcos Dias",
        placa: "RTE-4C09",
        status: "Entregue",
        eta: dia(now, 3),
      }),
      registro(now, "cargas", "6", 4, {
        codigo: "CG-1006",
        cliente: "Ceagesp São Paulo",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "São Paulo/SP",
        destino_lat: "-23.55",
        destino_lng: "-46.63",
        peso: "23000",
        valor: "46100",
        motorista: "Lorival Souza",
        placa: "NFN-6I47",
        status: "Entregue",
        eta: dia(now, 4),
      }),
      registro(now, "cargas", "7", 5, {
        codigo: "CG-1007",
        cliente: "Ceasa Brasília",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Brasília/DF",
        destino_lat: "-15.793",
        destino_lng: "-47.882",
        peso: "7600",
        valor: "14300",
        motorista: "Ana Beatriz Rocha",
        placa: "HUV-7B31",
        status: "Entregue",
        eta: dia(now, 5),
      }),
      registro(now, "cargas", "8", 6, {
        codigo: "CG-1008",
        cliente: "Atacadão Uberlândia",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Uberlândia/MG",
        destino_lat: "-18.918",
        destino_lng: "-48.277",
        peso: "12000",
        valor: "22400",
        motorista: "Marcos Dias",
        placa: "RTE-4C09",
        status: "Entregue",
        // Já teve o atraso registrado: aparece como tratada, não some.
        eta: dia(now, 7),
        sla_motivo: "Trânsito ou estrada",
        sla_observacao: "Fila na balança da BR-050",
        sla_tratado_em: dia(now, 6),
        sla_tratado_nivel: "estourado",
        sla_tratado_eta: dia(now, 7),
      }),
      registro(now, "cargas", "9", 0, {
        codigo: "CG-1009",
        cliente: "Ceasa Goiânia",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Goiânia/GO",
        destino_lat: "-16.686",
        destino_lng: "-49.264",
        peso: "6800",
        valor: "12900",
        motorista: "Ana Beatriz Rocha",
        placa: "HUV-7B31",
        status: "Aguardando",
        // Sem ETA: o prazo vem do `sla` da rota — é a perna que só existe
        // porque o campo da aba Rotas passou a valer.
        saida: hoje,
      }),
      registro(now, "cargas", "10", 1, {
        codigo: "CG-1010",
        cliente: "Ceasa Campinas",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Campinas/SP",
        destino_lat: "-22.905",
        destino_lng: "-47.06",
        peso: "17500",
        valor: "34900",
        motorista: "João Pereira",
        placa: "GPC-2G22",
        status: "Em trânsito",
        eta: dia(now, -2),
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
    // Os `sla` daqui alimentam o prazo das cargas sem ETA digitada.
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
        sla: "24",
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
        sla: "20",
        paradas: "Ribeirão Preto",
      }),
      registro(now, "rotas", "3", 0, {
        nome: "Cristalina → Brasília",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Brasília/DF",
        destino_lat: "-15.793",
        destino_lng: "-47.882",
        distancia: "150",
        sla: "6",
        paradas: "",
      }),
      registro(now, "rotas", "4", 0, {
        nome: "Cristalina → Goiânia",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Goiânia/GO",
        destino_lat: "-16.686",
        destino_lng: "-49.264",
        distancia: "280",
        sla: "8",
        paradas: "",
      }),
      registro(now, "rotas", "5", 0, {
        nome: "Cristalina → Uberlândia",
        origem: "Cristalina/GO",
        origem_lat: "-16.767",
        origem_lng: "-47.613",
        destino: "Uberlândia/MG",
        destino_lat: "-18.918",
        destino_lng: "-48.277",
        distancia: "330",
        sla: "10",
        paradas: "",
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
