// Dataset do modo DEMO da Pecuária: um rebanho coerente da Fazenda Santa
// Helena (mesma fazenda demo do Talhão 360/Insumos), com datas relativas a
// hoje para GMD, carência e reservas continuarem fazendo sentido em qualquer
// apresentação. As views (GMD, carência, dossiê) são DERIVADAS das pesagens/
// eventos aqui dentro — nunca digitadas à mão — para o demo validar as mesmas
// contas que o banco faz.
import { demoTalhaoRecords } from "@/features/talhao-360/data/mocks";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import type { CostCenter } from "@/lib/supabase-cost-centers";
import type { Contract } from "@/lib/supabase-contracts";
import type { FinancialRecord } from "@/lib/supabase-financial";
import type {
  AnimalCarencia,
  DossieElo,
  GmdAnimal,
  PecAnimal,
  PecEstoqueSemen,
  PecEventoReprodutivo,
  PecEventoSanitario,
  PecLote,
  PecMovimentacaoGta,
  PecOcupacao,
  PecPesagem,
  PecProducao,
} from "../types/domain";

export type PecuariaDemoData = {
  lotes: PecLote[];
  animais: PecAnimal[];
  pesagens: PecPesagem[];
  sanitarios: PecEventoSanitario[];
  reprodutivos: PecEventoReprodutivo[];
  ocupacoes: PecOcupacao[];
  semen: PecEstoqueSemen[];
  gta: PecMovimentacaoGta[];
  producao: PecProducao[];
  gmd: GmdAnimal[];
  carencia: AnimalCarencia[];
  dossies: Record<string, DossieElo[]>;
  talhoes: TalhaoRecord[];
  costCenters: CostCenter[];
  contratos: Contract[];
  fluxo: FinancialRecord[];
};

const ORG = "org-demo";

