import type { OperationRecord } from "@/lib/supabase-operations";

// Métricas puras da Logística — derivadas dos operation_records (area "logistica").
// Sem dependência de React/Supabase, para serem testáveis e reusadas pelo
// dashboard, pela Torre de Controle e pelo COGS.

function num(value: unknown): number {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function norm(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function byModule(records: OperationRecord[], module: string): OperationRecord[] {
  return records.filter((r) => r.module === module);
}

export type LogisticaMetrics = {
  totalCargas: number;
  emTransito: number;
  entregues: number;
  atrasadas: number;
  aguardando: number;
  /**
   * Entregues ÷ (entregues + atrasadas). `null` quando não houve NENHUMA das
   * duas: sem base de cálculo, "0%" afirmaria desempenho ruim onde não houve
   * medição. A visão geral já testava `=== null` — mas o tipo era `number` e
   * o valor 0, então o "—" nunca aparecia.
   */
  otif: number | null;
  valorTotal: number; // soma de cargas.valor
  custoFreteTotal: number; // soma de fretes (custo + combustível + pedágio)
  frotaTotal: number;
  frotaDisponivel: number;
  capacidadePct: number; // disponível / total * 100
};

export function buildLogisticaMetrics(records: OperationRecord[]): LogisticaMetrics {
  const cargas = byModule(records, "cargas");
  const fretes = byModule(records, "fretes");
  const frota = byModule(records, "frota");

  const statusCount = (term: string) =>
    cargas.filter((c) => norm(c.payload.status).includes(term)).length;

  const entregues = statusCount("entregue");
  const atrasadas = statusCount("atras");
  const emTransito = statusCount("transito");
  const aguardando = statusCount("aguard");

  const valorTotal = cargas.reduce((sum, c) => sum + num(c.payload.valor), 0);
  const custoFreteTotal = fretes.reduce(
    (sum, f) => sum + num(f.payload.custo) + num(f.payload.combustivel) + num(f.payload.pedagio),
    0,
  );

  const frotaTotal = frota.length;
  const frotaDisponivel = frota.filter((f) => norm(f.payload.status).includes("dispon")).length;
  const otifBase = entregues + atrasadas;

  return {
    totalCargas: cargas.length,
    emTransito,
    entregues,
    atrasadas,
    aguardando,
    otif: otifBase ? Math.round((entregues / otifBase) * 100) : null,
    valorTotal,
    custoFreteTotal,
    frotaTotal,
    frotaDisponivel,
    capacidadePct: frotaTotal ? Math.round((frotaDisponivel / frotaTotal) * 100) : 0,
  };
}

/** Custo de frete agregado por rota (para gráfico de barras), maior primeiro. */
export function freightByRoute(records: OperationRecord[]): Array<{ rota: string; custo: number }> {
  const fretes = byModule(records, "fretes");
  const map = new Map<string, number>();
  for (const f of fretes) {
    const rota = f.payload.rota?.trim() || "Sem rota";
    const custo = num(f.payload.custo) + num(f.payload.combustivel) + num(f.payload.pedagio);
    map.set(rota, (map.get(rota) ?? 0) + custo);
  }
  return [...map.entries()]
    .map(([rota, custo]) => ({ rota, custo }))
    .sort((a, b) => b.custo - a.custo);
}

/** Distribuição de cargas por status (para donut/legenda). */
export function cargaStatusBreakdown(
  records: OperationRecord[],
): Array<{ status: string; valor: number }> {
  const cargas = byModule(records, "cargas");
  const map = new Map<string, number>();
  for (const c of cargas) {
    const status = c.payload.status?.trim() || "Sem status";
    map.set(status, (map.get(status) ?? 0) + 1);
  }
  return [...map.entries()].map(([status, valor]) => ({ status, valor }));
}

export type SlaNivel = "estourado" | "em_risco" | "ok";
/** De onde veio o prazo — é o que explica por que a linha está vermelha. */
export type SlaFonte = "eta" | "rota" | "padrao" | "status";

export type SlaConfig = {
  /** Prazo usado quando não há ETA digitada nem rota casada. */
  horasPadrao: number;
  /** Janela do aviso: quanto antes do vencimento a carga entra em "em risco". */
  avisoHoras: number;
};

export const SLA_CARGA_PADRAO: SlaConfig = { horasPadrao: 24, avisoHoras: 6 };

export type SlaCarga = {
  id: string;
  codigo: string;
  cliente: string;
  destino: string;
  eta: string;
  /** Instante-limite calculado. É a origem do nível, não o `eta` cru. */
  prazoISO: string;
  fonte: SlaFonte;
  nivel: SlaNivel;
  motivo: string;
  horasRestantes: number | null;
  tratado: boolean;
};

function normChave(v: unknown): string {
  return norm(v).replace(/[^a-z0-9]/g, "");
}

/** Fim do dia local de uma data YYYY-MM-DD — ETA é promessa de DIA, não de hora. */
function fimDoDia(data: string): number {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia, 23, 59, 59, 999).getTime();
}

/**
 * Situação de prazo de TODAS as cargas — não só das violadas.
 *
 * A função anterior (`slaBreaches`) devolvia apenas quem já tinha estourado, e
 * o painel sumia da tela quando não havia violação nenhuma. Some sem dizer nada
 * parece defeito; e avisar só depois do prazo vencido é informação que chega
 * quando o cliente já foi prejudicado.
 *
 * O prazo vem de uma cascata, e a `fonte` diz qual perna valeu:
 *  1. `eta` digitada — vale até as 23:59 daquele dia;
 *  2. `rotas.sla` (horas), casando origem→destino — é o que finalmente liga
 *     aquele campo, que existia no cadastro e não entrava em cálculo nenhum;
 *  3. o padrão configurável da empresa.
 *
 * `agoraISO` entra por parâmetro para a função seguir pura.
 */
export function slaCargas(
  records: OperationRecord[],
  agoraISO: string,
  config: SlaConfig = SLA_CARGA_PADRAO,
): SlaCarga[] {
  const agora = new Date(agoraISO).getTime();
  const rotas = byModule(records, "rotas");

  const slaDaRota = (origem: string, destino: string): number => {
    const o = normChave(origem);
    const d = normChave(destino);
    if (!o && !d) return 0;
    const casa = rotas.find((r) => {
      const ro = normChave(r.payload.origem);
      const rd = normChave(r.payload.destino);
      if (ro && rd) return ro === o && rd === d;
      // Rota cadastrada só com nome ("Cristalina → São Paulo") ainda casa.
      const nome = normChave(r.payload.nome);
      return Boolean(nome) && nome.includes(o) && nome.includes(d);
    });
    return casa ? num(casa.payload.sla) : 0;
  };

  return byModule(records, "cargas").map((c) => {
    const status = norm(c.payload.status);
    const eta = c.payload.eta?.trim() ?? "";
    const codigo = c.payload.codigo?.trim() || c.id;
    const base = {
      id: c.id,
      codigo,
      cliente: c.payload.cliente?.trim() || "-",
      destino: c.payload.destino?.trim() || "-",
      eta: eta || "-",
    };

    // Tratada: alguém já registrou o motivo. Reabre se o nível PIORAR ou se a
    // ETA for remarcada — tratar não pode virar "sumiu para sempre".
    const tratadaEm = c.payload.sla_tratado_em?.trim() ?? "";
    const tratadaNivel = c.payload.sla_tratado_nivel?.trim() ?? "";
    const tratadaEta = c.payload.sla_tratado_eta?.trim() ?? "";

    if (status.includes("entregue")) {
      return {
        ...base,
        prazoISO: "",
        fonte: "status" as const,
        nivel: "ok" as const,
        motivo: "Entregue",
        horasRestantes: null,
        tratado: false,
      };
    }

    // Prazo, na ordem da cascata.
    let prazo = 0;
    let fonte: SlaFonte = "padrao";
    if (/^\d{4}-\d{2}-\d{2}$/.test(eta)) {
      prazo = fimDoDia(eta);
      fonte = "eta";
    } else {
      const partida = new Date(c.payload.saida?.trim() || c.created_at || agoraISO).getTime();
      const horas = slaDaRota(c.payload.origem ?? "", c.payload.destino ?? "");
      if (horas > 0) {
        prazo = partida + horas * 3_600_000;
        fonte = "rota";
      } else {
        prazo = partida + config.horasPadrao * 3_600_000;
        fonte = "padrao";
      }
    }

    const horasRestantes = (prazo - agora) / 3_600_000;
    const vencido = agora > prazo;
    // Status escrito à mão vence o cálculo: é declaração de quem está lá.
    const declaradoAtrasado = status.includes("atras");

    let nivel: SlaNivel = "ok";
    let motivo = "No prazo";
    if (declaradoAtrasado) {
      nivel = "estourado";
      motivo = "Status atrasado";
    } else if (vencido) {
      nivel = "estourado";
      motivo =
        fonte === "eta"
          ? "ETA vencida"
          : fonte === "rota"
            ? "Prazo da rota vencido"
            : "Prazo padrão vencido";
    } else if (horasRestantes <= config.avisoHoras) {
      nivel = "em_risco";
      motivo = `Vence em ${Math.max(1, Math.round(horasRestantes))}h`;
    }

    return {
      ...base,
      prazoISO: new Date(prazo).toISOString(),
      fonte,
      nivel,
      motivo,
      horasRestantes,
      tratado: Boolean(tratadaEm) && tratadaNivel === nivel && tratadaEta === eta,
    };
  });
}

export function slaResumo(lista: SlaCarga[]) {
  return {
    estourado: lista.filter((s) => s.nivel === "estourado" && !s.tratado).length,
    emRisco: lista.filter((s) => s.nivel === "em_risco" && !s.tratado).length,
    ok: lista.filter((s) => s.nivel === "ok").length,
    tratadas: lista.filter((s) => s.tratado).length,
  };
}

/** As que exigem ação: fora do prazo ou vencendo, e ainda sem tratativa. */
export function slaPendentes(lista: SlaCarga[]): SlaCarga[] {
  const peso = { estourado: 0, em_risco: 1, ok: 2 };
  return lista
    .filter((s) => s.nivel !== "ok" && !s.tratado)
    .sort(
      (a, b) => peso[a.nivel] - peso[b.nivel] || (a.horasRestantes ?? 0) - (b.horasRestantes ?? 0),
    );
}
