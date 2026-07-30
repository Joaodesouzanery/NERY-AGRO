import { describe, expect, it } from "vitest";
import { coverageReport, overviewCoverage } from "@/lib/overview/coverage";
import { buildPecuariaOverview } from "@/lib/overview/pecuaria";
import { DEFAULT_PEC_CONFIG } from "@/features/pecuaria/lib/apartacao-config";
import { custoVazio } from "@/features/pecuaria/lib/custos";
import type { RentabilidadeLote } from "@/features/pecuaria/hooks/use-rentabilidade";
import type {
  PecAnimal,
  PecEventoReprodutivo,
  PecEventoSanitario,
  PecLote,
  PecOcupacao,
  PecPesagem,
} from "@/features/pecuaria/types/domain";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";

// A Pecuária não vive em operation_records: as linhas são tipadas (pec_*). Os
// fixtures abaixo são pequenos de propósito — dá para conferir a agregação de
// cabeça e provar que o builder REUSA as libs do módulo (custo/@, lotação,
// prenhez, conformidade) em vez de recalcular por conta própria.

const HOJE = "2026-07-30";

function lote(id: string, nome: string, extra: Partial<PecLote> = {}): PecLote {
  return {
    id,
    nome,
    fase: null,
    sistema: null,
    centro_custo_id: null,
    peso_alvo_kg: null,
    aberto_em: "2026-01-10",
    encerrado_em: null,
    created_at: "2026-01-10",
    updated_at: "2026-01-10",
    ...extra,
  };
}

function animal(id: string, extra: Partial<PecAnimal> = {}): PecAnimal {
  return {
    id,
    brinco_visual: id,
    sisbov: null,
    rfid: null,
    categoria: null,
    sexo: null,
    raca: null,
    nascimento: null,
    pai_id: null,
    mae_id: null,
    lote_id: null,
    origem: null,
    origem_estabelecimento: null,
    origem_car: null,
    status: "ativo",
    foto_url: null,
    observacao: null,
    created_at: "2026-01-10",
    updated_at: "2026-01-10",
    ...extra,
  };
}

function pesagem(animalId: string, data: string, pesoKg: number): PecPesagem {
  return {
    id: `${animalId}-${data}`,
    animal_id: animalId,
    data,
    peso_kg: pesoKg,
    origem: "manual",
    created_at: data,
    updated_at: data,
  };
}

function repro(
  animalId: string,
  tipo: string,
  data: string,
  resultado: string | null = null,
): PecEventoReprodutivo {
  return {
    id: `${animalId}-${tipo}-${data}`,
    animal_id: animalId,
    tipo,
    protocolo: null,
    touro_id: null,
    semen_touro: null,
    resultado,
    data,
    created_at: data,
    updated_at: data,
  };
}

let seqSanitario = 0;
function sanitario(extra: Partial<PecEventoSanitario> = {}): PecEventoSanitario {
  return {
    id: `san-${++seqSanitario}`,
    animal_id: null,
    lote_id: null,
    tipo: "Vacina",
    produto: null,
    data: "2026-07-01",
    carencia_dias: 0,
    libera_em: null,
    created_at: "2026-07-01",
    updated_at: "2026-07-01",
    ...extra,
  };
}

function talhao(id: string, nome: string, areaHa: string, cultura = "Pastagem"): TalhaoRecord {
  return { id, module: "areas", payload: { talhao: nome, area_ha: areaHa, cultura } };
}

/** Talhão sem área declarada: a área tem de sair do polígono desenhado. */
function talhaoDesenhado(id: string, nome: string, ladoGraus: number): TalhaoRecord {
  const anel = [
    [-47, -16],
    [-47 + ladoGraus, -16],
    [-47 + ladoGraus, -16 + ladoGraus],
    [-47, -16 + ladoGraus],
    [-47, -16],
  ];
  return {
    id,
    module: "areas",
    payload: {
      talhao: nome,
      cultura: "Pastagem",
      geometry_geojson: JSON.stringify({ type: "Polygon", coordinates: [anel] }),
    },
  };
}

function ocupacao(id: string, loteId: string, talhaoId: string): PecOcupacao {
  return {
    id,
    lote_id: loteId,
    talhao_id: talhaoId,
    data_entrada: "2026-05-01",
    data_saida: null,
    gta_entrada: null,
    created_at: "2026-05-01",
    updated_at: "2026-05-01",
  };
}

function rentabilidade(l: PecLote, extra: Partial<RentabilidadeLote>): RentabilidadeLote {
  return {
    lote: l,
    cabecas: 0,
    ganhoTotalKg: 0,
    arrobas: 0,
    custoTotal: 0,
    porCategoria: custoVazio(),
    custoArroba: null,
    margemArroba: null,
    resultado: null,
    ...extra,
  };
}

