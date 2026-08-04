import { localToday } from "@/lib/date-local";
import type {
  InsumoAlerta,
  InsumoRecord,
  InsumoResumo,
  InsumosModel,
  LoteRecord,
  LoteResumo,
  MovimentacaoRecord,
} from "@/features/insumos/types/domain";

export function num(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function hoje() {
  return localToday();
}

// Efeito de cada tipo de movimentação no saldo FÍSICO do lote.
// Reserva não baixa o físico (só o disponível); transferência muda o local do lote.
export function efeitoFisico(mov: MovimentacaoRecord) {
  const quantidade = num(mov.payload.quantidade);
  switch (mov.payload.tipo) {
    case "entrada":
      return quantidade;
    case "saida":
    case "perda":
    case "devolucao":
      return -quantidade;
    case "ajuste":
      return quantidade; // ajuste aceita valor negativo
    default:
      return 0;
  }
}

export function reservaAtiva(mov: MovimentacaoRecord) {
  return mov.payload.tipo === "reserva" && (mov.payload.status || "ativa") === "ativa";
}

export function saldoFisicoLote(lote: LoteRecord, movimentacoes: MovimentacaoRecord[]) {
  return movimentacoes
    .filter((mov) => mov.payload.lote_id === lote.id)
    .reduce((saldo, mov) => saldo + efeitoFisico(mov), num(lote.payload.quantidade_inicial));
}

export function reservadoLote(lote: LoteRecord, movimentacoes: MovimentacaoRecord[]) {
  return movimentacoes
    .filter((mov) => mov.payload.lote_id === lote.id && reservaAtiva(mov))
    .reduce((total, mov) => total + num(mov.payload.quantidade), 0);
}

export function diasParaVencer(validade: string | undefined, referencia = hoje()) {
  if (!validade) return undefined;
  const alvo = new Date(`${validade}T12:00:00`);
  if (Number.isNaN(alvo.getTime())) return undefined;
  const base = new Date(`${referencia}T12:00:00`);
  return Math.round((alvo.getTime() - base.getTime()) / 86_400_000);
}

export function buildLoteResumo(
  lote: LoteRecord,
  movimentacoes: MovimentacaoRecord[],
  referencia = hoje(),
): LoteResumo {
  const saldoFisico = saldoFisicoLote(lote, movimentacoes);
  const reservado = reservadoLote(lote, movimentacoes);
  const dias = diasParaVencer(lote.payload.validade, referencia);
  return {
    lote,
    saldoFisico,
    reservado,
    disponivel: saldoFisico - reservado,
    valorEmEstoque: saldoFisico * num(lote.payload.custo_unitario),
    vencido: dias !== undefined && dias < 0,
    diasParaVencer: dias,
  };
}

export function buildInsumoResumo(
  insumo: InsumoRecord,
  lotes: LoteRecord[],
  movimentacoes: MovimentacaoRecord[],
  referencia = hoje(),
): InsumoResumo {
  const doInsumo = lotes.filter((lote) => lote.payload.insumo_id === insumo.id);
  const resumos = doInsumo.map((lote) => buildLoteResumo(lote, movimentacoes, referencia));
  // Reservas sem lote vinculado contam no reservado do insumo.
  const reservadoSemLote = movimentacoes
    .filter(
      (mov) => mov.payload.insumo_id === insumo.id && !mov.payload.lote_id && reservaAtiva(mov),
    )
    .reduce((total, mov) => total + num(mov.payload.quantidade), 0);
  const saldoFisico = resumos.reduce((total, item) => total + item.saldoFisico, 0);
  const reservado = resumos.reduce((total, item) => total + item.reservado, 0) + reservadoSemLote;
  const disponivel = saldoFisico - reservado;
  const minimo = num(insumo.payload.estoque_minimo);
  return {
    insumo,
    lotes: resumos,
    saldoFisico,
    reservado,
    disponivel,
    valorEmEstoque: resumos.reduce((total, item) => total + item.valorEmEstoque, 0),
    abaixoDoMinimo: minimo > 0 && disponivel < minimo,
  };
}

const VENCIMENTO_ALERTA_DIAS = 30;

export function buildAlertas(resumos: InsumoResumo[]): InsumoAlerta[] {
  const alertas: InsumoAlerta[] = [];
  for (const resumo of resumos) {
    const nome = resumo.insumo.payload.nome;
    const unidade = resumo.insumo.payload.unidade || "un";
    for (const item of resumo.lotes) {
      if (item.saldoFisico <= 0) continue;
      const numero = item.lote.payload.numero || item.lote.id.slice(0, 8);
      if (item.vencido) {
        alertas.push({
          id: `vencido-${item.lote.id}`,
          severidade: "critico",
          titulo: `Lote vencido: ${nome}`,
          descricao: `Lote ${numero} venceu em ${formatDate(item.lote.payload.validade)} com ${formatQtd(item.saldoFisico)} ${unidade} em estoque.`,
        });
      } else if (
        item.diasParaVencer !== undefined &&
        item.diasParaVencer <= VENCIMENTO_ALERTA_DIAS
      ) {
        alertas.push({
          id: `vencendo-${item.lote.id}`,
          severidade: "atencao",
          titulo: `Validade crítica: ${nome}`,
          descricao: `Lote ${numero} vence em ${item.diasParaVencer} dia(s) com ${formatQtd(item.saldoFisico)} ${unidade} em estoque.`,
        });
      }
    }
    if (resumo.abaixoDoMinimo) {
      alertas.push({
        id: `minimo-${resumo.insumo.id}`,
        severidade: "atencao",
        titulo: `Estoque abaixo do mínimo: ${nome}`,
        descricao: `Disponível ${formatQtd(resumo.disponivel)} ${unidade}; mínimo configurado ${formatQtd(num(resumo.insumo.payload.estoque_minimo))} ${unidade}.`,
      });
    }
    if (resumo.disponivel < 0) {
      alertas.push({
        id: `sem-saldo-${resumo.insumo.id}`,
        severidade: "critico",
        titulo: `Reserva sem estoque: ${nome}`,
        descricao: `Reservas ativas (${formatQtd(resumo.reservado)} ${unidade}) excedem o saldo físico (${formatQtd(resumo.saldoFisico)} ${unidade}).`,
      });
    }
  }
  return alertas.sort((a, b) =>
    a.severidade === b.severidade ? 0 : a.severidade === "critico" ? -1 : 1,
  );
}

export function buildInsumosModel(
  insumos: InsumoRecord[],
  lotes: LoteRecord[],
  movimentacoes: MovimentacaoRecord[],
  referencia = hoje(),
): InsumosModel {
  const resumos = insumos
    .map((insumo) => buildInsumoResumo(insumo, lotes, movimentacoes, referencia))
    .sort((a, b) => a.insumo.payload.nome.localeCompare(b.insumo.payload.nome, "pt-BR"));
  const lotesResumo = resumos.flatMap((resumo) => resumo.lotes);
  const custoPorInsumo = new Map(
    resumos.map((resumo) => [resumo.insumo.id, custoUnitarioMedio(resumo)]),
  );
  const valorReservado = movimentacoes
    .filter(reservaAtiva)
    .reduce(
      (total, mov) =>
        total + custoMovimentacao(mov, lotes, custoPorInsumo.get(mov.payload.insumo_id)),
      0,
    );
  return {
    insumos: resumos,
    movimentacoes: [...movimentacoes].sort((a, b) =>
      String(b.payload.data || b.created_at || "").localeCompare(
        String(a.payload.data || a.created_at || ""),
      ),
    ),
    alertas: buildAlertas(resumos),
    valorEmEstoque: resumos.reduce((total, item) => total + item.valorEmEstoque, 0),
    valorReservado,
    lotesAVencer: lotesResumo.filter(
      (item) =>
        item.saldoFisico > 0 &&
        !item.vencido &&
        item.diasParaVencer !== undefined &&
        item.diasParaVencer <= VENCIMENTO_ALERTA_DIAS,
    ).length,
    lotesVencidos: lotesResumo.filter((item) => item.saldoFisico > 0 && item.vencido).length,
  };
}

export function custoUnitarioMedio(resumo: InsumoResumo) {
  const comSaldo = resumo.lotes.filter((item) => item.saldoFisico > 0);
  const saldo = comSaldo.reduce((total, item) => total + item.saldoFisico, 0);
  if (saldo <= 0) return 0;
  return comSaldo.reduce((total, item) => total + item.valorEmEstoque, 0) / saldo;
}

// Custo de uma movimentação: usa custo_total informado; senão quantidade × custo do lote
// (ou custo médio do insumo, quando a movimentação não tem lote).
export function custoMovimentacao(
  mov: MovimentacaoRecord,
  lotes: LoteRecord[],
  custoMedioInsumo = 0,
) {
  const informado = num(mov.payload.custo_total);
  if (informado > 0) return informado;
  const lote = lotes.find((item) => item.id === mov.payload.lote_id);
  const unitario = lote ? num(lote.payload.custo_unitario) : custoMedioInsumo;
  return Math.abs(num(mov.payload.quantidade)) * unitario;
}

export function belongsToTalhao(mov: MovimentacaoRecord, talhao: { id: string; nome?: string }) {
  return (
    mov.payload.talhao_id === talhao.id ||
    (!mov.payload.talhao_id && !!talhao.nome && mov.payload.talhao === talhao.nome)
  );
}

export type TalhaoInsumosResumo = {
  movimentacoes: MovimentacaoRecord[];
  reservas: MovimentacaoRecord[];
  aplicacoes: MovimentacaoRecord[];
  custoPrevisto: number; // reservas ativas
  custoRealizado: number; // saídas executadas
  custoPorCategoria: Array<{ label: string; value: number }>;
};

export function buildTalhaoInsumosResumo(
  model: InsumosModel,
  lotes: LoteRecord[],
  talhao: { id: string; nome?: string },
  safra?: string,
): TalhaoInsumosResumo {
  const custoPorInsumo = new Map(
    model.insumos.map((resumo) => [resumo.insumo.id, custoUnitarioMedio(resumo)]),
  );
  const categoriaPorInsumo = new Map(
    model.insumos.map((resumo) => [resumo.insumo.id, resumo.insumo.payload.categoria || "Outros"]),
  );
  const doTalhao = model.movimentacoes.filter(
    (mov) =>
      belongsToTalhao(mov, talhao) && (!safra || !mov.payload.safra || mov.payload.safra === safra),
  );
  const reservas = doTalhao.filter(reservaAtiva);
  const aplicacoes = doTalhao.filter((mov) => mov.payload.tipo === "saida");
  const custo = (mov: MovimentacaoRecord) =>
    custoMovimentacao(mov, lotes, custoPorInsumo.get(mov.payload.insumo_id));
  const porCategoria = new Map<string, number>();
  for (const mov of aplicacoes) {
    const categoria = categoriaPorInsumo.get(mov.payload.insumo_id) || "Outros";
    porCategoria.set(categoria, (porCategoria.get(categoria) ?? 0) + custo(mov));
  }
  return {
    movimentacoes: doTalhao,
    reservas,
    aplicacoes,
    custoPrevisto: reservas.reduce((total, mov) => total + custo(mov), 0),
    custoRealizado: aplicacoes.reduce((total, mov) => total + custo(mov), 0),
    custoPorCategoria: [...porCategoria.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
  };
}

export function formatQtd(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function formatDate(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}