function build(now: Date): PecuariaDemoData {
  const diasAtras = (dias: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - dias);
    return date.toISOString().slice(0, 10);
  };
  const stamp = (data: string) => `${data}T12:00:00.000Z`;
  const meta = (data: string) => ({ created_at: stamp(data), updated_at: stamp(data) });

  // ── Lotes ────────────────────────────────────────────────────────────────
  const lotes: PecLote[] = [
    {
      id: "lote-demo-engorda",
      nome: "Engorda 01",
      fase: "engorda",
      sistema: "pasto",
      centro_custo_id: "cc-demo-engorda",
      peso_alvo_kg: 540,
      aberto_em: diasAtras(190),
      encerrado_em: null,
      ...meta(diasAtras(190)),
    },
    {
      id: "lote-demo-recria",
      nome: "Recria 02",
      fase: "recria",
      sistema: "pasto",
      centro_custo_id: "cc-demo-recria",
      peso_alvo_kg: 380,
      aberto_em: diasAtras(240),
      encerrado_em: null,
      ...meta(diasAtras(240)),
    },
    {
      id: "lote-demo-matrizes",
      nome: "Matrizes Nelore",
      fase: "cria",
      sistema: "pasto",
      centro_custo_id: null,
      peso_alvo_kg: null,
      aberto_em: diasAtras(400),
      encerrado_em: null,
      ...meta(diasAtras(400)),
    },
  ];

  // ── Animais ──────────────────────────────────────────────────────────────
  const animal = (
    id: string,
    brinco: string,
    loteId: string,
    extra: Partial<PecAnimal>,
  ): PecAnimal => ({
    id,
    brinco_visual: brinco,
    sisbov: null,
    rfid: null,
    categoria: "Boi",
    sexo: "macho",
    raca: "Nelore",
    nascimento: null,
    pai_id: null,
    mae_id: null,
    lote_id: loteId,
    origem: "nascido",
    origem_estabelecimento: null,
    origem_car: null,
    status: "ativo",
    foto_url: null,
    observacao: null,
    ...meta(diasAtras(180)),
    ...extra,
  });

  const compra = {
    origem: "comprado" as const,
    origem_estabelecimento: "Fazenda Boa Vista",
    origem_car: "GO-5208906-1B2C3",
  };

  const animais: PecAnimal[] = [
    // Engorda: 6 bois comprados há ~6 meses (GTA-2025-4411)
    animal("animal-demo-e101", "E-101", "lote-demo-engorda", {
      ...compra,
      sisbov: "BR105001230001",
      nascimento: diasAtras(1050),
      status: "apto_abate",
    }),
    animal("animal-demo-e102", "E-102", "lote-demo-engorda", {
      ...compra,
      nascimento: diasAtras(1020),
    }),
    animal("animal-demo-e103", "E-103", "lote-demo-engorda", {
      ...compra,
      nascimento: diasAtras(990),
    }),
    animal("animal-demo-e104", "E-104", "lote-demo-engorda", {
      ...compra,
      nascimento: diasAtras(1010),
      observacao: "Tratamento respiratório em andamento.",
    }),
    animal("animal-demo-e105", "E-105", "lote-demo-engorda", {
      ...compra,
      nascimento: diasAtras(980),
    }),
    animal("animal-demo-e106", "E-106", "lote-demo-engorda", {
      ...compra,
      sisbov: "BR105001230006",
      nascimento: diasAtras(1040),
    }),
    // Recria: 4 garrotes nascidos na fazenda
    animal("animal-demo-r201", "R-201", "lote-demo-recria", {
      categoria: "Garrote",
      nascimento: diasAtras(540),
    }),
    animal("animal-demo-r202", "R-202", "lote-demo-recria", {
      categoria: "Garrote",
      nascimento: diasAtras(520),
    }),
    animal("animal-demo-r203", "R-203", "lote-demo-recria", {
      categoria: "Garrote",
      nascimento: diasAtras(510),
    }),
    animal("animal-demo-r204", "R-204", "lote-demo-recria", {
      categoria: "Garrote",
      nascimento: diasAtras(500),
    }),
    // Matrizes: 4 vacas
    animal("animal-demo-m301", "M-301", "lote-demo-matrizes", {
      categoria: "Vaca",
      sexo: "femea",
      nascimento: diasAtras(2200),
    }),
    animal("animal-demo-m302", "M-302", "lote-demo-matrizes", {
      categoria: "Vaca",
      sexo: "femea",
      nascimento: diasAtras(2400),
    }),
    animal("animal-demo-m303", "M-303", "lote-demo-matrizes", {
      categoria: "Vaca",
      sexo: "femea",
      nascimento: diasAtras(2600),
      observacao: "Pariu há ~3 meses; bezerro ao pé.",
    }),
    animal("animal-demo-m304", "M-304", "lote-demo-matrizes", {
      categoria: "Vaca",
      sexo: "femea",
      origem: "leilao",
      origem_estabelecimento: "Leilão Rio Verde",
      nascimento: diasAtras(2000),
    }),
  ];

  // ── Pesagens (série por animal: [dias atrás, peso kg]) ──────────────────
  const series: Record<string, Array<[number, number]>> = {};
  animais.forEach((item, index) => {
    if (item.lote_id === "lote-demo-engorda") {
      const base = 372 + index * 6;
      series[item.id] = [
        [180, base],
        [120, base + 48],
        [60, base + 95],
        [7, base + 140],
      ];
    } else if (item.lote_id === "lote-demo-recria") {
      const base = 198 + (index % 6) * 5;
      series[item.id] = [
        [150, base],
        [75, base + 42],
        [10, base + 79],
      ];
    } else {
      series[item.id] = [
        [200, 452 + (index % 4) * 6],
        [20, 458 + (index % 4) * 6],
      ];
    }
  });

  const pesagens: PecPesagem[] = Object.entries(series).flatMap(([animalId, pontos]) =>
    pontos.map(([dias, peso], index) => ({
      id: `pesagem-demo-${animalId}-${index}`,
      animal_id: animalId,
      data: diasAtras(dias),
      peso_kg: peso,
      origem: index === pontos.length - 1 ? "balanca" : "manual",
      ...meta(diasAtras(dias)),
    })),
  );

  // GMD derivado das séries (mesma conta da view v_gmd_animal)
  const gmd: GmdAnimal[] = Object.entries(series).map(([animalId, pontos]) => {
    const [dPrev, wPrev] = pontos[pontos.length - 2];
    const [dLast, wLast] = pontos[pontos.length - 1];
    const [dFirst, wFirst] = pontos[0];
    return {
      animal_id: animalId,
      org_id: ORG,
      intervalos: pontos.length - 1,
      gmd_atual: round3((wLast - wPrev) / (dPrev - dLast)),
      gmd_medio: round3((wLast - wFirst) / (dFirst - dLast)),
      ultima_pesagem: diasAtras(dLast),
    };
  });

  // ── Sanidade (carência derivada: libera_em = data + carencia_dias) ──────
  const sanitario = (
    id: string,
    alvo: { animal_id?: string; lote_id?: string },
    tipo: string,
    produto: string,
    diasAtrasAplicacao: number,
    carenciaDias: number,
  ): PecEventoSanitario => {
    const data = diasAtras(diasAtrasAplicacao);
    const libera = new Date(`${data}T12:00:00`);
    libera.setDate(libera.getDate() + carenciaDias);
    return {
      id,
      animal_id: alvo.animal_id ?? null,
      lote_id: alvo.lote_id ?? null,
      tipo,
      produto,
      data,
      carencia_dias: carenciaDias,
      libera_em: carenciaDias > 0 ? libera.toISOString().slice(0, 10) : null,
      ...meta(data),
    };
  };

  const sanitarios: PecEventoSanitario[] = [
    sanitario(
      "san-demo-aftosa-eng",
      { lote_id: "lote-demo-engorda" },
      "vacina",
      "Vacina Aftosa",
      45,
      0,
    ),
    sanitario(
      "san-demo-aftosa-rec",
      { lote_id: "lote-demo-recria" },
      "vacina",
      "Vacina Aftosa",
      45,
      0,
    ),
    sanitario(
      "san-demo-iver-e102",
      { animal_id: "animal-demo-e102" },
      "vermifugo",
      "Ivermectina 1%",
      10,
      28,
    ),
    sanitario(
      "san-demo-iver-e103",
      { animal_id: "animal-demo-e103" },
      "vermifugo",
      "Ivermectina 1%",
      10,
      28,
    ),
    sanitario(
      "san-demo-anti-e104",
      { animal_id: "animal-demo-e104" },
      "medicamento",
      "Oxitetraciclina LA",
      3,
      21,
    ),
  ];

  const hoje = diasAtras(0);
  const carencia: AnimalCarencia[] = sanitarios
    .filter((evento) => evento.animal_id && evento.libera_em && evento.libera_em > hoje)
    .map((evento) => ({
      animal_id: evento.animal_id,
      org_id: ORG,
      libera_em: evento.libera_em,
    }));

  // ── Reprodução ───────────────────────────────────────────────────────────
  const reprodutivo = (
    id: string,
    animalId: string,
    tipo: string,
    dias: number,
    extra: Partial<PecEventoReprodutivo> = {},
  ): PecEventoReprodutivo => ({
    id,
    animal_id: animalId,
    tipo,
    protocolo: null,
    touro_id: null,
    semen_touro: null,
    resultado: null,
    data: diasAtras(dias),
    ...meta(diasAtras(dias)),
    ...extra,
  });

  const reprodutivos: PecEventoReprodutivo[] = [
    reprodutivo("rep-demo-iatf-m301", "animal-demo-m301", "iatf", 60, {
      protocolo: "IATF 9 dias",
      semen_touro: "Touro Alfa FIV 123",
    }),
    // "positivo"/"negativo" é o literal que o app grava (ReproducaoPanel) e o
    // único que `taxaPrenhez`/`previsoesParto` leem como prenhez. Com "prenhe"
    // o DEMO mostrava 0% de prenhez e nenhuma curva de nascimentos.
    reprodutivo("rep-demo-dg-m301", "animal-demo-m301", "dg", 30, { resultado: "positivo" }),
    reprodutivo("rep-demo-iatf-m302", "animal-demo-m302", "iatf", 58, {
      protocolo: "IATF 9 dias",
      semen_touro: "Touro Beta CEIP 456",
    }),
    reprodutivo("rep-demo-dg-m302", "animal-demo-m302", "dg", 28, { resultado: "negativo" }),
    reprodutivo("rep-demo-ressinc-m302", "animal-demo-m302", "ressincronizacao", 20, {
      protocolo: "Ressinc 22 dias",
    }),
    reprodutivo("rep-demo-parto-m303", "animal-demo-m303", "parto", 90, {
      resultado: "bezerro macho",
    }),
  ];

  // ── Ocupação de pastos (talhões demo da Fazenda Santa Helena) ────────────
  const ocupacao = (
    id: string,
    loteId: string,
    talhaoId: string,
    entradaDias: number,
    saidaDias?: number,
    gtaEntrada?: string,
  ): PecOcupacao => ({
    id,
    lote_id: loteId,
    talhao_id: talhaoId,
    data_entrada: diasAtras(entradaDias),
    data_saida: saidaDias === undefined ? null : diasAtras(saidaDias),
    gta_entrada: gtaEntrada ?? null,
    ...meta(diasAtras(entradaDias)),
  });

  const ocupacoes: PecOcupacao[] = [
    ocupacao(
      "ocup-demo-engorda-t1",
      "lote-demo-engorda",
      "talhao-demo-01",
      75,
      undefined,
      "GTA-2025-4411",
    ),
    ocupacao("ocup-demo-recria-t2", "lote-demo-recria", "talhao-demo-02", 120),
    ocupacao("ocup-demo-matrizes-t3", "lote-demo-matrizes", "talhao-demo-03", 300, 240),
    ocupacao("ocup-demo-matrizes-t2", "lote-demo-matrizes", "talhao-demo-02", 240),
  ];

  // ── Sêmen, GTA e produção ────────────────────────────────────────────────
  const semen: PecEstoqueSemen[] = [
    {
      id: "semen-demo-alfa",
      touro: "Touro Alfa FIV 123",
      partida: "P-2411",
      doses: 18,
      ...meta(diasAtras(90)),
    },
    {
      id: "semen-demo-beta",
      touro: "Touro Beta CEIP 456",
      partida: "P-2437",
      doses: 42,
      ...meta(diasAtras(70)),
    },
  ];

  const gta: PecMovimentacaoGta[] = [
    {
      id: "gta-demo-entrada",
      numero: "GTA-2025-4411",
      data: diasAtras(75),
      sentido: "entrada",
      contraparte: "Fazenda Boa Vista",
      quantidade: 6,
      nfe_vinculada: "NFe 12.334",
      ...meta(diasAtras(75)),
    },
    {
      id: "gta-demo-saida",
      numero: "GTA-2026-1102",
      data: diasAtras(15),
      sentido: "saida",
      contraparte: "Frigorífico Rio Verde",
      quantidade: 2,
      nfe_vinculada: "NFe 13.902",
      ...meta(diasAtras(15)),
    },
  ];

  const producao: PecProducao[] = [
    {
      id: "prod-demo-desmame",
      animal_id: null,
      lote_id: "lote-demo-matrizes",
      produto: "Bezerro desmamado",
      quantidade: 3,
      unidade: "cab",
      data: diasAtras(80),
      observacao: "Desmame do lote de matrizes.",
      ...meta(diasAtras(80)),
    },
    {
      id: "prod-demo-arroba",
      animal_id: null,
      lote_id: "lote-demo-engorda",
      produto: "Arroba vendida",
      quantidade: 36,
      unidade: "@",
      data: diasAtras(15),
      observacao: "Venda de 2 bois ao Frigorífico Rio Verde.",
      ...meta(diasAtras(15)),
    },
  ];

  // ── Dossiê (mesma composição da view: origem + elos de talhão) ──────────
  const talhoes = demoTalhaoRecords.map((record) => record as TalhaoRecord);
  const nomeTalhao = new Map(talhoes.map((t) => [t.id, t.payload.talhao || "Talhão"]));
  const dossies: Record<string, DossieElo[]> = {};
  for (const item of animais) {
    const elos: DossieElo[] = [];
    if ((item.origem === "comprado" || item.origem === "leilao") && item.origem_estabelecimento) {
      elos.push({
        animal_id: item.id,
        org_id: ORG,
        ordem: 0,
        talhao_id: null,
        estabelecimento: item.origem_estabelecimento,
        car: item.origem_car,
        data_entrada: null,
        data_saida: null,
        tipo_elo: "origem",
      });
    }
    for (const ocup of ocupacoes.filter((o) => o.lote_id === item.lote_id)) {
      elos.push({
        animal_id: item.id,
        org_id: ORG,
        ordem: 1,
        talhao_id: ocup.talhao_id,
        estabelecimento: nomeTalhao.get(ocup.talhao_id) ?? null,
        car: null,
        data_entrada: ocup.data_entrada,
        data_saida: ocup.data_saida,
        tipo_elo: "talhao",
      });
    }
    dossies[item.id] = elos;
  }

  // ── Financeiro (Resultados/Rentabilidade da Pecuária) ────────────────────
  const costCenters: CostCenter[] = [
    {
      id: "cc-demo-engorda",
      nome: "Pecuária — Engorda 01",
      tipo: "Pecuária",
      safra: "2025/2026",
      talhao_id: null,
      valor_autorizado: 180000,
      valor_alocado: 120000,
      valor_realizado: 96500,
      vigencia_inicio: diasAtras(190),
      vigencia_fim: null,
      status: "ativo",
    },
    {
      id: "cc-demo-recria",
      nome: "Pecuária — Recria 02",
      tipo: "Pecuária",
      safra: "2025/2026",
      talhao_id: null,
      valor_autorizado: 80000,
      valor_alocado: 52000,
      valor_realizado: 31400,
      vigencia_inicio: diasAtras(240),
      vigencia_fim: null,
      status: "ativo",
    },
  ];

  const contratos: Contract[] = [
    {
      id: "contrato-demo-racao",
      contrato: "CT-2025-118",
      tipo: "Compra de ração",
      contraparte: "Nutripec GO",
      cost_center_id: "cc-demo-engorda",
      talhao_id: null,
      vigencia_inicio: diasAtras(120),
      vigencia_fim: null,
      qtd_contratada: 60,
      qtd_liquidada: 42,
      preco_unit: 1450,
      valor: 87000,
      status: "Ativo",
    },
  ];

  const fluxoItem = (
    id: string,
    payload: Record<string, string>,
    dias: number,
  ): FinancialRecord => ({
    id,
    module: "fluxo",
    payload,
    ...meta(diasAtras(dias)),
  });

  const fluxo: FinancialRecord[] = [
    fluxoItem(
      "fluxo-demo-sal",
      {
        descricao: "Sal mineral proteinado",
        tipo: "saida",
        categoria: "Suplementação",
        valor: "6400",
        data: diasAtras(35),
        centro_custo: "Pecuária — Recria 02",
      },
      35,
    ),
    fluxoItem(
      "fluxo-demo-vacinas",
      {
        descricao: "Vacinas e vermífugos",
        tipo: "saida",
        categoria: "Sanidade",
        valor: "3150",
        data: diasAtras(44),
        centro_custo: "Pecuária — Engorda 01",
      },
      44,
    ),
    fluxoItem(
      "fluxo-demo-venda",
      {
        descricao: "Venda de 2 bois gordos (36 @)",
        tipo: "entrada",
        categoria: "Venda de gado",
        valor: "11520",
        data: diasAtras(15),
        centro_custo: "Pecuária — Engorda 01",
      },
      15,
    ),
  ];

  return {
    lotes,
    animais,
    pesagens,
    sanitarios,
    reprodutivos,
    ocupacoes,
    semen,
    gta,
    producao,
    gmd,
    carencia,
    dossies,
    talhoes,
    costCenters,
    contratos,
    fluxo,
  };
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

// Cache por dia: as datas são relativas a "hoje", então o dataset só muda
// quando o dia vira (e mantém referência estável para o React Query).
let cache: { key: string; data: PecuariaDemoData } | null = null;

export function demoPecuariaData(now = new Date()): PecuariaDemoData {
  const key = now.toISOString().slice(0, 10);
  if (!cache || cache.key !== key) cache = { key, data: build(now) };
  return cache.data;
}