describe("buildPecuariaOverview — cobertura", () => {
  it("toda aba tem KPI, gráfico ou tabela", () => {
    const spec = buildPecuariaOverview({}, false);
    expect(coverageReport(spec)).toBe("");
    expect(overviewCoverage(spec).missing).toEqual([]);
  });

  it("nenhum gráfico aponta para aba inexistente", () => {
    expect(overviewCoverage(buildPecuariaOverview({}, false)).orphan).toEqual([]);
  });

  it("sobrevive ao módulo sem nenhum registro", () => {
    const spec = buildPecuariaOverview({}, false);
    expect(spec.tabs).toHaveLength(6);
    expect(spec.kpis.length).toBeGreaterThan(0);
    expect(spec.charts.every((c) => Array.isArray(c.data))).toBe(true);
    // Sem dado, o gráfico entra vazio (empty state honesto) — nada inventado.
    expect(spec.charts.every((c) => c.data.length === 0)).toBe(true);
    expect(spec.tables ?? []).toEqual([]);
    expect(spec.kpis.find((k) => k.label === "Custo/@")?.value).toBe("—");
    expect(spec.kpis.find((k) => k.label === "Taxa de prenhez")?.value).toBe("—");
  });

  it("carrega o modo para o carimbo do export", () => {
    expect(buildPecuariaOverview({}, true).demoMode).toBe(true);
    expect(buildPecuariaOverview({}, false).demoMode).toBe(false);
  });
});

