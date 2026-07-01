import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  Edit3,
  Gauge,
  LayoutDashboard,
  MapPin,
  Package,
  Plus,
  Trash2,
  Truck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import {
  createOperationRecord,
  deleteOperationRecord,
  listOperationRecordsByAreaModule,
  OperationRecord,
  updateOperationRecord,
} from "@/lib/supabase-operations";
import { useDemoMode } from "@/hooks/use-demo-mode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PeriodPicker, defaultPeriod, type PeriodValue } from "@/components/period-picker";
import { invalidateConnectedQueries, useConnectedAgroData } from "@/lib/connected-agro-data";
import { ImportRecordsButton } from "@/components/import-records-button";
import { StatKpi } from "@/components/stat-kpi";
import { EmptyState } from "@/components/empty-state";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  buildLogisticaMetrics,
  cargaStatusBreakdown,
  freightByRoute,
  slaBreaches,
} from "@/lib/logistica-metrics";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColors } from "@/components/charts";
import { RichBarList, RichTabKpis, RichTabPanel } from "@/components/rich-tab";

export const Route = createFileRoute("/logistica")({
  head: () => ({
    meta: [
      { title: "Logística e Distribuição - AgroTorre" },
      {
        name: "description",
        content:
          "Cadastro e acompanhamento de cargas, motoristas, rotas, frota, bases, roteirização, expedição, embalagens, cestas e fretes.",
      },
    ],
  }),
  component: LogisticaPage,
});

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea";
  hint?: string;
};

type ModuleConfig = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FieldConfig[];
};

const AREA = "logistica";

