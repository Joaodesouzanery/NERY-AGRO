import {
  AlertTriangle,
  Beef,
  CalendarCheck,
  Camera,
  ClipboardList,
  CloudRain,
  ListChecks,
  MapPinned,
  NotebookPen,
  Sprout,
  Wallet,
  Wrench,
} from "lucide-react";
import { chartColors } from "@/lib/chart-theme";
import type { FieldRecord } from "@/lib/supabase-field";
import { buildRdcDailySummary, listFichaSummaries, localToday } from "@/features/rdc/api/services";
import { SECAO_LABEL, SECOES, isOcorrenciaTipo, type Secao } from "@/features/rdc/types/domain";
import { barras, contaPor, rosca, soma, somaPor } from "@/lib/overview/helpers";
import type { ModuleOverviewSpec, OverviewTable } from "@/lib/overview/types";

// RDC — Relatório Diário de Campo. A tela é um histórico de fichas, não um
// módulo com abas: a visão geral tinha 4 contadores (fichas, itens, custo,
// fotos) e nada dizia se o diário está em dia, o que ficou pendente ou onde o
// custo do dia foi lançado. As "abas" aqui são as SEÇÕES da ficha (campo,
// pecuária, observações, equipe) mais os cortes transversais do diário
// (atividades, ocorrências, custos, clima, vínculos).
//
// Todos os números saem dos seletores que o módulo já tem
// (listFichaSummaries / buildRdcDailySummary — este último é o mesmo que a
// Torre consome): recalcular aqui daria dois valores para a mesma coisa.

const ABAS = [
  { id: "fichas", label: "Fichas do diário" },
  { id: "campo", label: SECAO_LABEL.campo },
  { id: "pecuaria", label: SECAO_LABEL.pecuaria },
  { id: "observacoes", label: SECAO_LABEL.observacoes },
  { id: "equipe", label: SECAO_LABEL.equipe },
  { id: "atividades", label: "Atividades do dia" },
  { id: "ocorrencias", label: "Ocorrências" },
  { id: "custos", label: "Custos do diário" },
  { id: "clima", label: "Clima" },
  { id: "vinculos", label: "Talhões e animais" },
];

/** Severidade em ordem de urgência (contaPor devolve por frequência). */
const ORDEM_SEVERIDADE = ["Alta", "Atenção", "Baixa", "Sem severidade"];