describe("buildPecuariaOverview — números reais", () => {
  const l1 = lote("l1", "Engorda 1", { fase: "engorda" });
  const l2 = lote("l2", "Recria 2", { fase: "recria" });
  const animais = [
    animal("a1", { lote_id: "l1", categoria: "Boi gordo" }),
    animal("a2", { lote_id: "l1", categoria: "Boi gordo" }),
    animal("a3", { lote_id: "l2", categoria: "Garrote" }),
    animal("a4", { status: "vendido" }),
  ];
  // a1 ganha 60 kg em 60 dias (GMD 1,0); a2 ganha 30 kg em 60 dias (GMD 0,5).
  const pesagensPorAnimal = new Map<string, PecPesagem[]>([
    ["a1", [pesagem("a1", "2026-05-01", 400), pesagem("a1", "2026-06-30", 460)]],
    ["a2", [pesagem("a2", "2026-05-01", 380), pesagem("a2", "2026-06-30", 410)]],
    ["a3", [pesagem("a3", "2026-06-30", 300)]],
  ]);

  const spec = buildPecuariaOverview(
    {
      lotes: [l1, l2],
      animais,
      pesagensPorAnimal,
      talhoes: [talhao("t1", "Piquete A", "100"), talhao("t2", "Milho", "50", "Milho")],
      ocupacoes: [ocupacao("o1", "l1", "t1")],
      reprodutivos: [
        repro("a1", "dg", "2026-03-01", "positivo"),
        repro("a2", "dg", "2026-03-01", "negativo"),
        repro("a3", "dg", "2026-03-02", "positivo"),
      ],
      sanitarios: [
        sanitario({ tipo: "Vacina", animal_id: "a1" }),
        sanitario({ tipo: "Vacina", animal_id: "a2" }),
        sanitario({ tipo: "Vermífugo", animal_id: "a3" }),
      ],
      producao: [],
      gta: [],
      rentabilidade: new Map([
        [
          "l1",
          rentabilidade(l1, {
            cabecas: 2,
            arrobas: 100,
            custoTotal: 20_000,
            custoArroba: 200,
            margemArroba: 120,
            resultado: 12_000,
            porCategoria: { ...custoVazio(), alimentacao: 15_000, sanidade: 5_000 },
          }),
        ],
        [
          "l2",
          rentabilidade(l2, {
            cabecas: 1,
            arrobas: 0,
            custoTotal: 4_000,
            porCategoria: { ...custoVazio(), aquisicao: 4_000 },
          }),
        ],
      ]),
      config: { ...DEFAULT_PEC_CONFIG, precoArrobaVenda: 320, pesoUAkg: 450 },
      hoje: HOJE,
    },
    false,
  );

  it("custo/@ é o custo acumulado ÷ arrobas produzidas de TODOS os lotes", () => {
    // (20.000 + 4.000) ÷ 100 @ = R$ 240/@ → margem = 320 − 240 = R$ 80/@
    expect(String(spec.kpis.find((k) => k.label === "Custo/@")?.value)).toContain("240");
    expect(String(spec.kpis.find((k) => k.label === "Margem/@")?.value)).toContain("80");
    expect(String(spec.kpis.find((k) => k.label === "Resultado do período")?.value)).toContain(
      "12.000",
    );
  });

  it("conta só as cabeças ativas e o GMD médio sai das pesagens", () => {
    expect(spec.kpis.find((k) => k.label === "Cabeças ativas")?.value).toBe("3");
    // (1,0 + 0,5) ÷ 2 = 0,75 kg/dia — a3 tem uma pesagem só, não entra na média.
    expect(spec.kpis.find((k) => k.label === "GMD médio do rebanho")?.value).toBe("0,75 kg/dia");
    const porLote = spec.charts.find((c) => c.id === "pecuaria-gmd-lote")!;
    expect(porLote.data).toEqual([{ label: "Engorda 1", valor: 0.75 }]);
  });

  it("agrupa o rebanho ativo por fase do lote", () => {
    const fases = spec.charts.find((c) => c.id === "pecuaria-rebanho-fase")!;
    // a4 está vendido — não conta como cabeça ativa em nenhuma fase.
    expect(fases.data).toEqual([
      { label: "Engorda", total: 2 },
      { label: "Recria", total: 1 },
    ]);
  });

  it("calcula UA/ha do talhão ocupado com o peso vivo do lote", () => {
    // Lote 1 no Piquete A: 460 + 410 = 870 kg ÷ 450 kg/UA ÷ 100 ha = 0,019 UA/ha
    const lotacao = spec.charts.find((c) => c.id === "pecuaria-lotacao-talhao")!;
    expect(lotacao.data).toEqual([{ label: "Piquete A", valor: 0.02 }]);
    const uso = spec.charts.find((c) => c.id === "pecuaria-uso-solo")!;
    expect(uso.data).toEqual([
      { label: "Pasto (ocupado)", total: 1 },
      { label: "Lavoura", total: 1 },
    ]);
  });

  it("taxa de prenhez é DG positivo ÷ DG realizado", () => {
    // 2 positivos em 3 DGs = 66,7%
    expect(spec.kpis.find((k) => k.label === "Taxa de prenhez")?.value).toBe("66,7%");
    // Sem parto registrado não há IEP; sem cobertura sem DG não há pendência —
    // o hint some em vez de anunciar "0 DG pendentes".
    expect(spec.kpis.find((k) => k.label === "Taxa de prenhez")?.hint).toBeUndefined();
  });

  it("projeta o parto 285 dias depois e rotula o mês em pt-BR", () => {
    // DG positivo em 01/03/2026 (+285 dias) cai em 11/12/2026; o outro em 12/12.
    const curva = spec.charts.find((c) => c.id === "pecuaria-nascimentos")!;
    expect(curva.data).toEqual([{ mes: "12/2026", total: 2 }]);
  });

  it("carimba a lotação recomendada como estimativa (não há NDVI no sistema)", () => {
    const hint = String(spec.kpis.find((k) => k.label === "Lotação média")?.hint);
    expect(hint).toContain("(estimativa)");
    expect(hint).toContain("100 ha em pasto");
  });

  it("soma o custo por categoria dos lotes na rosca de resultados", () => {
    const custo = spec.charts.find((c) => c.id === "pecuaria-custo-categoria")!;
    expect(custo.data).toEqual([
      { label: "Alimentação", total: 15_000 },
      { label: "Sanidade", total: 5_000 },
      { label: "Aquisição", total: 4_000 },
    ]);
  });

  it("conta os protocolos sanitários por tipo", () => {
    const sanidade = spec.charts.find((c) => c.id === "pecuaria-sanidade-tipo")!;
    expect(sanidade.data).toEqual([
      { label: "Vacina", valor: 2 },
      { label: "Vermífugo", valor: 1 },
    ]);
  });

  it("traduz a pendência de cadastro em arrobas fora do prêmio", () => {
    // 3 animais avaliáveis, todos sem SISBOV e sem origem declarada (EUDR).
    // (460 + 410 + 300) kg × 52% ÷ 15 = 40,6 @ pendentes em CADA protocolo —
    // o KPI soma os protocolos (mesma leitura da aba Rastreabilidade).
    const risco = spec.charts.find((c) => c.id === "pecuaria-risco-arrobas")!;
    expect(risco.data.find((d) => d.label === "SISBOV")?.valor).toBe(41);
    expect(risco.data.find((d) => d.label === "EUDR")?.valor).toBe(41);
    expect(spec.kpis.find((k) => k.label === "@ fora do prêmio")?.value).toBe("81");
    // O hint NÃO pode somar os protocolos como se fossem animais: são 3 animais
    // avaliáveis com 6 pendências (SISBOV + EUDR em cada um).
    expect(spec.kpis.find((k) => k.label === "@ fora do prêmio")?.hint).toBe(
      "6 pendências em 3 animais",
    );
    const pendencias = spec.tables?.find((t) => t.id === "pecuaria-pendencias");
    expect(pendencias?.body[0][0]).toBe("SISBOV");
  });

  it("a tabela de lotes vem do melhor resultado para o pior", () => {
    const detalhe = spec.tables?.find((t) => t.id === "pecuaria-detalhe-lote");
    expect(detalhe?.body.map((linha) => linha[0])).toEqual(["Engorda 1", "Recria 2"]);
    expect(detalhe?.body[1][3]).toBe("—"); // Recria 2 não produziu arroba
  });
});