const modules: ModuleConfig[] = [
  {
    id: "cargas",
    label: "Cargas",
    description: "Pedidos em separação, em trânsito e entregues. Posiciona pinos no mapa.",
    icon: Truck,
    fields: [
      { key: "codigo", label: "Código" },
      { key: "cliente", label: "Cliente" },
      { key: "origem", label: "Cidade de Origem" },
      { key: "origem_lat", label: "Latitude Origem", type: "number", hint: "-23.55" },
      { key: "origem_lng", label: "Longitude Origem", type: "number", hint: "-46.63" },
      { key: "destino", label: "Cidade de Destino" },
      { key: "destino_lat", label: "Latitude Destino", type: "number" },
      { key: "destino_lng", label: "Longitude Destino", type: "number" },
      { key: "peso", label: "Peso (kg)", type: "number" },
      { key: "valor", label: "Valor (R$)", type: "number" },
      { key: "motorista", label: "Motorista" },
      { key: "placa", label: "Placa do Veículo" },
      { key: "status", label: "Status", hint: "Em trânsito, Entregue, Atrasado, Aguardando" },
      { key: "eta", label: "ETA", type: "date" },
    ],
  },
  {
    id: "motoristas",
    label: "Motoristas",
    description: "Equipe ativa, escala, posição atual e desempenho.",
    icon: Users,
    fields: [
      { key: "nome", label: "Nome" },
      { key: "cnh", label: "CNH" },
      { key: "telefone", label: "Telefone" },
      { key: "veiculo", label: "Veículo padrão" },
      { key: "atual_lat", label: "Latitude Atual", type: "number" },
      { key: "atual_lng", label: "Longitude Atual", type: "number" },
      { key: "status", label: "Status", hint: "Disponível, Em rota, Folga" },
      { key: "score", label: "Score", type: "number" },
    ],
  },
  {
    id: "rotas",
    label: "Rotas",
    description: "Trajetos planejados com custo, SLA e paradas.",
    icon: MapPin,
    fields: [
      { key: "nome", label: "Nome da rota" },
      { key: "origem", label: "Origem" },
      { key: "origem_lat", label: "Latitude Origem", type: "number" },
      { key: "origem_lng", label: "Longitude Origem", type: "number" },
      { key: "destino", label: "Destino" },
      { key: "destino_lat", label: "Latitude Destino", type: "number" },
      { key: "destino_lng", label: "Longitude Destino", type: "number" },
      { key: "distancia", label: "Distância (km)", type: "number" },
      { key: "sla", label: "SLA (h)", type: "number" },
      { key: "paradas", label: "Paradas intermediárias" },
    ],
  },
  {
    id: "frota",
    label: "Frota",
    description: "Veículos da operação com posição e situação.",
    icon: Wrench,
    fields: [
      { key: "placa", label: "Placa" },
      { key: "modelo", label: "Modelo" },
      { key: "tipo", label: "Tipo", hint: "Carreta, Truck, VUC, Van" },
      { key: "capacidade", label: "Capacidade (kg)", type: "number" },
      { key: "atual_lat", label: "Latitude Atual", type: "number" },
      { key: "atual_lng", label: "Longitude Atual", type: "number" },
      { key: "status", label: "Status", hint: "Disponível, Em rota, Manutenção" },
      { key: "ultima_manutencao", label: "Última manutenção", type: "date" },
    ],
  },
  {
    id: "bases",
    label: "Bases e Filiais",
    description: "Matriz, filiais e centros de distribuição.",
    icon: Building2,
    fields: [
      { key: "nome", label: "Nome" },
      { key: "tipo", label: "Tipo", hint: "Matriz, Filial, Centro de Distribuição" },
      { key: "endereco", label: "Endereço" },
      { key: "cidade", label: "Cidade / UF" },
      { key: "lat", label: "Latitude", type: "number" },
      { key: "lng", label: "Longitude", type: "number" },
      { key: "responsavel", label: "Responsável" },
    ],
  },
  {
    id: "roteirizacao",
    label: "Roteirização de Entregas na Cidade",
    description: "Sequência urbana de paradas, bairros, tempo previsto e responsável.",
    icon: MapPin,
    fields: [
      { key: "rota", label: "Rota" },
      { key: "motorista", label: "Motorista" },
      { key: "veiculo", label: "Veículo" },
      { key: "bairros", label: "Bairros atendidos" },
      { key: "paradas", label: "Paradas", type: "number" },
      { key: "distancia", label: "Distância (km)", type: "number" },
      { key: "tempo_previsto", label: "Tempo previsto" },
      { key: "status", label: "Status", hint: "Planejada, Em execução, Concluída" },
    ],
  },
  {
    id: "embalagens",
    label: "Controle de Embalagens e Estoque",
    description: "Saldos, mínimos, validade, fornecedor e necessidade de reposição.",
    icon: Boxes,
    fields: [
      { key: "item", label: "Item" },
      { key: "sku", label: "SKU" },
      { key: "saldo", label: "Saldo", type: "number" },
      { key: "minimo", label: "Estoque mínimo", type: "number" },
      { key: "fornecedor", label: "Fornecedor" },
      { key: "validade", label: "Validade", type: "date" },
      { key: "status", label: "Status", hint: "OK, Repor, Bloqueado" },
    ],
  },
  {
    id: "cestas",
    label: "Sistema de Cestas/Assinaturas (CSA)",
    description: "Planos recorrentes, frequência, próxima entrega, itens padrão e pausas.",
    icon: Package,
    fields: [
      { key: "cliente", label: "Cliente" },
      { key: "plano", label: "Plano" },
      { key: "frequencia", label: "Frequência" },
      { key: "proxima_entrega", label: "Próxima entrega", type: "date" },
      { key: "itens_padrao", label: "Itens padrão", type: "textarea" },
      { key: "pausa_ate", label: "Pausa até", type: "date" },
      { key: "status", label: "Status", hint: "Ativa, Pausada, Cancelada" },
    ],
  },
  {
    id: "expedicao",
    label: "Checklist de Expedição Pré-carga",
    description: "Conferência de pedido, temperatura, lacres e itens antes da saída.",
    icon: ClipboardList,
    fields: [
      { key: "pedido", label: "Pedido" },
      { key: "responsavel", label: "Responsável" },
      { key: "itens", label: "Itens previstos", type: "textarea" },
      { key: "conferidos", label: "Itens conferidos" },
      { key: "temperatura", label: "Temperatura" },
      { key: "lacres", label: "Lacres" },
      { key: "status", label: "Status", hint: "Pendente, Aprovado, Revisar" },
    ],
  },
  {
    id: "fretes",
    label: "Gestão de Fretes e Custo de Transporte",
    description: "Custo por rota, transportadora, quilometragem, combustível e pedágios.",
    icon: Wallet,
    fields: [
      { key: "rota", label: "Rota" },
      { key: "transportadora", label: "Transportadora" },
      { key: "km", label: "Km", type: "number" },
      { key: "custo", label: "Custo total (R$)", type: "number" },
      { key: "combustivel", label: "Combustível (R$)", type: "number" },
      { key: "pedagio", label: "Pedágio (R$)", type: "number" },
      { key: "status", label: "Status", hint: "Previsto, Fechado, Revisar" },
    ],
  },
];