const CORES_SEVERIDADE: Record<string, string> = {
  Alta: chartColors.destructive,
  Atenção: chartColors.warning,
  Baixa: chartColors.success,
  "Sem severidade": chartColors.mutedFg,
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** "1 ficha" / "3 fichas" — hint de KPI não pode sair com o plural errado. */
const plural = (n: number, um: string, muitos = `${um}s`) => `${n} ${n === 1 ? um : muitos}`;

/** dd/mm/aaaa a partir do ISO curto da ficha (sem Date, para não pegar fuso). */
function fmtData(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return "—";
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** dd/mm — rótulo curto do eixo da série diária. */
const fmtDia = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

const rotuloSecao = (valor: string | undefined) =>
  SECAO_LABEL[(valor ?? "") as Secao] ?? "Sem seção";

/**
 * Recebe a lista bruta de field_records que a página já carrega (useRdcRecords).
 * `hojeISO` existe para o teste e para o modo DEMO, que ancora o "hoje" na
 * última ficha da vitrine em vez do relógio — mesmo critério do mapa unificado.
 */
export function buildRdcOverview(
  records: FieldRecord[] | undefined,
  demoMode: boolean,
  hojeISO?: string,
): ModuleOverviewSpec {
  // A query pode estar em voo (data undefined) — o dashboard não explode por isso.
  const lista = Array.isArray(records) ? records : [];
  const hoje = hojeISO ?? localToday();

  const fichas = listFichaSummaries(lista);
  const doDia = buildRdcDailySummary(lista, hoje);

  const fichaRecords = lista.filter((r) => r.module === "rdc-ficha");
  const itens = lista.filter((r) => r.module === "rdc-entry");
  const fotos = lista.filter((r) => r.module === "rdc-photo");
  // Mesma normalização de `entryFromRecord`: seção ausente/desconhecida cai em
  // "campo". Sem isso o item entrava no custo total e sumia da quebra por seção.
  const secaoDe = (r: { payload: Record<string, string> }): Secao =>
    SECOES.includes(r.payload.secao as Secao) ? (r.payload.secao as Secao) : "campo";
  const daSecao = (secao: Secao) => itens.filter((r) => secaoDe(r) === secao);

  // Fichas em rascunho = dias que ninguém fechou. É o que trava o custo do dia
  // de virar COGS e a ocorrência de virar alerta na Torre.
  const rascunhos = fichas.filter((f) => f.status !== "Concluído");
  // A ficha mais recente sai do próprio seletor (já ordenado por data e com o
  // fallback de created_at); `latestFichaDate` cairia em "hoje" quando nenhuma
  // ficha tem `data` preenchida — o hint mentiria a data da última ficha.
  const ultimaFicha = fichas.find((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.data))?.data ?? "";
  // Clamp em 0: ficha lançada com data futura não vira "há -7 dias".
  const diasSemRdc = ultimaFicha
    ? Math.max(0, Math.round((Date.parse(hoje) - Date.parse(ultimaFicha)) / 86_400_000))
    : null;

  // Mesma regra da ficha (buildRdcModel): sem "Resolvido" no status, está aberta.
  const ocorrencias = itens.filter((r) => isOcorrenciaTipo(r.payload.tipo ?? ""));
  const ocorrenciasAbertas = ocorrencias.filter((r) => r.payload.status !== "Resolvido");
  // O hint qualifica o KPI "Ocorrências abertas" — contar as já resolvidas dava
  // "0 abertas · 1 de severidade alta" na mesma linha.
  const severidadeAlta = ocorrenciasAbertas.filter((r) =>
    /alta|crític|critic/i.test(r.payload.severidade ?? ""),
  ).length;
  const porSeveridade = contaPor(ocorrencias, "severidade", "Sem severidade").sort(
    (a, b) => ordemSeveridade(a.label) - ordemSeveridade(b.label),
  );

  const custoTotal = soma(itens, "custo");
  // Descarta a seção zerada com `!== 0` (e não `> 0`) — mesma regra de
  // `somaPor`: um estorno com sinal negativo continua no total, então precisa
  // continuar aparecendo na quebra.
  const custoPorSecao = SECOES.map((secao) => ({
    label: SECAO_LABEL[secao],
    valor: soma(daSecao(secao), "custo"),
  })).filter((c) => c.valor !== 0);

  // "Pendência" é o tipo acionável da seção de observações; um status marcado
  // como pendente conta igual (o campo é texto livre). "Em aberto" pede o corte
  // pelo status — sem ele uma pendência marcada "Resolvido" seguia contando.
  const pendencias = daSecao("observacoes").filter((r) => {
    const status = r.payload.status ?? "";
    if (/resolvid|conclu[ií]d|finalizad|encerrad/i.test(status)) return false;
    return /pend/i.test(`${r.payload.tipo ?? ""} ${status}`);
  }).length;
  const fichasSemFoto = fichas.filter((f) => f.fotos === 0).length;

  // Checklist do dia: `atividades` é JSON na ficha e já vem parseado pelo
  // seletor, então nenhum helper de payload serve aqui.
  const contagemAtividades = new Map<string, number>();
  for (const ficha of fichas) {
    for (const atividade of ficha.atividades) {
      contagemAtividades.set(atividade, (contagemAtividades.get(atividade) ?? 0) + 1);
    }
  }
  const porAtividade = [...contagemAtividades.entries()]
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor);
  const fichasSemAtividade = fichas.filter((f) => f.atividades.length === 0).length;

  const diasComChuva = new Set(fichas.filter((f) => f.clima === "Chuva").map((f) => f.data)).size;
  const fichasSemClima = fichas.filter((f) => !f.clima).length;

  // Rastreabilidade: item sem talhão/animal não chega ao Talhão 360 nem à ficha
  // do animal — vira custo órfão.
  const talhoesTocados = new Set(itens.map((r) => r.payload.talhao_id).filter(Boolean)).size;
  const animaisTocados = new Set(itens.map((r) => r.payload.animal_id).filter(Boolean)).size;
  const semVinculo = itens.filter((r) => !r.payload.talhao_id && !r.payload.animal_id).length;

  // Ritmo do diário: fichas e itens por dia (últimos 14 dias COM registro).
  const porDia = new Map<string, { fichas: number; itens: number }>();
  for (const ficha of fichas) {
    if (!ficha.data) continue;
    const dia = porDia.get(ficha.data) ?? { fichas: 0, itens: 0 };
    dia.fichas += 1;
    dia.itens += ficha.itens;
    porDia.set(ficha.data, dia);
  }
  const serieDiaria = [...porDia.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([data, valores]) => ({ label: fmtDia(data), ...valores }));

  const hintHoje = doDia.fichas
    ? `${plural(doDia.itens, "item", "itens")} · ${plural(doDia.ocorrencias, "ocorrência", "ocorrências")}`
    : ultimaFicha
      ? `Última em ${fmtData(ultimaFicha)} · há ${plural(diasSemRdc ?? 0, "dia")}`
      : "Nenhuma ficha registrada";

  const tables: OverviewTable[] = [];
  if (rascunhos.length) {
    tables.push({
      id: "rdc-rascunhos",
      tabId: "fichas",
      title: "Fichas em aberto",
      description: "Dias que ainda não foram fechados",
      head: ["Data", "Ficha", "Responsável", "Itens", "Custo"],
      body: rascunhos
        .slice(0, 8)
        .map((f) => [fmtData(f.data), f.titulo, f.responsavel || "—", f.itens, brl(f.custo)]),
    });
  }
  if (ocorrenciasAbertas.length) {
    tables.push({
      id: "rdc-ocorrencias-abertas",
      tabId: "ocorrencias",
      title: "Ocorrências em aberto",
      description: "Itens de campo e sanidade sem resolução",
      head: ["Data", "Seção", "Descrição", "Severidade"],
      body: [...ocorrenciasAbertas]
        .sort((a, b) => (b.payload.data ?? "").localeCompare(a.payload.data ?? ""))
        .slice(0, 8)
        .map((r) => [
          fmtData(r.payload.data ?? ""),
          rotuloSecao(r.payload.secao),
          r.payload.descricao || "—",
          r.payload.severidade || "—",
        ]),
    });
  }

  return {
    moduleId: "rdc",
    moduleLabel: "RDC — Relatório Diário de Campo",
    tabs: ABAS,
    demoMode,
    kpis: [
      {
        label: "RDC de hoje",
        value: doDia.fichas,
        icon: CalendarCheck,
        hint: hintHoje,
        trendDir: doDia.fichas ? "up" : "down",
        tabId: "fichas",
      },
      {
        label: "Fichas em rascunho",
        value: rascunhos.length,
        icon: ClipboardList,
        hint: `de ${plural(fichas.length, "ficha")}`,
        trendDir: rascunhos.length ? "down" : "up",
        tabId: "fichas",
      },
      {
        label: "Custo lançado",
        value: brl(custoTotal),
        icon: Wallet,
        hint: "Itens do diário que viram COGS",
        tabId: "custos",
      },
      {
        label: "Ocorrências abertas",
        value: ocorrenciasAbertas.length,
        icon: AlertTriangle,
        hint: `${severidadeAlta} de severidade alta`,
        trendDir: ocorrenciasAbertas.length ? "down" : "up",
        tabId: "ocorrencias",
      },
      {
        label: "Custo de campo",
        value: brl(soma(daSecao("campo"), "custo")),
        icon: Sprout,
        hint: plural(daSecao("campo").length, "item", "itens"),
        tabId: "campo",
      },
      {
        label: "Animais acompanhados",
        value: animaisTocados,
        icon: Beef,
        hint: `${plural(daSecao("pecuaria").length, "item", "itens")} de manejo`,
        tabId: "pecuaria",
      },
      {
        label: "Pendências em aberto",
        value: pendencias,
        icon: NotebookPen,
        trendDir: pendencias ? "down" : "up",
        tabId: "observacoes",
      },
      {
        label: "Fotos anexadas",
        value: fotos.length,
        icon: Camera,
        hint: `${plural(fichasSemFoto, "ficha")} sem foto`,
        tabId: "observacoes",
      },
      {
        label: "Custo de equipe e máquinas",
        value: brl(soma(daSecao("equipe"), "custo")),
        icon: Wrench,
        hint: plural(daSecao("equipe").length, "apontamento"),
        tabId: "equipe",
      },
      {
        label: "Fichas sem atividade",
        value: fichasSemAtividade,
        icon: ListChecks,
        hint: "Checklist do dia em branco",
        trendDir: fichasSemAtividade ? "down" : "up",
        tabId: "atividades",
      },
      {
        label: "Dias com chuva",
        value: diasComChuva,
        icon: CloudRain,
        hint: `${plural(fichasSemClima, "ficha")} sem clima informado`,
        tabId: "clima",
      },
      {
        label: "Talhões tocados",
        value: talhoesTocados,
        icon: MapPinned,
        hint: `${plural(semVinculo, "item", "itens")} sem vínculo`,
        tabId: "vinculos",
      },
    ],
    charts: [
      {
        id: "rdc-ritmo-diario",
        tabId: "fichas",
        title: "Fichas e itens por dia",
        description: "Se a linha cai, o campo parou de apontar",
        featured: true,
        kind: "trend",
        xKey: "label",
        series: [
          { key: "fichas", name: "Fichas", color: chartColors.primary },
          { key: "itens", name: "Itens", color: chartColors.c1 },
        ],
        data: serieDiaria,
      },
      barras({
        id: "rdc-custo-secao",
        tabId: "custos",
        title: "Custo lançado por seção",
        description: "De onde vem o custo do dia",
        featured: true,
        format: "brl",
        nome: "Custo",
        data: custoPorSecao,
      }),
      rosca({
        id: "rdc-ocorrencias-severidade",
        tabId: "ocorrencias",
        title: "Ocorrências por severidade",
        description: "Campo e sanidade juntos",
        featured: true,
        nome: "Ocorrências",
        colors: porSeveridade.map((s) => CORES_SEVERIDADE[s.label] ?? chartColors.c2),
        data: porSeveridade,
      }),
      barras({
        id: "rdc-fichas-responsavel",
        tabId: "fichas",
        title: "Fichas por responsável",
        layout: "vertical",
        nome: "Fichas",
        limite: 8,
        data: contaPor(fichaRecords, "responsavel", "Sem responsável").map((c) => ({
          label: c.label,
          valor: c.total,
        })),
      }),
      rosca({
        id: "rdc-campo-tipo",
        tabId: "campo",
        title: "Itens de campo por tipo",
        nome: "Itens",
        data: contaPor(daSecao("campo"), "tipo"),
      }),
      rosca({
        id: "rdc-pecuaria-tipo",
        tabId: "pecuaria",
        title: "Pecuária por tipo de manejo",
        nome: "Itens",
        data: contaPor(daSecao("pecuaria"), "tipo"),
      }),
      rosca({
        id: "rdc-observacoes-status",
        tabId: "observacoes",
        title: "Observações por status",
        nome: "Itens",
        data: contaPor(daSecao("observacoes"), "status", "Sem status"),
      }),
      barras({
        id: "rdc-fotos-secao",
        tabId: "observacoes",
        title: "Fotos por seção",
        nome: "Fotos",
        data: contaPor(fotos, "secao").map((c) => ({
          label: rotuloSecao(c.label),
          valor: c.total,
        })),
      }),
      barras({
        id: "rdc-equipe-custo",
        tabId: "equipe",
        title: "Custo por tipo de recurso",
        description: "Mão de obra, máquina e implemento",
        format: "brl",
        nome: "Custo",
        data: somaPor(daSecao("equipe"), "tipo", "custo"),
      }),
      barras({
        id: "rdc-atividades",
        tabId: "atividades",
        title: "Atividades mais executadas",
        description: "Checklist marcado nas fichas",
        layout: "vertical",
        nome: "Dias",
        limite: 10,
        data: porAtividade,
      }),
      rosca({
        id: "rdc-clima",
        tabId: "clima",
        title: "Fichas por condição climática",
        nome: "Fichas",
        data: contaPor(fichaRecords, "clima", "Sem clima informado"),
      }),
      barras({
        id: "rdc-itens-talhao",
        tabId: "vinculos",
        title: "Itens por talhão",
        description: "O que o diário devolve para o Talhão 360",
        layout: "vertical",
        nome: "Itens",
        limite: 8,
        data: contaPor(
          itens.filter((r) => r.payload.talhao_nome),
          "talhao_nome",
        ).map((c) => ({ label: c.label, valor: c.total })),
      }),
    ],
    tables: tables.length ? tables : undefined,
  };
}

function ordemSeveridade(label: string): number {
  const posicao = ORDEM_SEVERIDADE.indexOf(label);
  return posicao < 0 ? ORDEM_SEVERIDADE.length : posicao;
}