describe("buildPecuariaOverview — semáforos e atraso de pesagem", () => {
  // Dois lotes EM DIA (pesados ontem) e um talhão de cada uso. O donut pinta a
  // fatia i com colors[i]: se o dado vier ordenado por tamanho, "Em dia" sai
  // vermelho e "Descanso" sai verde. Aqui a cor tem de seguir o RÓTULO.
  const l1 = lote("l1", "A");
  const l2 = lote("l2", "B");
  const specEmDia = buildPecuariaOverview(
    {
      lotes: [l1, l2],
      animais: [animal("a1", { lote_id: "l1" }), animal("a2", { lote_id: "l2" })],
      pesagensPorAnimal: new Map([
        ["a1", [pesagem("a1", "2026-07-29", 400)]],
        ["a2", [pesagem("a2", "2026-07-29", 400)]],
      ]),
      talhoes: [
        talhao("t1", "P1", "10"),
        talhao("t2", "P2", "10"),
        talhao("t3", "P3", "10"),
        talhao("t4", "Milho", "10", "Milho"),
      ],
      ocupacoes: [ocupacao("o1", "l1", "t1")],
      hoje: HOJE,
    },
    false,
  );

  it("a cor da fatia segue o rótulo, não o tamanho", () => {
    const status = specEmDia.charts.find((c) => c.id === "pecuaria-lotes-status")!;
    expect(status.data).toEqual([{ label: "Em dia", total: 2 }]);
    expect(status.colors).toEqual(["var(--color-success)"]); // verde, não vermelho

    const uso = specEmDia.charts.find((c) => c.id === "pecuaria-uso-solo")!;
    // Descanso (2) é a maior fatia, mas "Pasto (ocupado)" continua em verde.
    expect(uso.data).toEqual([
      { label: "Pasto (ocupado)", total: 1 },
      { label: "Lavoura", total: 1 },
      { label: "Descanso", total: 2 },
    ]);
    expect(uso.colors).toEqual([
      "var(--color-success)",
      "var(--color-warning)",
      "var(--color-muted-foreground)",
    ]);
  });

  it("talhão sem área declarada tira a área do polígono desenhado", () => {
    // Sem o cálculo do polígono a lotação sairia null: o talhão some do gráfico
    // e o KPI vira "—" — o pasto desenhado no mapa ficaria invisível na visão geral.
    const spec = buildPecuariaOverview(
      {
        lotes: [lote("l1", "Engorda 1")],
        animais: [animal("a1", { lote_id: "l1" }), animal("a2", { lote_id: "l1" })],
        pesagensPorAnimal: new Map([
          ["a1", [pesagem("a1", "2026-07-29", 460)]],
          ["a2", [pesagem("a2", "2026-07-29", 410)]],
        ]),
        talhoes: [talhaoDesenhado("t1", "Piquete desenhado", 0.003)],
        ocupacoes: [ocupacao("o1", "l1", "t1")],
        hoje: HOJE,
      },
      false,
    );
    const lotacao = spec.charts.find((c) => c.id === "pecuaria-lotacao-talhao")!;
    expect(lotacao.data).toHaveLength(1);
    expect(lotacao.data[0].label).toBe("Piquete desenhado");
    expect(Number(lotacao.data[0].valor)).toBeGreaterThan(0);
    expect(spec.kpis.find((k) => k.label === "Lotação média")?.value).not.toBe("—");
  });

  it("lote em carência E sem pesagem recente ainda conta no KPI de atraso", () => {
    const antigo = lote("l3", "Esquecido");
    const spec = buildPecuariaOverview(
      {
        lotes: [antigo],
        animais: [animal("a9", { lote_id: "l3" })],
        // pesada há mais de 45 dias E com carência ativa
        pesagensPorAnimal: new Map([["a9", [pesagem("a9", "2026-04-01", 400)]]]),
        carenciaPorAnimal: new Map([["a9", "2026-08-15"]]),
        hoje: HOJE,
      },
      false,
    );
    expect(spec.kpis.find((k) => k.label === "Lotes sem pesagem recente")?.value).toBe(1);
    // No donut a situação é exclusiva: o mais grave (carência) manda.
    const status = spec.charts.find((c) => c.id === "pecuaria-lotes-status")!;
    expect(status.data).toEqual([{ label: "Carência ativa", total: 1 }]);
    expect(spec.kpis.find((k) => k.label === "Bloqueados por carência")?.value).toBe(1);
  });
});
