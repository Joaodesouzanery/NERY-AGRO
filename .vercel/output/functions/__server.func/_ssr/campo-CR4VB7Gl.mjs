import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQueries, c as useQueryClient, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as useDemoMode, c as cn } from "./router-D1uahgUG.mjs";
import { l as listFieldRecords, d as createFieldRecord, j as invalidateConnectedQueries, g as deleteFieldRecord, u as updateFieldRecord } from "./connected-agro-data-B5gpgC4B.mjs";
import { I as ImportRecordsButton, D as Dialog, a as DialogContent, d as DialogHeader, e as DialogTitle, b as DialogDescription, c as DialogFooter } from "./import-records-button-BiVLSQbM.mjs";
import { R as MapPinned, i as CalendarDays, c as AudioLines, M as Leaf, a1 as ScanSearch, Y as QrCode, S as Microscope, u as Droplets, s as CloudSun, a9 as Tractor, ai as Wheat, a5 as Sprout, af as Upload, K as LayoutDashboard, ak as X, X as Plus, W as PenLine, aa as Trash2, e as BellRing } from "../_libs/lucide-react.mjs";
import { e as ResponsiveContainer, b as BarChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, B as Bar } from "../_libs/recharts.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
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
const statusOptions = ["Planejado", "Em andamento", "Concluído", "Alerta", "Bloqueado"];
const campoModules = [{
  id: "areas",
  label: "Áreas e Talhões",
  shortLabel: "Talhões",
  description: "Mapeamento visual das áreas, histórico do solo e coordenadas GPS.",
  icon: MapPinned,
  fields: [{
    key: "talhao",
    label: "Talhão"
  }, {
    key: "area_ha",
    label: "Area ha",
    type: "number"
  }, {
    key: "cultura",
    label: "Cultura"
  }, {
    key: "uso_solo",
    label: "Histórico de uso do solo",
    type: "textarea"
  }, {
    key: "coordenadas",
    label: "Coordenadas GPS",
    type: "gps"
  }, {
    key: "status",
    label: "Status",
    type: "select",
    options: statusOptions
  }]
}, {
  id: "calendario",
  label: "Calendário de Plantio/Colheita",
  shortLabel: "Calendário",
  description: "Cronograma visual baseado em sazonalidade e alertas de colheita.",
  icon: CalendarDays,
  fields: [{
    key: "cultura",
    label: "Cultura"
  }, {
    key: "talhao",
    label: "Talhão"
  }, {
    key: "plantio_inicio",
    label: "Janela plantio inicio",
    type: "date"
  }, {
    key: "colheita_prevista",
    label: "Colheita prevista",
    type: "date"
  }, {
    key: "sazonalidade",
    label: "Sazonalidade"
  }, {
    key: "alerta",
    label: "Alerta de colheita",
    type: "select",
    options: ["7 dias", "15 dias", "30 dias"]
  }]
}, {
  id: "diario",
  label: "Diário de Campo Digital",
  shortLabel: "Diário",
  description: "Notas, fotos, áudio e observações com geolocalização.",
  icon: AudioLines,
  fields: [{
    key: "titulo",
    label: "Titulo"
  }, {
    key: "talhao",
    label: "Talhão"
  }, {
    key: "observacao",
    label: "Observação",
    type: "textarea"
  }, {
    key: "foto_url",
    label: "Foto URL",
    type: "url"
  }, {
    key: "audio_url",
    label: "Áudio URL",
    type: "url"
  }, {
    key: "gps",
    label: "GPS",
    type: "gps"
  }, {
    key: "offline_status",
    label: "Registro offline-first"
  }]
}, {
  id: "insumos",
  label: "Registro de Insumos",
  shortLabel: "Insumos",
  description: "Sementes, fertilizantes e defensivos aplicados por talhão.",
  icon: Leaf,
  fields: [{
    key: "insumo",
    label: "Insumo"
  }, {
    key: "tipo",
    label: "Tipo",
    type: "select",
    options: ["Semente", "Fertilizante", "Defensivo"]
  }, {
    key: "talhao",
    label: "Talhão"
  }, {
    key: "dose",
    label: "Dose"
  }, {
    key: "carencia",
    label: "Carência dias",
    type: "number"
  }, {
    key: "custo_hectare",
    label: "Custo por hectare",
    type: "number"
  }]
}, {
  id: "pragas",
  label: "Manejo de Pragas e Doenças",
  shortLabel: "Pragas",
  description: "Histórico de ocorrências, mapa de focos e tratamentos.",
  icon: ScanSearch,
  fields: [{
    key: "ocorrencia",
    label: "Ocorrencia"
  }, {
    key: "talhao",
    label: "Talhão"
  }, {
    key: "severidade",
    label: "Severidade",
    type: "select",
    options: ["Baixa", "Media", "Alta"]
  }, {
    key: "tratamento",
    label: "Tratamento",
    type: "textarea"
  }, {
    key: "receituario",
    label: "Receituário agronômico"
  }, {
    key: "gps",
    label: "GPS do foco",
    type: "gps"
  }, {
    key: "carencia",
    label: "Carência pós-aplicação",
    type: "number"
  }]
}, {
  id: "lotes",
  label: "Rastreabilidade de Lotes",
  shortLabel: "Lotes",
  description: "QR Code por lote, cadeia de custódia e conformidade orgânica.",
  icon: QrCode,
  fields: [{
    key: "lote",
    label: "Lote"
  }, {
    key: "origem",
    label: "Origem"
  }, {
    key: "talhao",
    label: "Talhão"
  }, {
    key: "custodia",
    label: "Cadeia de custodia",
    type: "textarea"
  }, {
    key: "conformidade",
    label: "Conformidade orgânica",
    type: "select",
    options: ["Conforme", "Em análise", "Não conforme"]
  }]
}, {
  id: "solo",
  label: "Gestão de Solo",
  shortLabel: "Solo",
  description: "Análises químicas, calagem e histórico por talhão.",
  icon: Microscope,
  fields: [{
    key: "talhao",
    label: "Talhão"
  }, {
    key: "ph",
    label: "pH",
    type: "number"
  }, {
    key: "mo",
    label: "MO",
    type: "number"
  }, {
    key: "ctc",
    label: "CTC",
    type: "number"
  }, {
    key: "calagem",
    label: "Recomendação de calagem",
    type: "textarea"
  }, {
    key: "data_laudo",
    label: "Data do laudo",
    type: "date"
  }]
}, {
  id: "irrigacao",
  label: "Controle de Irrigação",
  shortLabel: "Irrigação",
  description: "Turnos de rega, consumo por talhão e integração IoT preparada.",
  icon: Droplets,
  fields: [{
    key: "talhao",
    label: "Talhão"
  }, {
    key: "turno",
    label: "Turno automatico"
  }, {
    key: "consumo_m3",
    label: "Consumo m3",
    type: "number"
  }, {
    key: "sensor_iot",
    label: "Sensor IoT"
  }, {
    key: "status",
    label: "Status",
    type: "select",
    options: statusOptions
  }]
}, {
  id: "meteorologia",
  label: "Previsão Meteorológica",
  shortLabel: "Clima",
  description: "Previsão de 7 dias, alertas push preparados e histórico climático.",
  icon: CloudSun,
  fields: [{
    key: "local",
    label: "Local"
  }, {
    key: "periodo",
    label: "Período"
  }, {
    key: "risco",
    label: "Risco",
    type: "select",
    options: ["Geada", "Chuva", "Seca", "Normal"]
  }, {
    key: "previsao_7d",
    label: "Previsão 7 dias",
    type: "textarea"
  }, {
    key: "alerta_push",
    label: "Alerta push"
  }]
}, {
  id: "maquinario",
  label: "Gestão de Maquinário",
  shortLabel: "Máquinas",
  description: "Manutencao preventiva, horimetro e custo operacional.",
  icon: Tractor,
  fields: [{
    key: "maquina",
    label: "Máquina"
  }, {
    key: "horimetro",
    label: "Horimetro",
    type: "number"
  }, {
    key: "troca_oleo",
    label: "Troca de oleo",
    type: "date"
  }, {
    key: "manutencao",
    label: "Alerta de manutencao"
  }, {
    key: "custo_operacional",
    label: "Custo operacional",
    type: "number"
  }]
}, {
  id: "estimativa",
  label: "Estimativa de Safra",
  shortLabel: "Safra",
  description: "Produtividade esperada, histórico e cenários por talhão.",
  icon: Wheat,
  fields: [{
    key: "talhao",
    label: "Talhão"
  }, {
    key: "cultura",
    label: "Cultura"
  }, {
    key: "produtividade",
    label: "Produtividade esperada",
    type: "number"
  }, {
    key: "historico",
    label: "Comparação histórica"
  }, {
    key: "cenario",
    label: "Cenario",
    type: "select",
    options: ["Otimista", "Base", "Pessimista"]
  }]
}, {
  id: "planejamento",
  label: "Planejamento de Plantio por Talhão",
  shortLabel: "Plantio",
  description: "Variedade, taxa de semeadura, espacamento e janela de plantio.",
  icon: Sprout,
  fields: [{
    key: "talhao",
    label: "Talhão"
  }, {
    key: "variedade",
    label: "Variedade"
  }, {
    key: "taxa_semeadura",
    label: "Taxa de semeadura"
  }, {
    key: "espacamento",
    label: "Espacamento"
  }, {
    key: "meta_produtividade",
    label: "Meta produtividade",
    type: "number"
  }, {
    key: "janela_valida",
    label: "Validação da janela"
  }]
}, {
  id: "prescricao",
  label: "Mapa de Prescricao",
  shortLabel: "Prescricao",
  description: "Taxa variável por zona, exportação para máquina preparada e histórico.",
  icon: MapPinned,
  fields: [{
    key: "zona",
    label: "Zona de manejo"
  }, {
    key: "talhao",
    label: "Talhão"
  }, {
    key: "semente",
    label: "Semente"
  }, {
    key: "fertilizante",
    label: "Fertilizante"
  }, {
    key: "defensivo",
    label: "Defensivo"
  }, {
    key: "exportacao",
    label: "Arquivo para máquina"
  }]
}, {
  id: "modelo",
  label: "Monitoramento + Modelo de Cultura",
  shortLabel: "Modelo",
  description: "Simulação de crescimento por clima, solo, manejo e genética.",
  icon: Leaf,
  fields: [{
    key: "cultura",
    label: "Cultura"
  }, {
    key: "talhao",
    label: "Talhão"
  }, {
    key: "estagio",
    label: "Estágio fenológico"
  }, {
    key: "projecao",
    label: "Projeção produtividade",
    type: "number"
  }, {
    key: "sensibilidade",
    label: "Sensibilidade ao clima",
    type: "textarea"
  }]
}, {
  id: "scouting",
  label: "Scouting de Campo",
  shortLabel: "Scouting",
  description: "Notas, fotos e alertas georreferenciados para o agronomo.",
  icon: ScanSearch,
  fields: [{
    key: "alerta",
    label: "Alerta"
  }, {
    key: "talhao",
    label: "Talhão"
  }, {
    key: "foto_url",
    label: "Foto URL",
    type: "url"
  }, {
    key: "gps",
    label: "GPS",
    type: "gps"
  }, {
    key: "responsavel",
    label: "Agronomo"
  }, {
    key: "status",
    label: "Status",
    type: "select",
    options: statusOptions
  }]
}, {
  id: "pre-colheita",
  label: "Estimativa Pre-Colheita",
  shortLabel: "Pre-colheita",
  description: "Amostragem digital para logística, contratos e projeção por talhão.",
  icon: Wheat,
  fields: [{
    key: "talhao",
    label: "Talhão"
  }, {
    key: "amostragem",
    label: "Amostragem digital",
    type: "textarea"
  }, {
    key: "projecao",
    label: "Projeção por talhão",
    type: "number"
  }, {
    key: "contratos",
    label: "Saída para contratos"
  }]
}, {
  id: "analise-solo",
  label: "Análise de Solo Integrada",
  shortLabel: "Laudos",
  description: "Importação de laudos, recomendação automática e histórico por camada.",
  icon: Upload,
  fields: [{
    key: "talhao",
    label: "Talhão"
  }, {
    key: "laudo_url",
    label: "Laudo URL",
    type: "url"
  }, {
    key: "camada",
    label: "Camada"
  }, {
    key: "recomendacao",
    label: "Recomendação automática",
    type: "textarea"
  }, {
    key: "data",
    label: "Data",
    type: "date"
  }]
}, {
  id: "nitrogenio",
  label: "Gestão de Nitrogênio",
  shortLabel: "Nitrogênio",
  description: "Dose preditiva por clima e solo, janelas e risco de chuva.",
  icon: Leaf,
  fields: [{
    key: "talhao",
    label: "Talhão"
  }, {
    key: "dose",
    label: "Dose preditiva",
    type: "number"
  }, {
    key: "janela",
    label: "Janela de aplicação"
  }, {
    key: "risco_chuva",
    label: "Risco de perda por chuva"
  }, {
    key: "status",
    label: "Status",
    type: "select",
    options: statusOptions
  }]
}];
const demoRecords = {
  areas: [record("areas", "1", {
    talhao: "Talhão A",
    area_ha: "18",
    cultura: "Hortalicas",
    uso_solo: "Rotação com milho verde e adubação orgânica.",
    coordenadas: "22,70;36,56;55,48;72,40",
    status: "Em andamento"
  }), record("areas", "2", {
    talhao: "Talhão B",
    area_ha: "12",
    cultura: "Mandioca",
    uso_solo: "Pousio curto e cobertura vegetal.",
    coordenadas: "20,42;38,36;55,30;70,25",
    status: "Planejado"
  })],
  calendario: [record("calendario", "1", {
    cultura: "Hortalicas",
    talhao: "Talhão A",
    plantio_inicio: "2026-06-05",
    colheita_prevista: "2026-08-12",
    sazonalidade: "Inverno seco",
    alerta: "15 dias"
  })],
  diario: [record("diario", "1", {
    titulo: "Vistoria pós-chuva",
    talhao: "Talhão A",
    observacao: "Solo com boa infiltração e sem erosão visível.",
    foto_url: "",
    audio_url: "",
    gps: "-23.5505,-46.6333",
    offline_status: "Sincronizado"
  })],
  insumos: [record("insumos", "1", {
    insumo: "Composto orgânico",
    tipo: "Fertilizante",
    talhao: "Talhão A",
    dose: "2 t/ha",
    carencia: "0",
    custo_hectare: "480"
  })],
  pragas: [record("pragas", "1", {
    ocorrencia: "Lagarta",
    talhao: "Talhão A",
    severidade: "Media",
    tratamento: "Monitorar bordadura e aplicar biologico se aumentar.",
    receituario: "BIO-2026-009",
    gps: "52,47",
    carencia: "3"
  })],
  lotes: [record("lotes", "1", {
    lote: "ORG-2026-001",
    origem: "Talhão A",
    talhao: "Talhão A",
    custodia: "Colheita, higienização, embalagem e expedição registrados.",
    conformidade: "Conforme"
  })]
};
function record(module, id, payload) {
  return {
    id: `${module}-demo-${id}`,
    module,
    payload
  };
}
function num(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
function numericValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!match) return void 0;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : void 0;
}
function buildPercentileLookup(records, key) {
  const values = records.map((recordItem) => ({
    id: recordItem.id,
    value: numericValue(recordItem.payload[key])
  })).filter((item) => item.value !== void 0).sort((a, b) => a.value - b.value);
  if (!values.length) return /* @__PURE__ */ new Map();
  if (values.length === 1) return /* @__PURE__ */ new Map([[values[0].id, 100]]);
  return new Map(values.map((item, index) => [item.id, Math.round(index / Math.max(values.length - 1, 1) * 100)]));
}
function formatPercentile(value) {
  return value === void 0 ? "-" : `P${value}`;
}
const totalCostKeys = ["custo_total", "custo_hectare", "custo_operacional", "valor"];
function calculatedCostFields(fields) {
  if (!fields.some((field) => totalCostKeys.includes(field.key))) return fields;
  const next = [...fields];
  const add = (field) => {
    if (!next.some((item) => item.key === field.key)) next.push(field);
  };
  add({
    key: "quantidade",
    label: "Quantidade",
    type: "number"
  });
  add({
    key: "unidade_base",
    label: "Unidade base"
  });
  add({
    key: "custo_total",
    label: "Custo total",
    type: "number"
  });
  add({
    key: "custo_unitario",
    label: "Custo unitario",
    type: "number"
  });
  return next;
}
function normalizeCostPayload(payload, changedKey) {
  const next = {
    ...payload
  };
  if (!Object.keys(next).some((key) => totalCostKeys.includes(key) || key === "custo_unitario")) {
    return next;
  }
  if (changedKey && totalCostKeys.includes(changedKey) && changedKey !== "custo_total") {
    next.custo_total = next[changedKey] ?? "";
  }
  const quantity = num(next.quantidade);
  const totalKey = changedKey && totalCostKeys.includes(changedKey) ? changedKey : next.custo_total ? "custo_total" : totalCostKeys.find((key) => next[key]) ?? "custo_total";
  const total = num(next.custo_total || next[totalKey]);
  const unit = num(next.custo_unitario);
  if (quantity <= 0) return next;
  if (changedKey === "custo_unitario" && unit > 0) {
    next.custo_total = String(Math.round(unit * quantity * 1e4) / 1e4);
  } else if (changedKey === "quantidade" || changedKey === "custo_total" || totalCostKeys.includes(changedKey ?? "")) {
    next.custo_unitario = total > 0 ? String(Math.round(total / quantity * 1e4) / 1e4) : "";
  }
  return next;
}
function updateCostPayload(current, key, value) {
  return normalizeCostPayload({
    ...current,
    [key]: value
  }, key);
}
function emptyPayload(module) {
  return Object.fromEntries(calculatedCostFields(module.fields).map((field) => [field.key, ""]));
}
function formatValue(value, field) {
  if (!value) return "-";
  if (field?.type === "number") return num(value).toLocaleString("pt-BR");
  return value;
}
function parseRoute(value) {
  const points = String(value ?? "").split(";").map((pair) => {
    const [first, second] = pair.split(",").map((part) => num(part.trim()));
    if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
    if (first < 0 || second < 0) return {
      lat: first,
      lng: second
    };
    return {
      x: first,
      y: second
    };
  }).filter((point) => Boolean(point));
  return points.length > 1 ? points : [];
}
function parseFocus(value) {
  const [first, second] = String(value ?? "").split(",").map((part) => num(part.trim()));
  if (!Number.isFinite(first) || !Number.isFinite(second)) return void 0;
  if (first < 0 || second < 0) return {
    lat: first,
    lng: second
  };
  return {
    x: first,
    y: second
  };
}
function centroid(points) {
  if (!points.length) return void 0;
  const latLng = points.filter((point) => point.lat !== void 0 && point.lng !== void 0);
  if (latLng.length) {
    return {
      lat: latLng.reduce((sum, point) => sum + num(point.lat), 0) / latLng.length,
      lng: latLng.reduce((sum, point) => sum + num(point.lng), 0) / latLng.length
    };
  }
  return {
    x: points.reduce((sum, point) => sum + num(point.x), 0) / points.length,
    y: points.reduce((sum, point) => sum + num(point.y), 0) / points.length
  };
}
function fieldTone(moduleId, payload) {
  if (moduleId === "pragas") return payload.severidade === "Alta" ? "danger" : "warning";
  if (["meteorologia", "irrigacao", "maquinario", "nitrogenio"].includes(moduleId)) return "warning";
  if (["lotes", "diario", "scouting", "analise-solo", "solo"].includes(moduleId)) return "info";
  if (["areas", "insumos", "planejamento", "estimativa"].includes(moduleId)) return "success";
  return "primary";
}
function fieldTitle(module, payload) {
  const preferred = ["talhao", "lote", "insumo", "ocorrencia", "maquina", "cultura", "titulo", "alerta", "zona", "local"];
  const key = preferred.find((item) => payload[item]);
  return key ? payload[key] : module.shortLabel;
}
function moduleSummary(module, records) {
  switch (module.id) {
    case "areas":
      return {
        headline: `${records.reduce((sum, item) => sum + num(item.payload.area_ha), 0).toLocaleString("pt-BR")} ha`,
        caption: `${records.length} talhões mapeados`
      };
    case "insumos":
      return {
        headline: records.reduce((sum, item) => sum + num(item.payload.custo_hectare), 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        }),
        caption: "custo/ha registrado"
      };
    case "pragas":
      return {
        headline: String(records.filter((item) => item.payload.severidade === "Alta").length),
        caption: "focos criticos"
      };
    default:
      return {
        headline: String(records.length),
        caption: "registros"
      };
  }
}
function queueOfflineDiary(payload) {
  const key = "nery-campo-diario-pendente";
  const current = JSON.parse(localStorage.getItem(key) || "[]");
  localStorage.setItem(key, JSON.stringify([{
    ...payload,
    offline_status: "Pendente"
  }, ...current]));
}
function CampoPage() {
  const {
    demoMode
  } = useDemoMode();
  const [activeTab, setActiveTab] = reactExports.useState("visao-geral");
  const [selectedTalhaoId, setSelectedTalhaoId] = reactExports.useState(null);
  const queryResults = useQueries({
    queries: campoModules.map((module) => ({
      queryKey: ["field-records", module.id],
      queryFn: () => listFieldRecords(module.id),
      enabled: !demoMode
    }))
  });
  const recordsByModule = reactExports.useMemo(() => {
    if (demoMode) return demoRecords;
    return Object.fromEntries(campoModules.map((module, index) => [module.id, queryResults[index].data ?? []]));
  }, [demoMode, queryResults]);
  const talhoes = reactExports.useMemo(() => recordsByModule.areas ?? [], [recordsByModule.areas]);
  const routes = reactExports.useMemo(() => talhoes.map((item) => {
    const points = parseRoute(item.payload.coordenadas);
    if (!points.length) return null;
    return {
      id: item.id,
      label: item.payload.talhao || "Talhão",
      points,
      shape: "polygon",
      category: "areas",
      sourceModule: "areas",
      status: item.payload.status,
      description: item.payload.uso_solo,
      tone: "success",
      meta: {
        Cultura: item.payload.cultura,
        Área: item.payload.area_ha ? `${item.payload.area_ha} ha` : void 0
      }
    };
  }).filter((route) => Boolean(route)), [talhoes]);
  const talhaoCenters = reactExports.useMemo(() => {
    return new Map(talhoes.map((item) => {
      const center = centroid(parseRoute(item.payload.coordenadas));
      return item.payload.talhao && center ? [item.payload.talhao, center] : null;
    }).filter((item) => Boolean(item)));
  }, [talhoes]);
  const campoMapPoints = reactExports.useMemo(() => campoModules.flatMap((module) => (recordsByModule[module.id] ?? []).map((item) => {
    const directPoint = parseFocus(item.payload.gps) ?? parseFocus(item.payload.coordenadas) ?? parseFocus(item.payload.localizacao);
    const talhaoPoint = item.payload.talhao ? talhaoCenters.get(item.payload.talhao) : void 0;
    const point = directPoint ?? talhaoPoint;
    if (!point) return null;
    return {
      id: `${module.id}-${item.id}`,
      label: fieldTitle(module, item.payload),
      ...point,
      tone: fieldTone(module.id, item.payload),
      category: module.id,
      icon: module.id,
      sourceModule: module.id,
      status: item.payload.status ?? item.payload.severidade,
      description: item.payload.observacao ?? item.payload.tratamento ?? item.payload.recomendacao ?? module.description,
      meta: {
        Modulo: module.shortLabel,
        Talhao: item.payload.talhao,
        Status: item.payload.status,
        Severidade: item.payload.severidade,
        Cultura: item.payload.cultura
      }
    };
  }).filter((point) => Boolean(point))), [recordsByModule, talhaoCenters]);
  const hectares = talhoes.reduce((sum, item) => sum + num(item.payload.area_ha), 0);
  const alerts = [...recordsByModule.pragas ?? [], ...recordsByModule.meteorologia ?? []].length;
  const selectedTalhao = talhoes.find((t) => t.id === selectedTalhaoId);
  const talhaoPragas = selectedTalhao ? (recordsByModule.pragas ?? []).filter((p) => p.payload.talhao === selectedTalhao.payload.talhao) : [];
  const talhaoInsumos = selectedTalhao ? (recordsByModule.insumos ?? []).filter((p) => p.payload.talhao === selectedTalhao.payload.talhao) : [];
  const tabs = reactExports.useMemo(() => [{
    id: "visao-geral",
    label: "Visão Geral",
    icon: LayoutDashboard
  }, ...campoModules.map((m) => ({
    id: m.id,
    label: m.shortLabel,
    icon: m.icon
  }))], []);
  const activeModule = campoModules.find((m) => m.id === activeTab);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-8 py-6 max-w-[1600px] mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Campo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Talhões, manejo, rastreabilidade, clima e planejamento agrícola em uma tela operacional." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-border px-3 py-1 text-xs text-muted-foreground", children: demoMode ? "DEMO" : "REAL" })
    ] }),
    !demoMode && false,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-9", children: tabs.map((t) => {
      const active = activeTab === t.id;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActiveTab(t.id), className: cn("min-h-16 rounded-xl border p-3 text-left text-sm font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]", active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(t.icon, { className: "h-4 w-4 shrink-0 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: t.label })
      ] }) }, t.id);
    }) }),
    activeTab === "visao-geral" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 xl:grid-cols-[1fr_430px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Talhões", value: String(talhoes.length), hint: "áreas cadastradas" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Área total", value: `${hectares.toLocaleString("pt-BR")} ha`, hint: "mapeada" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Alertas", value: String(alerts), hint: "campo e clima" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Lotes", value: String(recordsByModule.lotes?.length ?? 0), hint: "rastreáveis" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6", children: campoModules.map((module) => {
            const summary = moduleSummary(module, recordsByModule[module.id] ?? []);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveTab(module.id), className: "rounded-xl border border-border bg-background/60 p-3 text-sm text-left transition hover:bg-muted/60", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-medium", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(module.icon, { className: "h-4 w-4 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: module.shortLabel })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-lg font-semibold", children: summary.headline }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: summary.caption })
            ] }, module.id);
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CartoMap, { variant: "satellite", className: "h-[380px]", centerLabel: "Mapa de talhões", routes, points: campoMapPoints, showLegend: true, onRouteClick: (r) => setSelectedTalhaoId(r.id) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 h-56 rounded-xl border border-border bg-background/60 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: campoModules.map((module) => ({
        label: module.shortLabel,
        valor: (recordsByModule[module.id] ?? []).length
      })), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)", vertical: false }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", fontSize: 11, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { allowDecimals: false, fontSize: 11, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "valor", fill: "var(--color-primary)", radius: [6, 6, 0, 0] })
      ] }) }) }),
      selectedTalhao && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wide text-primary", children: "Talhão selecionado" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "mt-1 text-lg font-semibold", children: [
              selectedTalhao.payload.talhao || "Talhão",
              " ·",
              " ",
              selectedTalhao.payload.cultura || "—"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 text-xs text-muted-foreground", children: [
              selectedTalhao.payload.area_ha ? `${selectedTalhao.payload.area_ha} ha · ` : "",
              selectedTalhao.payload.status || "Status não informado"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSelectedTalhaoId(null), className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted", "aria-label": "Fechar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-3 md:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Histórico de uso", value: selectedTalhao.payload.uso_solo ? "Registrado" : "—", hint: selectedTalhao.payload.uso_solo || "Sem histórico" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Insumos aplicados", value: String(talhaoInsumos.length), hint: "registros associados" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Focos de praga", value: String(talhaoPragas.length), hint: talhaoPragas.some((p) => p.payload.severidade === "Alta") ? "atenção alta" : "monitoramento" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActiveTab("areas"), className: "h-8 rounded-md border border-border px-3 text-xs hover:bg-muted", children: "Editar talhão" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActiveTab("insumos"), className: "h-8 rounded-md border border-border px-3 text-xs hover:bg-muted", children: "Ver insumos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActiveTab("pragas"), className: "h-8 rounded-md border border-border px-3 text-xs hover:bg-muted", children: "Ver pragas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActiveTab("solo"), className: "h-8 rounded-md border border-border px-3 text-xs hover:bg-muted", children: "Ver solo" })
        ] })
      ] })
    ] }) }),
    activeModule && /* @__PURE__ */ jsxRuntimeExports.jsx(CampoModuleSection, { module: activeModule, demoMode, records: recordsByModule[activeModule.id] ?? [] }, activeModule.id)
  ] });
}
function CampoKpi({
  label,
  value,
  hint
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-semibold", children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: hint })
  ] });
}
function CartoMap({
  routes = [],
  points = []
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-xl border border-border bg-background/60 p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-h-[260px] flex-col justify-between gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MapPinned, { className: "h-4 w-4 text-primary" }),
        "Mapa operacional unico"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Talhoes, insumos, pragas, clima e demais registros georreferenciados aparecem no mapa principal da plataforma." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-3 xl:grid-cols-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Talhoes no mapa", value: String(routes.length), hint: "poligonos cadastrados" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Pontos de campo", value: String(points.length), hint: "GPS ou centro do talhao" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/", className: "inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground", children: "Abrir mapa" })
    ] })
  ] }) });
}
function CampoModuleSection({
  module,
  demoMode,
  records
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [payload, setPayload] = reactExports.useState(emptyPayload(module));
  const summary = moduleSummary(module, records);
  const isInsumos = module.id === "insumos";
  const custoPercentiles = reactExports.useMemo(() => isInsumos ? buildPercentileLookup(records, "custo_hectare") : /* @__PURE__ */ new Map(), [isInsumos, records]);
  const dosePercentiles = reactExports.useMemo(() => isInsumos ? buildPercentileLookup(records, "dose") : /* @__PURE__ */ new Map(), [isInsumos, records]);
  const fields = reactExports.useMemo(() => calculatedCostFields(module.fields), [module.fields]);
  const createMutation = useMutation({
    mutationFn: createFieldRecord,
    onSuccess: () => {
      toast.success("Registro adicionado.");
      setOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ["field-records", module.id]
      });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => {
      if (module.id === "diario") {
        queueOfflineDiary(payload);
        toast.info("Registro salvo na fila offline do Diário.");
        setOpen(false);
        return;
      }
      toast.error(error.message);
    }
  });
  const updateMutation = useMutation({
    mutationFn: updateFieldRecord,
    onSuccess: () => {
      toast.success("Registro atualizado.");
      setOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ["field-records", module.id]
      });
      invalidateConnectedQueries(queryClient);
    },
    onError: (error) => toast.error(error.message)
  });
  const deleteMutation = useMutation({
    mutationFn: deleteFieldRecord,
    onSuccess: () => {
      toast.success("Registro excluido.");
      void queryClient.invalidateQueries({
        queryKey: ["field-records", module.id]
      });
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
  const beginEdit = (recordItem) => {
    if (demoMode) {
      toast.info("Dados demo não podem ser editados.");
      return;
    }
    setEditing(recordItem);
    setPayload({
      ...emptyPayload(module),
      ...recordItem.payload
    });
    setOpen(true);
  };
  const submit = () => {
    if (demoMode) return;
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        payload: normalizeCostPayload(payload)
      });
      return;
    }
    createMutation.mutate({
      module: module.id,
      payload: normalizeCostPayload(payload)
    });
  };
  const importRows = async (rows) => {
    if (demoMode) return toast.info("Desligue o modo DEMO para importar dados reais.");
    for (const row of rows) {
      await createFieldRecord({
        module: module.id,
        payload: normalizeCostPayload(row)
      });
    }
    void queryClient.invalidateQueries({
      queryKey: ["field-records", module.id]
    });
    invalidateConnectedQueries(queryClient);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: module.id, className: "scroll-mt-20 rounded-lg border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(module.icon, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: module.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: module.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ImportRecordsButton, { fields, disabled: demoMode, onImport: importRows }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: beginCreate, className: "inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          "Adicionar"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 grid gap-3 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Resumo", value: summary.headline, hint: summary.caption }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Registros", value: String(records.length), hint: demoMode ? "somente leitura" : "editável" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CampoKpi, { label: "Automação", value: isInsumos ? `${custoPercentiles.size}/${dosePercentiles.size}` : module.id === "diario" ? "Offline" : "Ativa", hint: isInsumos ? "percentis custo/dose" : "v1 funcional" })
    ] }),
    module.id === "lotes" && /* @__PURE__ */ jsxRuntimeExports.jsx(LotTraceability, { records }),
    module.id === "calendario" && /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarStrip, { records }),
    module.id === "diario" && /* @__PURE__ */ jsxRuntimeExports.jsx(OfflineNote, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border text-left text-xs text-muted-foreground", children: [
        fields.slice(0, 5).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-4 font-medium", children: field.label }, field.key)),
        isInsumos && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-4 font-medium", children: "Percentil custo/ha" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-4 font-medium", children: "Percentil dose" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right font-medium", children: "Ações" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
        records.map((recordItem) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border last:border-0", children: [
          fields.slice(0, 5).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-4 max-w-64 truncate", children: formatValue(recordItem.payload[field.key], field) }, field.key)),
          isInsumos && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-4 font-medium", children: formatPercentile(custoPercentiles.get(recordItem.id)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-4 font-medium", children: formatPercentile(dosePercentiles.get(recordItem.id)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => beginEdit(recordItem), className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted", "aria-label": "Editar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
              if (demoMode) {
                toast.info("Dados demo não podem ser excluídos.");
                return;
              }
              if (window.confirm("Excluir este registro?")) deleteMutation.mutate(recordItem.id);
            }, className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted", "aria-label": "Excluir", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] }) })
        ] }, recordItem.id)),
        records.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: fields.slice(0, 5).length + (isInsumos ? 3 : 1), className: "py-10 text-center text-sm text-muted-foreground", children: "Nenhum registro real cadastrado neste módulo." }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editing ? "Editar registro" : "Adicionar registro" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: module.label })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx(FieldInput, { field, value: payload[field.key] ?? "", onChange: (value) => setPayload((current) => updateCostPayload(current, field.key, value)) }, field.key)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setOpen(false), className: "h-9 rounded-lg border border-border px-3 text-sm", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: submit, disabled: createMutation.isPending || updateMutation.isPending, className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60", children: "Salvar" })
      ] })
    ] }) })
  ] });
}
function FieldInput({
  field,
  value,
  onChange
}) {
  const baseClass = "rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";
  const fillGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização indisponível neste navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => onChange(`${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`), () => toast.error("Não foi possível capturar o GPS."));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "grid gap-1.5 text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: field.label }),
    field.type === "textarea" ? /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value, onChange: (event) => onChange(event.target.value), className: cn(baseClass, "min-h-24 py-2") }) : field.type === "select" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value, onChange: (event) => onChange(event.target.value), className: cn(baseClass, "h-10"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Selecione" }),
      (field.options ?? []).map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option, children: option }, option))
    ] }) : field.type === "gps" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value, onChange: (event) => onChange(event.target.value), placeholder: "lat,lng ou x,y;...", className: cn(baseClass, "h-10 flex-1") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: fillGps, className: "h-10 rounded-md border border-border px-3 text-xs hover:bg-muted", children: "GPS" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: field.type === "url" ? "url" : field.type ?? "text", value, onChange: (event) => onChange(event.target.value), className: cn(baseClass, "h-10") })
  ] });
}
function LotTraceability({
  records
}) {
  if (!records.length) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 grid gap-3 md:grid-cols-3", children: records.slice(0, 3).map((recordItem) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border bg-background/60 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(FakeQr, { value: recordItem.payload.lote || recordItem.id }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: recordItem.payload.lote || "Lote" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: recordItem.payload.conformidade || "Sem conformidade" })
    ] })
  ] }) }, recordItem.id)) });
}
function FakeQr({
  value
}) {
  const cells = Array.from({
    length: 25
  }, (_, index) => (value.charCodeAt(index % value.length) + index) % 3 !== 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-12 w-12 grid-cols-5 gap-0.5 rounded-md border border-border bg-white p-1", children: cells.map((filled, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded-[1px]", filled ? "bg-black" : "bg-white") }, index)) });
}
function CalendarStrip({
  records
}) {
  if (!records.length) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 grid gap-3 md:grid-cols-3", children: records.slice(0, 3).map((recordItem) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background/60 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BellRing, { className: "h-4 w-4 text-primary" }),
      recordItem.payload.cultura || "Cultura"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
      "Plantio ",
      recordItem.payload.plantio_inicio || "-",
      " / Colheita",
      " ",
      recordItem.payload.colheita_prevista || "-"
    ] })
  ] }, recordItem.id)) });
}
function OfflineNote() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground", children: "O Diário salva registros em uma fila local se o Supabase estiver indisponível. Campos de foto e áudio aceitam URL nesta v1." });
}
export {
  CampoPage as component
};
