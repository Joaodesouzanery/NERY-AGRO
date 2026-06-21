import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as useQueries, c as useQueryClient, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { k as listFinancialRecords, e as createFinancialRecord, j as invalidateConnectedQueries, n as updateFinancialRecord, h as deleteFinancialRecord } from "./connected-agro-data-B5gpgC4B.mjs";
import { u as useDemoMode, c as cn } from "./router-D1uahgUG.mjs";
import { I as ImportRecordsButton, D as Dialog, a as DialogContent, d as DialogHeader, e as DialogTitle, b as DialogDescription, c as DialogFooter } from "./import-records-button-BiVLSQbM.mjs";
import { d as defaultPeriod, P as PeriodPicker } from "./period-picker-BtQVPyDA.mjs";
import { t as Download, B as Banknote, C as Calculator, ad as TriangleAlert, f as Boxes, a0 as Scale, a4 as ShoppingCart, L as Landmark, a8 as Tags, Q as MapPin, r as ClipboardList, a5 as Sprout, w as FileText, v as FilePenLine, K as LayoutDashboard, X as Plus, W as PenLine, aa as Trash2, e as BellRing, q as CircleCheck, i as CalendarDays } from "../_libs/lucide-react.mjs";
import { e as ResponsiveContainer, b as BarChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, B as Bar } from "../_libs/recharts.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/tanstack__query-core.mjs";
import "./client-BHmQHd0X.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-switch.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/read-excel-file.mjs";
import "../_libs/fflate.mjs";
import "module";
import "../_libs/radix-ui__react-popover.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/lodash.mjs";
import "../_libs/react-smooth.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/react-is.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/recharts-scale.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
const financialModules = [
  {
    id: "fluxo",
    label: "Fluxo de Caixa Simples",
    shortLabel: "Fluxo",
    description: "Registro de entradas e saídas adaptado ao produtor.",
    icon: Banknote,
    fields: [
      { key: "descricao", label: "Descrição" },
      { key: "tipo", label: "Tipo" },
      { key: "categoria", label: "Categoria" },
      { key: "valor", label: "Valor", type: "number" },
      { key: "data", label: "Data", type: "date" }
    ]
  },
  {
    id: "custos",
    label: "Custos por Unidade",
    shortLabel: "Custos",
    description: "Cálculo automático do custo de produção por dúzia, saca ou kg.",
    icon: Calculator,
    fields: [
      { key: "produto", label: "Produto" },
      { key: "unidade", label: "Unidade" },
      { key: "custo_total", label: "Custo total", type: "number" },
      { key: "quantidade", label: "Quantidade", type: "number" },
      { key: "preco_venda", label: "Preço venda", type: "number" }
    ]
  },
  {
    id: "inadimplencia",
    label: "Controle de Inadimplência",
    shortLabel: "Inadimplência",
    description: "Alertas de pagamentos pendentes de clientes.",
    icon: TriangleAlert,
    fields: [
      { key: "cliente", label: "Cliente" },
      { key: "valor", label: "Valor", type: "number" },
      { key: "vencimento", label: "Vencimento", type: "date" },
      { key: "status", label: "Status" },
      { key: "alerta_dias", label: "Alerta dias", type: "number" },
      { key: "etapa_regua", label: "Etapa da régua" },
      { key: "canal", label: "Canal" }
    ]
  },
  {
    id: "estoque",
    label: "Gestão de Estoque de Produtos Acabados",
    shortLabel: "Estoque",
    description: "Produtos prontos para venda imediata, reservas e validade.",
    icon: Boxes,
    fields: [
      { key: "produto", label: "Produto" },
      { key: "saldo", label: "Saldo", type: "number" },
      { key: "reservado", label: "Reservado", type: "number" },
      { key: "validade", label: "Validade", type: "date" },
      { key: "status", label: "Status" }
    ]
  },
  {
    id: "equilibrio",
    label: "Cálculo de Ponto de Equilíbrio",
    shortLabel: "Equilíbrio",
    description: "Quanto vender para cobrir os custos.",
    icon: Scale,
    fields: [
      { key: "produto", label: "Produto" },
      { key: "preco_venda", label: "Preço venda", type: "number" },
      { key: "custo_variavel", label: "Custo variável", type: "number" },
      { key: "custo_fixo", label: "Custo fixo", type: "number" }
    ]
  },
  {
    id: "compras",
    label: "Gestão de Compras",
    shortLabel: "Compras",
    description: "Lista baseada na necessidade de insumos.",
    icon: ShoppingCart,
    fields: [
      { key: "insumo", label: "Insumo" },
      { key: "estoque_atual", label: "Estoque atual", type: "number" },
      { key: "estoque_minimo", label: "Estoque mínimo", type: "number" },
      { key: "consumo_semanal", label: "Consumo semanal", type: "number" },
      { key: "fornecedor", label: "Fornecedor" }
    ]
  },
  {
    id: "credito",
    label: "Controle de Crédito Rural",
    shortLabel: "Crédito",
    description: "Acompanhamento de parcelas de financiamentos.",
    icon: Landmark,
    fields: [
      { key: "contrato", label: "Contrato" },
      { key: "banco", label: "Banco" },
      { key: "saldo_devedor", label: "Saldo devedor", type: "number" },
      { key: "parcela", label: "Parcela", type: "number" },
      { key: "vencimento", label: "Vencimento", type: "date" }
    ]
  },
  {
    id: "precos",
    label: "Tabela de Preços Dinâmica",
    shortLabel: "Preços",
    description: "Preços para atacado, varejo e assinaturas.",
    icon: Tags,
    fields: [
      { key: "produto", label: "Produto" },
      { key: "varejo", label: "Varejo", type: "number" },
      { key: "atacado", label: "Atacado", type: "number" },
      { key: "assinatura", label: "Assinatura", type: "number" },
      { key: "promocao", label: "Promoção" }
    ]
  },
  {
    id: "hectare",
    label: "Custo por Hectare",
    shortLabel: "Hectare",
    description: "Real x planejado por talhão e por safra.",
    icon: MapPin,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "safra", label: "Safra" },
      { key: "real", label: "Real", type: "number" },
      { key: "planejado", label: "Planejado", type: "number" }
    ]
  },
  {
    id: "safra",
    label: "Orçamento de Safra",
    shortLabel: "Safra",
    description: "Insumos, mão de obra, maquinário e curva de desembolso.",
    icon: ClipboardList,
    fields: [
      { key: "etapa", label: "Etapa" },
      { key: "categoria", label: "Categoria" },
      { key: "valor", label: "Valor", type: "number" },
      { key: "status", label: "Status" }
    ]
  },
  {
    id: "roi",
    label: "Rentabilidade Field-by-Field",
    shortLabel: "ROI",
    description: "ROI por talhão, híbrido e variedade.",
    icon: Sprout,
    fields: [
      { key: "talhao", label: "Talhão" },
      { key: "hibrido", label: "Híbrido" },
      { key: "receita", label: "Receita", type: "number" },
      { key: "custo", label: "Custo", type: "number" }
    ]
  },
  {
    id: "arrendamento",
    label: "Controle de Arrendamento",
    shortLabel: "Arrendamento",
    description: "Custo por área, vencimentos e histórico de reajustes.",
    icon: FileText,
    fields: [
      { key: "contrato", label: "Contrato" },
      { key: "area", label: "Área ha", type: "number" },
      { key: "valor_ha", label: "R$/ha", type: "number" },
      { key: "vencimento", label: "Vencimento", type: "date" }
    ]
  },
  {
    id: "contratos",
    label: "Gestão de Contratos",
    shortLabel: "Contratos",
    description: "Compra de insumos, venda de grãos e fixações.",
    icon: FilePenLine,
    fields: [
      { key: "contrato", label: "Contrato" },
      { key: "tipo", label: "Tipo" },
      { key: "quantidade", label: "Quantidade", type: "number" },
      { key: "status", label: "Status" }
    ]
  }
];
const demoRecords = {
  fluxo: [
    record("fluxo", "1", {
      descricao: "Venda de ovos caipira",
      tipo: "entrada",
      categoria: "Vendas",
      valor: "18400",
      data: "2026-05-22"
    }),
    record("fluxo", "2", {
      descricao: "Ração poedeiras",
      tipo: "saída",
      categoria: "Insumos",
      valor: "5200",
      data: "2026-05-21"
    }),
    record("fluxo", "3", {
      descricao: "Assinaturas de cestas",
      tipo: "entrada",
      categoria: "CSA",
      valor: "9700",
      data: "2026-05-19"
    })
  ],
  custos: [
    record("custos", "1", {
      produto: "Ovos caipira",
      unidade: "dúzia",
      custo_total: "4820",
      quantidade: "1000",
      preco_venda: "9.90"
    }),
    record("custos", "2", {
      produto: "Mel",
      unidade: "kg",
      custo_total: "3100",
      quantidade: "220",
      preco_venda: "32"
    })
  ],
  inadimplencia: [
    record("inadimplencia", "1", {
      cliente: "Mercado Central",
      valor: "3200",
      vencimento: "2026-05-20",
      status: "pendente",
      alerta_dias: "3",
      etapa_regua: "D+7",
      canal: "WhatsApp"
    }),
    record("inadimplencia", "2", {
      cliente: "Restaurante Aurora",
      valor: "5800",
      vencimento: "2026-06-02",
      status: "a vencer",
      alerta_dias: "5",
      etapa_regua: "D-3",
      canal: "E-mail"
    })
  ],
  estoque: [
    record("estoque", "1", {
      produto: "Ovos caipira",
      saldo: "1240",
      reservado: "320",
      validade: "2026-06-08",
      status: "pronto"
    }),
    record("estoque", "2", {
      produto: "Mel silvestre",
      saldo: "180",
      reservado: "45",
      validade: "2027-01-10",
      status: "pronto"
    })
  ],
  equilibrio: [
    record("equilibrio", "1", {
      produto: "Ovos caipira",
      preco_venda: "9.90",
      custo_variavel: "4.82",
      custo_fixo: "1200"
    })
  ],
  compras: [
    record("compras", "1", {
      insumo: "Racao inicial",
      estoque_atual: "420",
      estoque_minimo: "800",
      consumo_semanal: "210",
      fornecedor: "Agro Sul"
    }),
    record("compras", "2", {
      insumo: "Caixas kraft",
      estoque_atual: "180",
      estoque_minimo: "300",
      consumo_semanal: "90",
      fornecedor: "Embalagens Norte"
    })
  ],
  credito: [
    record("credito", "1", {
      contrato: "Custeio 2026",
      banco: "Banco do Brasil",
      saldo_devedor: "320000",
      parcela: "28400",
      vencimento: "2026-06-15"
    })
  ],
  precos: [
    record("precos", "1", {
      produto: "Ovos caipira",
      varejo: "9.90",
      atacado: "8.40",
      assinatura: "7.80",
      promocao: "Combo semanal"
    })
  ],
  hectare: [
    record("hectare", "1", {
      talhao: "Talhão A",
      safra: "2025/26",
      real: "3420",
      planejado: "3200"
    })
  ],
  safra: [
    record("safra", "1", {
      etapa: "Plantio",
      categoria: "Insumos",
      valor: "48000",
      status: "aprovado"
    })
  ],
  roi: [
    record("roi", "1", {
      talhao: "Talhão B",
      hibrido: "Pioneer P3380",
      receita: "412000",
      custo: "280000"
    })
  ],
  arrendamento: [
    record("arrendamento", "1", {
      contrato: "Fazenda Vale Verde",
      area: "120",
      valor_ha: "1850",
      vencimento: "2026-09-30"
    })
  ],
  contratos: [
    record("contratos", "1", {
      contrato: "Venda soja - Cargill",
      tipo: "Venda",
      quantidade: "5000",
      status: "Em aberto"
    })
  ]
};
function record(module, id, payload) {
  return { id: `${module}-demo-${id}`, module, payload };
}
function num(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
function isExpenseType(value) {
  const normalized = String(value ?? "").toLowerCase().normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "");
  return normalized.includes("saida");
}
function dateValue(value) {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? void 0 : date;
}
function formatMoney(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatValue(value, field) {
  if (!value) return "-";
  if (field?.type === "number") return num(value).toLocaleString("pt-BR");
  return value;
}
function emptyPayload(module) {
  return Object.fromEntries(calculatedCostFields(module.fields).map((field) => [field.key, ""]));
}
const totalCostKeys = [
  "custo_total",
  "custo",
  "valor",
  "receita",
  "saldo_devedor",
  "parcela",
  "real",
  "planejado",
  "valor_ha"
];
function hasCostSurface(fields) {
  return fields.some((field) => totalCostKeys.includes(field.key));
}
function calculatedCostFields(fields) {
  if (!hasCostSurface(fields)) return fields;
  const next = [...fields];
  const add = (field) => {
    if (!next.some((item) => item.key === field.key)) next.push(field);
  };
  add({ key: "quantidade", label: "Quantidade", type: "number" });
  add({ key: "unidade_base", label: "Unidade base" });
  add({ key: "custo_total", label: "Custo total", type: "number" });
  add({ key: "custo_unitario", label: "Custo unitario", type: "number" });
  return next;
}
function primaryTotalKey(payload, changedKey) {
  if (changedKey && totalCostKeys.includes(changedKey)) return changedKey;
  if (payload.custo_total) return "custo_total";
  return totalCostKeys.find((key) => payload[key]) ?? "custo_total";
}
function roundCost(value) {
  return Number.isFinite(value) ? String(Math.round(value * 1e4) / 1e4) : "";
}
function normalizeCostPayload(payload, changedKey) {
  const next = { ...payload };
  if (!Object.keys(next).some((key) => totalCostKeys.includes(key) || key === "custo_unitario")) {
    return next;
  }
  const quantity = num(next.quantidade);
  const totalKey = primaryTotalKey(next, changedKey);
  if (changedKey && totalCostKeys.includes(changedKey) && changedKey !== "custo_total") {
    next.custo_total = next[changedKey] ?? "";
  }
  const total = num(next.custo_total || next[totalKey]);
  const unit = num(next.custo_unitario);
  if (quantity <= 0) return next;
  if (changedKey === "custo_unitario" && unit > 0) {
    next.custo_total = roundCost(unit * quantity);
    return next;
  }
  if ((changedKey === "quantidade" || changedKey === "custo_total" || totalCostKeys.includes(changedKey ?? "")) && total > 0) {
    next.custo_unitario = roundCost(total / quantity);
  }
  return next;
}
function updateCostPayload(current, key, value) {
  return normalizeCostPayload({ ...current, [key]: value }, key);
}
function moduleSummary(moduleId, records) {
  switch (moduleId) {
    case "fluxo": {
      const entradas = records.filter((r) => String(r.payload.tipo).toLowerCase().includes("entrada")).reduce((sum, r) => sum + num(r.payload.valor), 0);
      const saidas = records.filter((r) => isExpenseType(r.payload.tipo)).reduce((sum, r) => sum + num(r.payload.valor), 0);
      return {
        headline: formatMoney(entradas - saidas),
        caption: `${formatMoney(entradas)} entradas - ${formatMoney(saidas)} saídas`,
        tone: entradas >= saidas ? "success" : "danger"
      };
    }
    case "custos": {
      const first = records[0]?.payload;
      const unitCost = first ? num(first.custo_total) / Math.max(num(first.quantidade), 1) : 0;
      return {
        headline: formatMoney(unitCost),
        caption: first ? `Custo por ${first.unidade || "unidade"}` : "Sem custo calculado",
        tone: "info"
      };
    }
    case "inadimplencia": {
      const today = /* @__PURE__ */ new Date();
      const overdue = records.filter((r) => {
        const due = dateValue(r.payload.vencimento);
        return due ? due < today && !String(r.payload.status).toLowerCase().includes("pago") : false;
      });
      return {
        headline: formatMoney(overdue.reduce((sum, r) => sum + num(r.payload.valor), 0)),
        caption: `${overdue.length} pagamentos vencidos`,
        tone: overdue.length ? "danger" : "success"
      };
    }
    case "estoque": {
      const available = records.reduce(
        (sum, r) => sum + Math.max(num(r.payload.saldo) - num(r.payload.reservado), 0),
        0
      );
      return {
        headline: available.toLocaleString("pt-BR"),
        caption: "unidades disponiveis",
        tone: "success"
      };
    }
    case "equilibrio": {
      const first = records[0]?.payload;
      const margin = first ? num(first.preco_venda) - num(first.custo_variavel) : 0;
      const point = margin > 0 && first ? Math.ceil(num(first.custo_fixo) / margin) : 0;
      return {
        headline: point.toLocaleString("pt-BR"),
        caption: "unidades para equilibrio",
        tone: point ? "warning" : "info"
      };
    }
    case "compras": {
      const urgent = records.filter(
        (r) => num(r.payload.estoque_atual) < num(r.payload.estoque_minimo)
      );
      return {
        headline: String(urgent.length),
        caption: "insumos para comprar",
        tone: urgent.length ? "warning" : "success"
      };
    }
    case "credito": {
      const due = records.reduce((sum, r) => sum + num(r.payload.parcela), 0);
      return { headline: formatMoney(due), caption: "proximas parcelas", tone: "warning" };
    }
    case "precos": {
      const avg = records.length ? records.reduce((sum, r) => sum + num(r.payload.varejo), 0) / records.length : 0;
      return { headline: formatMoney(avg), caption: "preço médio varejo", tone: "info" };
    }
    default:
      return {
        headline: String(records.length),
        caption: "registros cadastrados",
        tone: "default"
      };
  }
}
function buildDashboard(recordsByModule) {
  const fluxo = recordsByModule.fluxo ?? [];
  const estoque = recordsByModule.estoque ?? [];
  const compras = recordsByModule.compras ?? [];
  const inadimplencia = recordsByModule.inadimplencia ?? [];
  const credito = recordsByModule.credito ?? [];
  const entradas = fluxo.filter((r) => String(r.payload.tipo).toLowerCase().includes("entrada")).reduce((sum, r) => sum + num(r.payload.valor), 0);
  const saidas = fluxo.filter((r) => isExpenseType(r.payload.tipo)).reduce((sum, r) => sum + num(r.payload.valor), 0);
  const estoquePronto = estoque.reduce(
    (sum, r) => sum + Math.max(num(r.payload.saldo) - num(r.payload.reservado), 0),
    0
  );
  const comprasPendentes = compras.filter(
    (r) => num(r.payload.estoque_atual) < num(r.payload.estoque_minimo)
  ).length;
  const vencidos = inadimplencia.filter((r) => {
    const due = dateValue(r.payload.vencimento);
    return due ? due < /* @__PURE__ */ new Date() && !String(r.payload.status).toLowerCase().includes("pago") : false;
  });
  const parcelas = credito.reduce((sum, r) => sum + num(r.payload.parcela), 0);
  return {
    entradas,
    saidas,
    saldo: entradas - saidas,
    estoquePronto,
    comprasPendentes,
    inadimplencia: vencidos.reduce((sum, r) => sum + num(r.payload.valor), 0),
    parcelas,
    chart: [
      { label: "Entradas", valor: entradas },
      { label: "Saídas", valor: saidas },
      { label: "Inadimpl.", valor: vencidos.reduce((sum, r) => sum + num(r.payload.valor), 0) },
      { label: "Parcelas", valor: parcelas }
    ]
  };
}
function FinancialAgroCrud() {
  const { demoMode } = useDemoMode();
  const [activeTab, setActiveTab] = reactExports.useState("visao-geral");
  const queryResults = useQueries({
    queries: financialModules.map((module) => ({
      queryKey: ["financial-records", module.id],
      queryFn: () => listFinancialRecords(module.id),
      enabled: !demoMode
    }))
  });
  const recordsByModule = reactExports.useMemo(() => {
    if (demoMode) return demoRecords;
    return Object.fromEntries(
      financialModules.map((module, index) => [module.id, queryResults[index].data ?? []])
    );
  }, [demoMode, queryResults]);
  const dashboard = reactExports.useMemo(() => buildDashboard(recordsByModule), [recordsByModule]);
  const loading = queryResults.some((query) => query.isLoading);
  const tabs = reactExports.useMemo(
    () => [
      { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
      ...financialModules.map((m) => ({ id: m.id, label: m.shortLabel, icon: m.icon }))
    ],
    []
  );
  const activeModule = financialModules.find((m) => m.id === activeTab);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    !demoMode && false,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-7", children: tabs.map((t) => {
      const active = activeTab === t.id;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setActiveTab(t.id),
          className: cn(
            "min-h-16 rounded-xl border p-3 text-left text-sm font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
            active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          ),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(t.icon, { className: "h-4 w-4 shrink-0 text-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: t.label })
          ] })
        },
        t.id
      );
    }) }),
    activeTab === "visao-geral" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FinancialDashboard, { dashboard, demoMode, loading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7", children: financialModules.map((module) => {
        const summary = moduleSummary(module.id, recordsByModule[module.id] ?? []);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setActiveTab(module.id),
            className: "rounded-xl border border-border bg-card p-3 text-sm text-left hover:bg-muted/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-medium", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(module.icon, { className: "h-4 w-4 text-primary" }),
                module.shortLabel
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-lg font-semibold", children: summary.headline }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: summary.caption })
            ]
          },
          module.id
        );
      }) })
    ] }),
    activeModule && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ModuleSection,
      {
        module: activeModule,
        demoMode,
        records: recordsByModule[activeModule.id] ?? [],
        costRecords: recordsByModule.custos ?? []
      },
      activeModule.id
    )
  ] });
}
function FinancialDashboard({
  dashboard,
  demoMode,
  loading
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold tracking-tight", children: "Visão Geral Financeira" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: demoMode ? "Resumo demonstrativo do financeiro agro." : "Resumo dos dados reais cadastrados." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-md border border-border px-2 py-1 text-xs text-muted-foreground", children: loading ? "Carregando" : demoMode ? "DEMO" : "REAL" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-3 xl:grid-cols-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DashKpi,
        {
          label: "Saldo",
          value: formatMoney(dashboard.saldo),
          tone: dashboard.saldo >= 0 ? "success" : "danger"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DashKpi, { label: "Entradas", value: formatMoney(dashboard.entradas), tone: "success" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DashKpi, { label: "Saídas", value: formatMoney(dashboard.saidas), tone: "danger" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DashKpi,
        {
          label: "Inadimplência",
          value: formatMoney(dashboard.inadimplencia),
          tone: dashboard.inadimplencia ? "warning" : "success"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DashKpi,
        {
          label: "Estoque pronto",
          value: dashboard.estoquePronto.toLocaleString("pt-BR"),
          tone: "info"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DashKpi,
        {
          label: "Compras pend.",
          value: String(dashboard.comprasPendentes),
          tone: dashboard.comprasPendentes ? "warning" : "success"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: dashboard.chart, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)", vertical: false }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        XAxis,
        {
          dataKey: "label",
          stroke: "var(--color-muted-foreground)",
          fontSize: 11,
          tickLine: false,
          axisLine: false
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        YAxis,
        {
          stroke: "var(--color-muted-foreground)",
          fontSize: 11,
          tickLine: false,
          axisLine: false
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Tooltip,
        {
          contentStyle: {
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12
          }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "valor", fill: "var(--color-primary)", radius: [5, 5, 0, 0] })
    ] }) }) })
  ] });
}
function DashKpi({
  label,
  value,
  tone
}) {
  const classes = {
    success: "text-success",
    danger: "text-destructive",
    warning: "text-warning-foreground",
    info: "text-primary"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-1 text-lg font-semibold", classes[tone]), children: value })
  ] });
}
function ModuleSection({
  module,
  demoMode,
  records,
  costRecords
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [payload, setPayload] = reactExports.useState(emptyPayload(module));
  const costsModule = financialModules.find((item) => item.id === "custos");
  const [costOpen, setCostOpen] = reactExports.useState(false);
  const [editingCost, setEditingCost] = reactExports.useState(null);
  const [costPayload, setCostPayload] = reactExports.useState(emptyPayload(costsModule));
  const summary = moduleSummary(module.id, records);
  const fields = reactExports.useMemo(() => calculatedCostFields(module.fields), [module.fields]);
  const costFields = reactExports.useMemo(() => calculatedCostFields(costsModule.fields), [costsModule.fields]);
  const createMutation = useMutation({
    mutationFn: createFinancialRecord,
    onSuccess: () => {
      toast.success("Registro adicionado.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["financial-records", module.id] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message)
  });
  const updateMutation = useMutation({
    mutationFn: updateFinancialRecord,
    onSuccess: () => {
      toast.success("Registro atualizado.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["financial-records", module.id] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message)
  });
  const deleteMutation = useMutation({
    mutationFn: deleteFinancialRecord,
    onSuccess: () => {
      toast.success("Registro excluido.");
      void queryClient.invalidateQueries({ queryKey: ["financial-records", module.id] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message)
  });
  const createCostMutation = useMutation({
    mutationFn: createFinancialRecord,
    onSuccess: () => {
      toast.success("Custo por unidade adicionado.");
      setCostOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["financial-records", "custos"] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message)
  });
  const updateCostMutation = useMutation({
    mutationFn: updateFinancialRecord,
    onSuccess: () => {
      toast.success("Custo por unidade atualizado.");
      setCostOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["financial-records", "custos"] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message)
  });
  const deleteCostMutation = useMutation({
    mutationFn: deleteFinancialRecord,
    onSuccess: () => {
      toast.success("Custo por unidade excluido.");
      void queryClient.invalidateQueries({ queryKey: ["financial-records", "custos"] });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message)
  });
  const beginCreate = () => {
    if (demoMode) {
      toast.info("Desligue o modo DEMO para cadastrar dados reais.");
      return;
    }
    setEditing(null);
    setPayload(emptyPayload(module));
    setOpen(true);
  };
  const beginEdit = (recordToEdit) => {
    if (demoMode) {
      toast.info("Dados demo não podem ser editados.");
      return;
    }
    setEditing(recordToEdit);
    setPayload({ ...emptyPayload(module), ...recordToEdit.payload });
    setOpen(true);
  };
  const beginCostCreate = () => {
    if (demoMode) {
      toast.info("Desligue o modo DEMO para cadastrar dados reais.");
      return;
    }
    setEditingCost(null);
    setCostPayload(emptyPayload(costsModule));
    setCostOpen(true);
  };
  const beginCostEdit = (recordToEdit) => {
    if (demoMode) {
      toast.info("Dados demo não podem ser editados.");
      return;
    }
    setEditingCost(recordToEdit);
    setCostPayload({ ...emptyPayload(costsModule), ...recordToEdit.payload });
    setCostOpen(true);
  };
  const submit = () => {
    if (demoMode) return;
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: normalizeCostPayload(payload) });
      return;
    }
    createMutation.mutate({ module: module.id, payload: normalizeCostPayload(payload) });
  };
  const submitCost = () => {
    if (demoMode) return;
    if (editingCost) {
      updateCostMutation.mutate({ id: editingCost.id, payload: normalizeCostPayload(costPayload) });
      return;
    }
    createCostMutation.mutate({ module: "custos", payload: normalizeCostPayload(costPayload) });
  };
  const importRows = async (rows) => {
    if (demoMode) return toast.info("Desligue o modo DEMO para importar dados reais.");
    for (const row of rows) {
      await createFinancialRecord({ module: module.id, payload: normalizeCostPayload(row) });
    }
    void queryClient.invalidateQueries({ queryKey: ["financial-records", module.id] });
    invalidateConnectedQueries(queryClient);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: module.id, className: "scroll-mt-20 rounded-lg border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(module.icon, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: module.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: module.description })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ImportRecordsButton, { fields, disabled: demoMode, onImport: importRows }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: beginCreate,
            className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
              "Adicionar"
            ] })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 grid gap-3 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Resumo calculado" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-semibold", children: summary.headline }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: summary.caption })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Registros" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-semibold", children: records.length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: demoMode ? "Somente leitura" : "Editavel" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Motor de regra" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-semibold", children: "Ativo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "cálculo automático por módulo" })
      ] })
    ] }),
    module.id === "fluxo" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      CashflowWorkspace,
      {
        records,
        costRecords: costRecords ?? [],
        demoMode,
        onAddEntry: beginCreate,
        onAddCost: beginCostCreate,
        onEditCost: beginCostEdit,
        onDeleteCost: (id) => {
          if (demoMode) {
            toast.info("Dados demo não podem ser excluídos.");
            return;
          }
          if (window.confirm("Excluir este custo por unidade?")) deleteCostMutation.mutate(id);
        }
      }
    ),
    module.id === "inadimplencia" && /* @__PURE__ */ jsxRuntimeExports.jsx(DefaultingWorkspace, { records, demoMode, onAdd: beginCreate }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border text-left text-xs text-muted-foreground", children: [
        fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-4 font-medium", children: field.label }, field.key)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right font-medium", children: "Ações" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
        records.map((recordItem) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border last:border-0", children: [
          fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-4", children: formatValue(recordItem.payload[field.key], field) }, field.key)),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => beginEdit(recordItem),
                className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted",
                "aria-label": "Editar",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-3.5 w-3.5" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  if (demoMode) {
                    toast.info("Dados demo não podem ser excluídos.");
                    return;
                  }
                  if (window.confirm("Excluir este registro?")) {
                    deleteMutation.mutate(recordItem.id);
                  }
                },
                className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted",
                "aria-label": "Excluir",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
              }
            )
          ] }) })
        ] }, recordItem.id)),
        records.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "td",
          {
            colSpan: fields.length + 1,
            className: "py-10 text-center text-sm text-muted-foreground",
            children: "Nenhum registro real cadastrado neste módulo."
          }
        ) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editing ? "Editar registro" : "Adicionar registro" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: module.label })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "grid gap-1.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: field.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: field.type ?? "text",
            value: payload[field.key] ?? "",
            onChange: (event) => setPayload(
              (current) => updateCostPayload(current, field.key, event.target.value)
            ),
            className: "h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          }
        )
      ] }, field.key)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setOpen(false),
            className: "h-9 rounded-lg border border-border px-3 text-sm",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: submit,
            disabled: createMutation.isPending || updateMutation.isPending,
            className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60",
            children: "Salvar"
          }
        )
      ] })
    ] }) }),
    module.id === "fluxo" && /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: costOpen, onOpenChange: setCostOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editingCost ? "Editar custo" : "Adicionar custo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Custos por Unidade dentro do Fluxo de Caixa" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: costFields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "grid gap-1.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: field.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: field.type ?? "text",
            value: costPayload[field.key] ?? "",
            onChange: (event) => setCostPayload(
              (current) => updateCostPayload(current, field.key, event.target.value)
            ),
            className: "h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          }
        )
      ] }, field.key)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setCostOpen(false),
            className: "h-9 rounded-lg border border-border px-3 text-sm",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: submitCost,
            disabled: createCostMutation.isPending || updateCostMutation.isPending,
            className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60",
            children: "Salvar"
          }
        )
      ] })
    ] }) })
  ] });
}
function CashflowWorkspace({
  records,
  costRecords,
  demoMode,
  onAddEntry,
  onAddCost,
  onEditCost,
  onDeleteCost
}) {
  const entradas = records.filter(
    (recordItem) => String(recordItem.payload.tipo).toLowerCase().includes("entrada")
  );
  const saidas = records.filter((recordItem) => isExpenseType(recordItem.payload.tipo));
  const entradaTotal = entradas.reduce((sum, recordItem) => sum + num(recordItem.payload.valor), 0);
  const saidaTotal = saidas.reduce((sum, recordItem) => sum + num(recordItem.payload.valor), 0);
  const custoTotal = costRecords.reduce(
    (sum, recordItem) => sum + num(recordItem.payload.custo_total),
    0
  );
  const margemMedia = costRecords.length ? costRecords.reduce((sum, recordItem) => {
    const unitCost = num(recordItem.payload.custo_total) / Math.max(num(recordItem.payload.quantidade), 1);
    return sum + (num(recordItem.payload.preco_venda) - unitCost);
  }, 0) / costRecords.length : 0;
  const dreRows = [
    ["Receita bruta", entradaTotal],
    ["(-) Saídas operacionais", -saidaTotal],
    ["(-) Custos de produção", -custoTotal],
    ["(=) Resultado simplificado", entradaTotal - saidaTotal - custoTotal]
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: "Entradas, Saídas e Custos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Custos por Unidade agora vivem dentro do Fluxo de Caixa." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onAddEntry,
              className: "h-8 rounded-md border border-border px-2 text-xs hover:bg-muted",
              children: "Entrada/Saída"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onAddCost,
              className: "h-8 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground",
              children: "Custo"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DashKpi, { label: "Entradas", value: formatMoney(entradaTotal), tone: "success" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DashKpi, { label: "Saídas", value: formatMoney(saidaTotal), tone: "danger" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          DashKpi,
          {
            label: "Margem unitária",
            value: formatMoney(margemMedia),
            tone: margemMedia >= 0 ? "success" : "danger"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DashKpi, { label: "Custos un.", value: String(costRecords.length), tone: "info" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border text-left text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2 pr-3 font-medium", children: "Produto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2 pr-3 font-medium", children: "Unidade" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2 pr-3 font-medium", children: "Custo un." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2 pr-3 font-medium", children: "Venda" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2 pr-3 font-medium", children: "Margem" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2 text-right font-medium", children: "Ações" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          costRecords.map((recordItem) => {
            const unitCost = num(recordItem.payload.custo_total) / Math.max(num(recordItem.payload.quantidade), 1);
            const margin = num(recordItem.payload.preco_venda) - unitCost;
            const marginPct = num(recordItem.payload.preco_venda) ? margin / num(recordItem.payload.preco_venda) * 100 : 0;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border last:border-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 pr-3 font-medium", children: recordItem.payload.produto || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 pr-3", children: recordItem.payload.unidade || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 pr-3", children: formatMoney(unitCost) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 pr-3", children: formatMoney(num(recordItem.payload.preco_venda)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 pr-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "span",
                {
                  className: cn(
                    "rounded-md px-2 py-1 text-xs font-medium",
                    margin >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  ),
                  children: [
                    formatMoney(margin),
                    " / ",
                    marginPct.toFixed(1),
                    "%"
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => onEditCost(recordItem),
                    className: "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted",
                    "aria-label": "Editar custo",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-3.5 w-3.5" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => onDeleteCost(recordItem.id),
                    className: "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted",
                    "aria-label": "Excluir custo",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
                  }
                )
              ] }) })
            ] }, recordItem.id);
          }),
          costRecords.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "py-8 text-center text-sm text-muted-foreground", children: demoMode ? "Sem custo demonstrativo." : "Cadastre custos por unidade aqui." }) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: "DRE simplificada" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Calculada pelos registros editáveis do Fluxo e de Custos." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 divide-y divide-border rounded-lg border border-border", children: dreRows.map(([label, value], index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center justify-between gap-4 px-3 py-2 text-sm",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: index === dreRows.length - 1 ? "font-semibold" : "text-muted-foreground",
                children: label
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: cn(
                  "font-semibold",
                  Number(value) >= 0 ? "text-success" : "text-destructive"
                ),
                children: formatMoney(Number(value))
              }
            )
          ]
        },
        label
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Comparativo por produto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            costRecords.length,
            " itens"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: costRecords.slice(0, 5).map((recordItem) => {
          const unitCost = num(recordItem.payload.custo_total) / Math.max(num(recordItem.payload.quantidade), 1);
          const pct = num(recordItem.payload.preco_venda) ? clampPercent(
            (num(recordItem.payload.preco_venda) - unitCost) / num(recordItem.payload.preco_venda) * 100
          ) : 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: recordItem.payload.produto || "Produto" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                pct.toFixed(0),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 h-2 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full bg-primary", style: { width: `${pct}%` } }) })
          ] }, recordItem.id);
        }) })
      ] })
    ] })
  ] });
}
function DefaultingWorkspace({
  records,
  demoMode,
  onAdd
}) {
  const timeline = [...records].sort(
    (a, b) => String(a.payload.vencimento ?? "").localeCompare(String(b.payload.vencimento ?? ""))
  );
  const steps = [
    { day: "D-3", title: "Lembrete amigável", channel: "WhatsApp + E-mail" },
    { day: "D+1", title: "Aviso de atraso", channel: "WhatsApp" },
    { day: "D+7", title: "Cobrança formal", channel: "E-mail + boleto" },
    { day: "D+15", title: "Negativação", channel: "Análise manual" },
    { day: "D+30", title: "Protesto", channel: "Jurídico" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: "Cronograma visual" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Vencimentos, atrasos e alertas configuráveis." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onAdd,
            className: "h-8 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground",
            children: "Novo título"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
        timeline.map((recordItem) => {
          const due = dateValue(recordItem.payload.vencimento);
          const late = due ? due < /* @__PURE__ */ new Date() : false;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: recordItem.payload.cliente || "Cliente" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: recordItem.payload.vencimento || "Sem vencimento" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: cn(
                    "rounded-md px-2 py-1 text-xs font-medium",
                    late ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
                  ),
                  children: late ? "Atrasado" : recordItem.payload.status || "A vencer"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: formatMoney(num(recordItem.payload.valor)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "alerta ",
                recordItem.payload.alerta_dias || "3",
                "d /",
                " ",
                recordItem.payload.canal || "WhatsApp"
              ] })
            ] })
          ] }, recordItem.id);
        }),
        timeline.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground", children: demoMode ? "Sem inadimplência demonstrativa." : "Cadastre títulos para ativar o cronograma." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BellRing, { className: "h-4 w-4 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: "Régua de Cobrança" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-3", children: steps.map((step, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-xs font-semibold", children: step.day }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
            step.title,
            index < 3 ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-success" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-3.5 w-3.5 text-muted-foreground" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: step.channel })
        ] })
      ] }, step.day)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground", children: "Para alterar a régua por cliente, edite os campos Etapa da régua, Canal e Alerta dias na tabela abaixo." })
    ] })
  ] });
}
function clampPercent(value) {
  return Math.min(Math.max(value, 0), 100);
}
function FinanceiroPage() {
  const {
    demoMode
  } = useDemoMode();
  const [period, setPeriod] = reactExports.useState(defaultPeriod());
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-8 py-6 max-w-[1600px] mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Financeiro Agro" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: demoMode ? "Modo DEMO ligado: dados demonstrativos isolados dos cadastros reais." : "Modo DEMO desligado: exibindo somente dados reais do Supabase." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PeriodPicker, { value: period, onChange: setPeriod }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toast.success(`Exportação preparada para ${period.label}.`), className: "flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm hover:bg-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
          "Exportar"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FinancialAgroCrud, {})
  ] });
}
export {
  FinanceiroPage as component
};