const demoByModule: Record<string, OperationRecord[]> = {
  roteirizacao: [
    record("roteirizacao", "1", {
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
    record("embalagens", "1", {
      item: "Caixa hortifruti P",
      sku: "CX-HF-P",
      saldo: "620",
      minimo: "300",
      fornecedor: "Pack Verde",
      validade: "2026-09-30",
      status: "OK",
    }),
  ],
  cestas: [
    record("cestas", "1", {
      cliente: "CSA Vila Verde",
      plano: "Família semanal",
      frequencia: "Semanal",
      proxima_entrega: "2026-06-05",
      itens_padrao: "Verduras, legumes, ovos",
      pausa_ate: "",
      status: "Ativa",
    }),
  ],
  expedicao: [
    record("expedicao", "1", {
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
    record("fretes", "1", {
      rota: "Curitiba > São Paulo",
      transportadora: "Frota própria",
      km: "408",
      custo: "3250",
      combustivel: "980",
      pedagio: "210",
      status: "Fechado",
    }),
  ],
};

type TabId = "visao-geral" | (typeof modules)[number]["id"];

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  ...modules.map((m) => ({ id: m.id as TabId, label: m.label, icon: m.icon })),
];

function record(module: string, id: string, payload: Record<string, string>): OperationRecord {
  return {
    id: `demo-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function emptyPayload(m: ModuleConfig) {
  return Object.fromEntries(calculatedCostFields(m.fields).map((f) => [f.key, ""]));
}

const totalCostKeys = ["custo_total", "custo", "valor", "combustivel", "pedagio"];

function numberValue(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculatedCostFields(fields: FieldConfig[]) {
  if (!fields.some((field) => totalCostKeys.includes(field.key))) return fields;
  const next = [...fields];
  const add = (field: FieldConfig) => {
    if (!next.some((item) => item.key === field.key)) next.push(field);
  };
  add({ key: "quantidade", label: "Quantidade", type: "number" });
  add({ key: "unidade_base", label: "Unidade base" });
  add({ key: "custo_total", label: "Custo total", type: "number" });
  add({ key: "custo_unitario", label: "Custo unitario", type: "number" });
  return next;
}

function normalizeCostPayload(payload: Record<string, string>, changedKey?: string) {
  const next = { ...payload };
  if (!Object.keys(next).some((key) => totalCostKeys.includes(key) || key === "custo_unitario")) {
    return next;
  }

  if (changedKey && totalCostKeys.includes(changedKey) && changedKey !== "custo_total") {
    next.custo_total = next[changedKey] ?? "";
  }

  const quantity = numberValue(next.quantidade);
  const totalKey =
    changedKey && totalCostKeys.includes(changedKey)
      ? changedKey
      : next.custo_total
        ? "custo_total"
        : (totalCostKeys.find((key) => next[key]) ?? "custo_total");
  const total = numberValue(next.custo_total || next[totalKey]);
  const unit = numberValue(next.custo_unitario);
  if (quantity <= 0) return next;

  if (changedKey === "custo_unitario" && unit > 0) {
    next.custo_total = String(Math.round(unit * quantity * 10000) / 10000);
  } else if (
    changedKey === "quantidade" ||
    changedKey === "custo_total" ||
    totalCostKeys.includes(changedKey ?? "")
  ) {
    next.custo_unitario = total > 0 ? String(Math.round((total / quantity) * 10000) / 10000) : "";
  }
  return next;
}

function updateCostPayload(current: Record<string, string>, key: string, value: string) {
  return normalizeCostPayload({ ...current, [key]: value }, key);
}

// ── Focos por aba: cada aba ganha KPIs + visual próprios (não só uma tabela). ──
const normStr = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
const countByStatus = (records: OperationRecord[], key: string, term: string) =>
  records.filter((r) => normStr(r.payload[key]).includes(term)).length;
const sumField = (records: OperationRecord[], key: string) =>
  records.reduce((sum, r) => sum + numberValue(r.payload[key]), 0);
function groupCount(records: OperationRecord[], key: string) {
  const map = new Map<string, number>();
  for (const r of records) {
    const k = (r.payload[key] || "—").trim() || "—";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

const moduleFocus: Record<string, (records: OperationRecord[]) => React.ReactNode> = {
  cargas: (records) => {
    const status = cargaStatusBreakdown(records).map((s) => ({ label: s.status, value: s.valor }));
    const breaches = slaBreaches(records, new Date().toISOString().slice(0, 10));
    const atras = countByStatus(records, "status", "atras");
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Total de cargas", value: records.length, icon: Truck },
            {
              label: "Em trânsito",
              value: countByStatus(records, "status", "transito"),
              icon: Truck,
            },
            {
              label: "Entregues",
              value: countByStatus(records, "status", "entregue"),
              icon: CheckCircle2,
            },
            {
              label: "Atrasadas",
              value: atras,
              icon: AlertTriangle,
              trend: atras ? "atenção" : "ok",
              trendDir: atras ? "down" : "up",
            },
            { label: "Valor em rota", value: brl(sumField(records, "valor")), icon: Wallet },
            {
              label: "Peso total",
              value: `${sumField(records, "peso").toLocaleString("pt-BR")} kg`,
              icon: Boxes,
            },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <RichTabPanel title="Cargas por status" description="Distribuição atual da operação">
            {status.length ? (
              <RichBarList items={status} />
            ) : (
              <EmptyState title="Sem cargas cadastradas" />
            )}
          </RichTabPanel>
          <RichTabPanel title="Em risco de SLA" description="Atrasadas ou com ETA vencida">
            {breaches.length ? (
              <div className="space-y-2">
                {breaches.slice(0, 6).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="truncate">
                      <strong>{b.codigo}</strong> · {b.cliente}
                    </span>
                    <span className="shrink-0 rounded bg-destructive/12 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                      {b.motivo}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhuma carga em risco" icon={CheckCircle2} />
            )}
          </RichTabPanel>
        </div>
      </>
    );
  },
  motoristas: (records) => {
    const scores = records.map((r) => numberValue(r.payload.score)).filter((n) => n > 0);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const top = [...records]
      .sort((a, b) => numberValue(b.payload.score) - numberValue(a.payload.score))
      .slice(0, 6)
      .map((r) => ({ label: r.payload.nome || "—", value: numberValue(r.payload.score) }));
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Motoristas", value: records.length, icon: Users },
            {
              label: "Disponíveis",
              value: countByStatus(records, "status", "dispon"),
              icon: CheckCircle2,
            },
            { label: "Em rota", value: countByStatus(records, "status", "rota"), icon: Truck },
            { label: "Em folga", value: countByStatus(records, "status", "folga"), icon: Users },
            { label: "Score médio", value: avg || "—", icon: Gauge },
          ]}
        />
        <RichTabPanel title="Ranking de score" description="Desempenho por motorista">
          {top.length ? (
            <RichBarList items={top} />
          ) : (
            <EmptyState title="Sem motoristas cadastrados" />
          )}
        </RichTabPanel>
      </>
    );
  },
  rotas: (records) => {
    const slas = records.map((r) => numberValue(r.payload.sla)).filter((n) => n > 0);
    const avgSla = slas.length ? Math.round(slas.reduce((a, b) => a + b, 0) / slas.length) : 0;
    const byDist = [...records]
      .sort((a, b) => numberValue(b.payload.distancia) - numberValue(a.payload.distancia))
      .slice(0, 6)
      .map((r) => ({
        label: r.payload.nome || r.payload.origem || "Rota",
        value: numberValue(r.payload.distancia),
      }));
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Rotas", value: records.length, icon: MapPin },
            {
              label: "Distância total",
              value: `${sumField(records, "distancia").toLocaleString("pt-BR")} km`,
              icon: MapPin,
            },
            { label: "SLA médio", value: avgSla ? `${avgSla} h` : "—", icon: Gauge },
          ]}
        />
        <RichTabPanel title="Distância por rota" description="Maiores trajetos">
          {byDist.length ? (
            <RichBarList items={byDist} format={(n) => `${n.toLocaleString("pt-BR")} km`} />
          ) : (
            <EmptyState title="Sem rotas cadastradas" />
          )}
        </RichTabPanel>
      </>
    );
  },
  frota: (records) => {
    const byTipo = groupCount(records, "tipo");
    const manut = countByStatus(records, "status", "manuten");
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Veículos", value: records.length, icon: Truck },
            {
              label: "Disponíveis",
              value: countByStatus(records, "status", "dispon"),
              icon: CheckCircle2,
            },
            { label: "Em rota", value: countByStatus(records, "status", "rota"), icon: Truck },
            {
              label: "Em manutenção",
              value: manut,
              icon: Wrench,
              trend: manut ? "atenção" : "ok",
              trendDir: manut ? "down" : "up",
            },
            {
              label: "Capacidade total",
              value: `${sumField(records, "capacidade").toLocaleString("pt-BR")} kg`,
              icon: Boxes,
            },
          ]}
        />
        <RichTabPanel title="Frota por tipo" description="Composição da frota">
          {byTipo.length ? (
            <RichBarList items={byTipo} />
          ) : (
            <EmptyState title="Sem veículos cadastrados" />
          )}
        </RichTabPanel>
      </>
    );
  },
  fretes: (records) => {
    const custo = records.reduce(
      (s, r) =>
        s +
        numberValue(r.payload.custo) +
        numberValue(r.payload.combustivel) +
        numberValue(r.payload.pedagio),
      0,
    );
    const km = sumField(records, "km");
    const byRoute = freightByRoute(records)
      .slice(0, 6)
      .map((f) => ({ label: f.rota, value: f.custo }));
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Fretes", value: records.length, icon: Wallet },
            { label: "Custo total", value: brl(custo), icon: Wallet },
            { label: "Distância", value: `${km.toLocaleString("pt-BR")} km`, icon: MapPin },
            { label: "Custo por km", value: km > 0 ? brl(custo / km) : "—", icon: Gauge },
          ]}
        />
        <RichTabPanel title="Custo de frete por rota" description="Custo + combustível + pedágio">
          {byRoute.length ? (
            <RichBarList items={byRoute} format={brl} />
          ) : (
            <EmptyState title="Sem fretes cadastrados" />
          )}
        </RichTabPanel>
      </>
    );
  },
  bases: (records) => {
    const byTipo = groupCount(records, "tipo");
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Bases / filiais", value: records.length, icon: Building2 },
            ...byTipo.slice(0, 3).map((t) => ({ label: t.label, value: t.value, icon: Building2 })),
          ]}
        />
        <RichTabPanel title="Bases por tipo" description="Matriz, filiais e CDs">
          {byTipo.length ? (
            <RichBarList items={byTipo} />
          ) : (
            <EmptyState title="Sem bases cadastradas" />
          )}
        </RichTabPanel>
      </>
    );
  },
  roteirizacao: (records) => (
    <RichTabKpis
      kpis={[
        { label: "Roteiros", value: records.length, icon: MapPin },
        { label: "Paradas", value: sumField(records, "paradas"), icon: MapPin },
        {
          label: "Distância",
          value: `${sumField(records, "distancia").toLocaleString("pt-BR")} km`,
          icon: MapPin,
        },
        {
          label: "Concluídos",
          value: countByStatus(records, "status", "conclu"),
          icon: CheckCircle2,
        },
      ]}
    />
  ),
  embalagens: (records) => {
    const abaixo = records.filter(
      (r) => numberValue(r.payload.saldo) < numberValue(r.payload.minimo),
    ).length;
    const items = records.slice(0, 6).map((r) => ({
      label: r.payload.item || r.payload.sku || "Item",
      value: numberValue(r.payload.saldo),
    }));
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Itens", value: records.length, icon: Boxes },
            {
              label: "Abaixo do mínimo",
              value: abaixo,
              icon: AlertTriangle,
              trend: abaixo ? "repor" : "ok",
              trendDir: abaixo ? "down" : "up",
            },
            {
              label: "Saldo total",
              value: sumField(records, "saldo").toLocaleString("pt-BR"),
              icon: Boxes,
            },
          ]}
        />
        <RichTabPanel title="Saldo por item" description="Estoque atual de embalagens">
          {items.length ? (
            <RichBarList items={items} />
          ) : (
            <EmptyState title="Sem itens cadastrados" />
          )}
        </RichTabPanel>
      </>
    );
  },
  cestas: (records) => {
    const byFreq = groupCount(records, "frequencia");
    return (
      <>
        <RichTabKpis
          kpis={[
            { label: "Assinaturas", value: records.length, icon: Package },
            {
              label: "Ativas",
              value: countByStatus(records, "status", "ativ"),
              icon: CheckCircle2,
            },
            {
              label: "Pausadas",
              value: countByStatus(records, "status", "paus"),
              icon: AlertTriangle,
            },
          ]}
        />
        <RichTabPanel title="Assinaturas por frequência" description="CSA recorrente">
          {byFreq.length ? (
            <RichBarList items={byFreq} />
          ) : (
            <EmptyState title="Sem assinaturas cadastradas" />
          )}
        </RichTabPanel>
      </>
    );
  },
  expedicao: (records) => (
    <RichTabKpis
      kpis={[
        { label: "Checklists", value: records.length, icon: ClipboardList },
        {
          label: "Aprovados",
          value: countByStatus(records, "status", "aprov"),
          icon: CheckCircle2,
        },
        {
          label: "Pendentes",
          value: countByStatus(records, "status", "pend"),
          icon: AlertTriangle,
        },
        { label: "Revisar", value: countByStatus(records, "status", "revis"), icon: AlertTriangle },
      ]}
    />
  ),
};

function LogisticaPage() {
  const { demoMode } = useDemoMode();
  const [tab, setTab] = useState<TabId>("visao-geral");
  const [period, setPeriod] = useState<PeriodValue>(defaultPeriod());

  const current = modules.find((m) => m.id === tab);

  return (
    <div className="px-8 py-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logística e Distribuição</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {demoMode
              ? "Modo DEMO ligado: exemplos isolados dos dados reais."
              : "Modo DEMO desligado: exibindo dados reais cadastrados."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodPicker value={period} onChange={setPeriod} />
          <button
            onClick={() => toast.info("Use a exportação dentro de cada aba para baixar os dados.")}
            className="h-10 px-4 rounded-lg border border-border bg-card text-sm flex items-center gap-2 hover:bg-muted"
          >
            <Download className="w-4 h-4" />
            Exportar visão geral
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "min-h-16 rounded-lg border p-3 text-left text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="flex items-start gap-2">
                <t.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="line-clamp-2 leading-snug">{t.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {tab === "visao-geral" && <OverviewTab />}
      {current && <ModuleTab module={current} />}
    </div>
  );
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const statusTone: Record<string, string> = {
  entregue: chartColors.c3,
  transito: chartColors.primary,
  atras: chartColors.c5,
  aguard: chartColors.c4,
};

function toneForStatus(status: string) {
  const norm = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const key = Object.keys(statusTone).find((k) => norm.includes(k));
  return key ? statusTone[key] : chartColors.mutedFg;
}

function OverviewTab() {
  const { snapshot, loading } = useConnectedAgroData();
  const records = useMemo(
    () => snapshot.operations.filter((r) => r.area === "logistica"),
    [snapshot.operations],
  );
  const metrics = useMemo(() => buildLogisticaMetrics(records), [records]);
  const freight = useMemo(() => freightByRoute(records).slice(0, 6), [records]);
  const statusData = useMemo(() => cargaStatusBreakdown(records), [records]);
  const today = new Date().toISOString().slice(0, 10);
  const breaches = useMemo(() => slaBreaches(records, today), [records, today]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatKpi label="Em trânsito" value={metrics.emTransito} icon={Truck} />
        <StatKpi label="Entregues" value={metrics.entregues} icon={CheckCircle2} />
        <StatKpi
          label="OTIF"
          value={`${metrics.otif}%`}
          icon={Gauge}
          trend={metrics.otif >= 90 ? "meta" : "abaixo"}
          trendDir={metrics.otif >= 90 ? "up" : "down"}
        />
        <StatKpi
          label="Atrasadas"
          value={metrics.atrasadas}
          icon={AlertTriangle}
          trend={metrics.atrasadas > 0 ? "atenção" : "ok"}
          trendDir={metrics.atrasadas > 0 ? "down" : "up"}
        />
        <StatKpi label="Custo de frete" value={brl(metrics.custoFreteTotal)} icon={Wallet} />
        <StatKpi
          label="Frota disponível"
          value={`${metrics.frotaDisponivel}/${metrics.frotaTotal}`}
          icon={Wrench}
          hint={`${metrics.capacidadePct}% disponível`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.035)]">
          <h2 className="text-sm font-semibold tracking-tight">Custo de frete por rota</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Custo + combustível + pedágio agregados por rota.
          </p>
          <div className="mt-4 h-64">
            {freight.length === 0 ? (
              <EmptyState
                title="Sem fretes cadastrados"
                description="Cadastre fretes na aba correspondente para ver o custo por rota."
              />
            ) : (
              <ResponsiveContainer>
                <BarChart data={freight} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke={chartColors.border} />
                  <XAxis
                    type="number"
                    stroke={chartColors.mutedFg}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => brl(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="rota"
                    width={120}
                    stroke={chartColors.mutedFg}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    formatter={(v: number) => brl(v)}
                  />
                  <Bar dataKey="custo" fill={chartColors.primary} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.035)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Alertas de SLA</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cargas atrasadas ou com ETA vencida e não entregue.
              </p>
            </div>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-semibold",
                breaches.length
                  ? "bg-destructive/12 text-destructive"
                  : "bg-success/12 text-success",
              )}
            >
              {breaches.length}
            </span>
          </div>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {breaches.length === 0 ? (
              <EmptyState title="Nenhuma carga em risco de SLA" icon={CheckCircle2} />
            ) : (
              breaches.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{b.codigo}</div>
                    <div className="truncate text-xs text-muted-foreground">{b.cliente}</div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-xs text-muted-foreground">ETA {b.eta}</span>
                    <span className="rounded bg-destructive/12 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                      {b.motivo}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {statusData.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Status das cargas
              </div>
              <div className="flex flex-wrap gap-2">
                {statusData.map((s) => (
                  <span
                    key={s.status}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: toneForStatus(s.status) }}
                    />
                    {s.status}
                    <span className="font-semibold tabular-nums">{s.valor}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <TrackingMap
        title="Mapa Operacional"
        subtitle="Visualização ao vivo de cargas, motoristas e bases cadastradas."
        height="h-[480px]"
      />

      {loading && records.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">Sincronizando dados...</p>
      )}
    </div>
  );
}

function TrackingMap({ title, subtitle }: { title?: string; subtitle?: string; height?: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {title ?? "Mapa operacional unico"}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {subtitle ?? "Os dados de logistica aparecem no mapa principal da plataforma."}
          </p>
        </div>
        <a
          href="/torre-de-controle"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <MapPin className="h-4 w-4" />
          Abrir mapa
        </a>
      </div>
    </section>
  );
}

function ModuleTab({ module }: { module: ModuleConfig }) {
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OperationRecord | null>(null);
  const [payload, setPayload] = useState<Record<string, string>>(emptyPayload(module));
  const fields = useMemo(() => calculatedCostFields(module.fields), [module.fields]);
  const columns = useMemo<DataTableColumn<OperationRecord>[]>(
    () =>
      fields.slice(0, 6).map((f) => ({
        key: f.key,
        header: f.label,
        accessor: (rec) => rec.payload[f.key] ?? "",
        render: (rec) => rec.payload[f.key] || "-",
        align: f.type === "number" ? ("right" as const) : ("left" as const),
      })),
    [fields],
  );

  const query = useQuery({
    queryKey: ["operation-records", AREA, module.id],
    queryFn: () => listOperationRecordsByAreaModule(AREA, module.id),
    enabled: !demoMode,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const records = useMemo<OperationRecord[]>(
    () => (demoMode ? (demoByModule[module.id] ?? []) : (query.data ?? [])),
    [demoMode, module.id, query.data],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["operation-records", AREA, module.id] });
    void queryClient.invalidateQueries({ queryKey: ["operation-records", AREA, "all"] });
    invalidateConnectedQueries(queryClient);
  };

  const createMutation = useMutation({
    mutationFn: createOperationRecord,
    onSuccess: () => {
      toast.success("Registro adicionado.");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = useMutation({
    mutationFn: updateOperationRecord,
    onSuccess: () => {
      toast.success("Registro atualizado.");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteOperationRecord,
    onSuccess: () => {
      toast.success("Registro excluído.");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const beginCreate = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para cadastrar dados reais.");
    setEditing(null);
    setPayload(emptyPayload(module));
    setOpen(true);
  };
  const beginEdit = (rec: OperationRecord) => {
    if (demoMode) return toast.info("Dados demo não podem ser editados.");
    setEditing(rec);
    setPayload({ ...emptyPayload(module), ...rec.payload });
    setOpen(true);
  };
  const submit = () => {
    if (demoMode) return;
    if (editing) updateMutation.mutate({ id: editing.id, payload: normalizeCostPayload(payload) });
    else
      createMutation.mutate({
        area: AREA,
        module: module.id,
        payload: normalizeCostPayload(payload),
      });
  };

  const importRows = async (rows: Record<string, string>[]) => {
    if (demoMode) return toast.info("Desligue o modo DEMO para importar dados reais.");
    for (const row of rows) {
      await createOperationRecord({
        area: AREA,
        module: module.id,
        payload: normalizeCostPayload(row),
      });
    }
    invalidate();
  };

  const handleExport = () => {
    if (records.length === 0) {
      toast.info("Nenhum registro para exportar.");
      return;
    }
    const header = fields.map((f) => f.label);
    const lines = records.map((r) => fields.map((f) => r.payload[f.key] ?? ""));
    const csv = [header, ...lines]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agrotorre-${module.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loading = !demoMode && query.isLoading;
  const focus = moduleFocus[module.id];

  return (
    <div className="space-y-5">
      {focus && focus(records)}
      <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <module.icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">{module.label}</h3>
              <p className="text-xs text-muted-foreground">{module.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ImportRecordsButton fields={fields} disabled={demoMode} onImport={importRows} />
            <button
              onClick={handleExport}
              className="h-9 rounded-lg border border-border px-3 text-sm flex items-center gap-2 hover:bg-muted"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar
            </button>
            <button
              onClick={beginCreate}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={records}
          getRowId={(rec) => rec.id}
          loading={loading}
          searchPlaceholder={`Buscar em ${module.label}...`}
          emptyMessage={
            demoMode
              ? "Sem exemplos demo neste módulo."
              : "Nenhum registro real cadastrado neste módulo."
          }
          actions={(rec) => (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => beginEdit(rec)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                aria-label="Editar"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (demoMode) return toast.info("Dados demo não podem ser excluídos.");
                  if (window.confirm("Excluir este registro?")) deleteMutation.mutate(rec.id);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted"
                aria-label="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar registro" : "Adicionar registro"}</DialogTitle>
              <DialogDescription>{module.label}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <label key={f.key} className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">
                    {f.label}
                    {f.hint && <span className="ml-1 text-[10px] opacity-70">({f.hint})</span>}
                  </span>
                  {f.type === "textarea" ? (
                    <textarea
                      value={payload[f.key] ?? ""}
                      onChange={(e) =>
                        setPayload((cur) => updateCostPayload(cur, f.key, e.target.value))
                      }
                      className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  ) : (
                    <input
                      type={f.type ?? "text"}
                      step={f.type === "number" ? "any" : undefined}
                      value={payload[f.key] ?? ""}
                      onChange={(e) =>
                        setPayload((cur) => updateCostPayload(cur, f.key, e.target.value))
                      }
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  )}
                </label>
              ))}
            </div>
            <DialogFooter>
              <button
                onClick={() => setOpen(false)}
                className="h-9 rounded-lg border border-border px-3 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                Salvar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
