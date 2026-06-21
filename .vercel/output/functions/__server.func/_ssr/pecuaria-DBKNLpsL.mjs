import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { b as useQuery, c as useQueryClient, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { j as jsPDF } from "../_libs/jspdf.mjs";
import { Q as QRCodeCanvas } from "../_libs/qrcode.react.mjs";
import { s as supabase } from "./client-BHmQHd0X.mjs";
import { f as createOperationRecord, i as deleteOperationRecord, o as updateOperationRecord, j as invalidateConnectedQueries, m as listOperationRecordsByAreaModule } from "./connected-agro-data-B5gpgC4B.mjs";
import { u as useDemoMode, c as cn } from "./router-D1uahgUG.mjs";
import { I as ImportRecordsButton, D as Dialog, a as DialogContent, d as DialogHeader, e as DialogTitle, b as DialogDescription, c as DialogFooter } from "./import-records-button-BiVLSQbM.mjs";
import { d as defaultPeriod, P as PeriodPicker } from "./period-picker-BtQVPyDA.mjs";
import { e as exportRowsToXlsx } from "./export-xlsx-CRIENmK4.mjs";
import { d as downloadPdf, m as makeReportPdf } from "./pdf-utils-DLwND1wI.mjs";
import "../_libs/jspdf-autotable.mjs";
import { Y as QrCode, e as BellRing, i as CalendarDays, a0 as Scale, a5 as Sprout, r as ClipboardList, t as Download, X as Plus, O as LoaderCircle, w as FileText, W as PenLine, aa as Trash2, a2 as Search } from "../_libs/lucide-react.mjs";
import { e as ResponsiveContainer, b as BarChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, B as Bar } from "../_libs/recharts.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "fs";
import "path";
import "../_libs/fflate.mjs";
import "module";
import "../_libs/fast-png.mjs";
import "../_libs/iobuffer.mjs";
import "../_libs/pako.mjs";
import "../_libs/html2canvas.mjs";
import "../_libs/dompurify.mjs";
import "../_libs/canvg.mjs";
import "../_libs/core-js.mjs";
import "../_libs/babel__runtime.mjs";
import "../_libs/raf.mjs";
import "../_libs/performance-now.mjs";
import "../_libs/rgbcolor.mjs";
import "../_libs/svg-pathdata.mjs";
import "../_libs/stackblur-canvas.mjs";
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
import "../_libs/radix-ui__react-popover.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/xlsx.mjs";
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
const BUCKET = "animal-pdfs";
function identifier(record2) {
  return record2.payload.identificacao || record2.payload.brinco_qr || record2.id;
}
function createAnimalPdf(record2) {
  const payload = record2.payload;
  return makeReportPdf({
    title: `Ficha Animal - ${identifier(record2)}`,
    subtitle: `Gerada em ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")}`,
    metrics: [
      { label: "Espécie", value: payload.especie || "-" },
      { label: "Raça", value: payload.raca || "-" },
      { label: "Peso atual", value: payload.peso_atual ? `${payload.peso_atual} kg` : "-" },
      { label: "Status", value: payload.status || "-" }
    ],
    sections: [
      {
        title: "Identificação",
        head: ["Campo", "Informação"],
        body: [
          ["Identificação", payload.identificacao || "-"],
          ["QR no brinco", payload.brinco_qr || "-"],
          ["Sexo", payload.sexo || "-"],
          ["Nascimento", payload.nascimento || "-"],
          ["Linhagem", payload.linhagem || "-"]
        ]
      },
      {
        title: "Histórico e genealogia",
        head: ["Campo", "Informação"],
        body: [
          ["Histórico de pesagens", payload.historico_pesagens || "-"],
          ["Genealogia", payload.genealogia || "-"]
        ]
      }
    ]
  });
}
function downloadAnimalPdf(record2) {
  downloadPdf(createAnimalPdf(record2), `animal-${identifier(record2)}.pdf`);
}
async function listAnimalPdfRecords() {
  const { data, error } = await supabase.from("animal_pdf_records").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
async function saveAnimalPdfVersion(record2) {
  const animalIdentifier = identifier(record2);
  const current = await listAnimalPdfRecords();
  const versions = current.filter((item) => item.animal_record_id === record2.id);
  const version = versions.length + 1;
  const fileName = `animal-${animalIdentifier}-v${version}.pdf`.replace(/[^\w.-]+/g, "_");
  const filePath = `${record2.id}/${Date.now()}-${fileName}`;
  const blob = createAnimalPdf(record2).output("blob");
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, blob, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw new Error(uploadError.message);
  const { data, error } = await supabase.from("animal_pdf_records").insert({
    animal_record_id: record2.id,
    animal_identifier: animalIdentifier,
    version,
    file_path: filePath,
    file_name: fileName,
    payload_snapshot: record2.payload
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}
async function downloadStoredAnimalPdf(record2) {
  const { data, error } = await supabase.storage.from(BUCKET).download(record2.file_path);
  if (error) throw new Error(error.message);
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = record2.file_name;
  link.click();
  URL.revokeObjectURL(url);
}
const AREA = "pecuaria";
const modules = [{
  id: "animal",
  label: "Ficha Individual por Animal",
  shortLabel: "Animais",
  description: "Saúde, peso, linhagem, vacinação, QR no brinco e genealogia.",
  icon: QrCode,
  fields: [{
    key: "identificacao",
    label: "Identificação"
  }, {
    key: "especie",
    label: "Espécie"
  }, {
    key: "raca",
    label: "Raça"
  }, {
    key: "sexo",
    label: "Sexo"
  }, {
    key: "nascimento",
    label: "Nascimento",
    type: "date"
  }, {
    key: "peso_atual",
    label: "Peso atual (kg)",
    type: "number"
  }, {
    key: "linhagem",
    label: "Linhagem"
  }, {
    key: "brinco_qr",
    label: "QR no brinco"
  }, {
    key: "historico_pesagens",
    label: "Histórico de pesagens",
    type: "textarea"
  }, {
    key: "genealogia",
    label: "Genealogia",
    type: "textarea"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "vacinacao",
  label: "Controle de Vacinação",
  shortLabel: "Vacinação",
  description: "Calendário sanitário, alertas de reforço e lote da vacina.",
  icon: BellRing,
  fields: [{
    key: "animal_lote",
    label: "Animal ou lote"
  }, {
    key: "vacina",
    label: "Vacina"
  }, {
    key: "lote_vacina",
    label: "Lote da vacina"
  }, {
    key: "data",
    label: "Data aplicada",
    type: "date"
  }, {
    key: "proxima_dose",
    label: "Próxima dose",
    type: "date"
  }, {
    key: "calendario_oficial",
    label: "Calendário oficial"
  }, {
    key: "alerta_reforco",
    label: "Alerta de reforço",
    hint: "Ex.: 7 dias antes"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "reprodutivo",
  label: "Ciclo Reprodutivo",
  shortLabel: "Reprodução",
  description: "Coberturas, gestações, nascimentos, cio, parto e prenhez.",
  icon: CalendarDays,
  fields: [{
    key: "animal",
    label: "Animal"
  }, {
    key: "evento",
    label: "Evento",
    hint: "Cio, cobertura, gestação, nascimento"
  }, {
    key: "data",
    label: "Data",
    type: "date"
  }, {
    key: "previsao_parto",
    label: "Previsão de parto",
    type: "date"
  }, {
    key: "calendario_cio",
    label: "Calendário de cio"
  }, {
    key: "taxa_prenhez",
    label: "Taxa de prenhez (%)",
    type: "number"
  }, {
    key: "observacao",
    label: "Observação",
    type: "textarea"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "producao",
  label: "Produção Diária",
  shortLabel: "Produção",
  description: "Coleta de leite, ovos ou mel por animal ou lote, médias e tendências.",
  icon: Scale,
  fields: [{
    key: "animal_lote",
    label: "Animal ou lote"
  }, {
    key: "produto",
    label: "Produto",
    hint: "Leite, ovos, mel"
  }, {
    key: "quantidade",
    label: "Quantidade",
    type: "number"
  }, {
    key: "unidade",
    label: "Unidade"
  }, {
    key: "media",
    label: "Média",
    type: "number"
  }, {
    key: "tendencia",
    label: "Tendência"
  }, {
    key: "data",
    label: "Data",
    type: "date"
  }, {
    key: "observacao",
    label: "Observação",
    type: "textarea"
  }]
}, {
  id: "pastagens",
  label: "Gestão de Pastagens",
  shortLabel: "Pastagens",
  description: "Rodízio de piquetes, descanso do solo e lotação por hectare.",
  icon: Sprout,
  fields: [{
    key: "piquete",
    label: "Piquete"
  }, {
    key: "lote",
    label: "Lote"
  }, {
    key: "area_ha",
    label: "Área (ha)",
    type: "number"
  }, {
    key: "lotacao_hectare",
    label: "Lotação por hectare",
    type: "number"
  }, {
    key: "dias_uso",
    label: "Dias de uso",
    type: "number"
  }, {
    key: "dias_descanso",
    label: "Dias de descanso",
    type: "number"
  }, {
    key: "rotacao",
    label: "Rotação automática"
  }, {
    key: "status",
    label: "Status"
  }]
}];
const demoByModule = {
  animal: [record("animal", "1", {
    identificacao: "BR-0421",
    especie: "Bovino",
    raca: "Girolando",
    sexo: "Fêmea",
    nascimento: "2023-08-14",
    peso_atual: "418",
    linhagem: "Matriz A12 x Touro G5",
    brinco_qr: "QR-BR-0421",
    historico_pesagens: "2026-03: 398 kg; 2026-05: 418 kg",
    genealogia: "Mãe BR-0188, pai G5",
    status: "Ativo"
  })],
  vacinacao: [record("vacinacao", "1", {
    animal_lote: "Lote Bezerras 01",
    vacina: "Clostridial",
    lote_vacina: "VAC-9982",
    data: "2026-05-12",
    proxima_dose: "2026-06-12",
    calendario_oficial: "Sanitário anual",
    alerta_reforco: "7 dias antes",
    status: "Reforço previsto"
  })],
  reprodutivo: [record("reprodutivo", "1", {
    animal: "BR-0421",
    evento: "Cobertura",
    data: "2026-05-03",
    previsao_parto: "2027-02-07",
    calendario_cio: "Retorno em 21 dias",
    taxa_prenhez: "72",
    observacao: "Acompanhar confirmação por ultrassom.",
    status: "Em acompanhamento"
  })],
  producao: [record("producao", "1", {
    animal_lote: "Lote Ordenha 02",
    produto: "Leite",
    quantidade: "320",
    unidade: "litros",
    media: "26.7",
    tendencia: "Alta",
    data: "2026-05-30",
    observacao: "Coleta matinal acima da média."
  })],
  pastagens: [record("pastagens", "1", {
    piquete: "Piquete 04",
    lote: "Novilhas",
    area_ha: "3.5",
    lotacao_hectare: "2.1",
    dias_uso: "4",
    dias_descanso: "28",
    rotacao: "Automática semanal",
    status: "Em descanso"
  })]
};
function record(module, id, payload) {
  return {
    id: `demo-pecuaria-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  };
}
function emptyPayload(module) {
  return Object.fromEntries(module.fields.map((field) => [field.key, ""]));
}
function numberValue(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
function exportXlsx(module, records) {
  const header = module.fields.map((field) => field.label);
  const rows = records.map((recordItem) => module.fields.map((field) => recordItem.payload[field.key] ?? ""));
  exportRowsToXlsx(`nery-pecuaria-${module.id}`, header, rows, module.shortLabel);
}
function PecuariaPage() {
  const {
    demoMode
  } = useDemoMode();
  const [period, setPeriod] = reactExports.useState(defaultPeriod());
  const [tab, setTab] = reactExports.useState("visao-geral");
  const current = modules.find((module) => module.id === tab);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-8 py-6 max-w-[1600px] mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Pecuária / Animais" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: demoMode ? "Modo DEMO ligado: exemplos protegidos contra edição." : "Modo DEMO desligado: salvando registros reais no Supabase." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PeriodPicker, { value: period, onChange: setPeriod })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab("visao-geral"), className: cn("min-h-16 rounded-lg border p-3 text-left text-sm font-medium transition-colors", tab === "visao-geral" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-clamp-2 leading-snug", children: "Visão Geral" })
      ] }) }),
      modules.map((module) => {
        const active = module.id === tab;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab(module.id), className: cn("min-h-16 rounded-lg border p-3 text-left text-sm font-medium transition-colors", active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(module.icon, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-clamp-2 leading-snug", children: module.shortLabel })
        ] }) }, module.id);
      })
    ] }),
    tab === "visao-geral" && /* @__PURE__ */ jsxRuntimeExports.jsx(PecuariaDashboard, { demoMode }),
    current && /* @__PURE__ */ jsxRuntimeExports.jsx(ModuleTab, { module: current })
  ] });
}
function PecuariaDashboard({
  demoMode
}) {
  const queries = useQuery({
    queryKey: ["operation-records", AREA, "dashboard", demoMode],
    queryFn: async () => {
      const all = await Promise.all(modules.map((module) => listOperationRecordsByAreaModule(AREA, module.id)));
      return Object.fromEntries(modules.map((module, index) => [module.id, all[index]]));
    },
    enabled: !demoMode,
    staleTime: 3e4,
    refetchOnWindowFocus: false
  });
  const data = demoMode ? demoByModule : queries.data ?? {};
  const animais = data.animal?.length ?? 0;
  const vacinas = (data.vacinacao ?? []).filter((recordItem) => recordItem.payload.proxima_dose).length;
  const producao = (data.producao ?? []).reduce((sum, recordItem) => sum + numberValue(recordItem.payload.quantidade), 0);
  const piquetes = data.pastagens?.length ?? 0;
  const moduleVolume = modules.map((module) => ({
    label: module.shortLabel,
    valor: data[module.id]?.length ?? 0
  }));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { label: "Animais/Lotes", value: String(animais) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { label: "Vacinas próximas", value: String(vacinas), tone: "warning" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { label: "Produção registrada", value: String(producao), tone: "success" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { label: "Piquetes", value: String(piquetes), tone: "info" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold", children: "Registros por módulo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Volume cadastrado em cada frente da pecuária." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: moduleVolume, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)", vertical: false }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", fontSize: 11, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { allowDecimals: false, fontSize: 11, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "valor", fill: "var(--color-primary)", radius: [6, 6, 0, 0] })
      ] }) }) })
    ] })
  ] });
}
function Kpi({
  label,
  value,
  tone = "default"
}) {
  const toneClass = {
    default: "text-foreground",
    warning: "text-warning-foreground",
    success: "text-success",
    info: "text-primary"
  }[tone];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-1.5 text-2xl font-semibold ${toneClass}`, children: value })
  ] });
}
function exportAnimalXlsx(records) {
  const module = modules.find((item) => item.id === "animal");
  if (!module) return;
  const header = module.fields.map((field) => field.label);
  const rows = records.map((recordItem) => module.fields.map((field) => recordItem.payload[field.key] ?? ""));
  exportRowsToXlsx("nery-pecuaria-animais", header, rows, module.shortLabel);
}
function AnimalPdfLibrary({
  records,
  demoMode
}) {
  const [query, setQuery] = reactExports.useState("");
  const [progress, setProgress] = reactExports.useState(null);
  const pdfQuery = useQuery({
    queryKey: ["animal-pdfs"],
    queryFn: listAnimalPdfRecords,
    enabled: !demoMode,
    staleTime: 3e4,
    refetchOnWindowFocus: false
  });
  const filteredAnimals = records.filter((recordItem) => [recordItem.payload.identificacao, recordItem.payload.especie, recordItem.payload.raca, recordItem.payload.status].join(" ").toLowerCase().includes(query.toLowerCase()));
  const filteredPdfs = (pdfQuery.data ?? []).filter((item) => [item.animal_identifier, item.file_name, item.payload_snapshot?.especie, item.payload_snapshot?.raca].join(" ").toLowerCase().includes(query.toLowerCase()));
  const bulkPdf = async () => {
    if (!filteredAnimals.length) {
      toast.info("Nenhum animal encontrado para exportar.");
      return;
    }
    setProgress(0);
    for (const [index, animal] of filteredAnimals.entries()) {
      downloadAnimalPdf(animal);
      setProgress(Math.round((index + 1) / filteredAnimals.length * 100));
      await new Promise((resolve) => window.setTimeout(resolve, 180));
    }
    toast.success("Exportação em massa concluída.");
    window.setTimeout(() => setProgress(null), 1200);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 rounded-xl border border-border bg-background/60 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold", children: "Biblioteca de PDFs por Animal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Fichas versionadas por animal, busca, reemissão e exportação em massa." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: bulkPdf, className: "inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3.5 w-3.5" }),
          "Exportar PDFs"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => exportAnimalXlsx(filteredAnimals), className: "inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
          "Exportar Excel"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mb-3 flex h-10 max-w-md items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Buscar por identificação, espécie, raça ou status...", className: "min-w-0 flex-1 bg-transparent outline-none" })
    ] }),
    progress !== null && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-3 h-2 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-primary transition-all", style: {
      width: `${progress}%`
    } }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 lg:grid-cols-[1fr_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Fichas atuais" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-56 space-y-2 overflow-y-auto", children: [
          filteredAnimals.map((animal) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate font-medium", children: animal.payload.identificacao || "Animal sem identificação" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-xs text-muted-foreground", children: [animal.payload.especie, animal.payload.raca, animal.payload.status].filter(Boolean).join(" · ") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => downloadAnimalPdf(animal), className: "h-8 rounded-md border border-border px-2 text-xs hover:bg-muted", children: "Baixar" })
          ] }, animal.id)),
          filteredAnimals.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-8 text-center text-sm text-muted-foreground", children: "Nenhum animal encontrado." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Histórico salvo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-56 space-y-2 overflow-y-auto", children: [
          demoMode && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-border px-3 py-3 text-xs text-muted-foreground", children: "No DEMO, os PDFs são gerados localmente. O histórico salvo aparece no modo real." }),
          !demoMode && filteredPdfs.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate font-medium", children: item.animal_identifier }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "truncate text-xs text-muted-foreground", children: [
                "Versão ",
                item.version,
                " · ",
                new Date(item.created_at).toLocaleString("pt-BR")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => void downloadStoredAnimalPdf(item), className: "h-8 rounded-md border border-border px-2 text-xs hover:bg-muted", children: "Baixar" })
          ] }, item.id)),
          !demoMode && !pdfQuery.isLoading && filteredPdfs.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-8 text-center text-sm text-muted-foreground", children: "Nenhuma versão salva encontrada." })
        ] })
      ] })
    ] })
  ] });
}
function animalQrValue(recordItem) {
  return recordItem.payload.brinco_qr || recordItem.payload.identificacao || recordItem.payload.codigo || recordItem.id;
}
function exportAnimalQr(recordItem) {
  const canvas = document.getElementById(`animal-qr-${recordItem.id}`);
  if (!canvas) {
    toast.error("QR Code ainda nao esta pronto para exportar.");
    return;
  }
  const link = document.createElement("a");
  const safeName = animalQrValue(recordItem).replace(/[^a-zA-Z0-9_-]/g, "_");
  link.href = canvas.toDataURL("image/png");
  link.download = `qr-animal-${safeName}.png`;
  link.click();
}
function ModuleTab({
  module
}) {
  const {
    demoMode
  } = useDemoMode();
  const queryClient = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [payload, setPayload] = reactExports.useState(emptyPayload(module));
  const [qrRecord, setQrRecord] = reactExports.useState(null);
  const query = useQuery({
    queryKey: ["operation-records", AREA, module.id],
    queryFn: () => listOperationRecordsByAreaModule(AREA, module.id),
    enabled: !demoMode,
    staleTime: 3e4,
    refetchOnWindowFocus: false
  });
  const records = reactExports.useMemo(() => demoMode ? demoByModule[module.id] ?? [] : query.data ?? [], [demoMode, module.id, query.data]);
  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["operation-records", AREA, module.id]
    });
    void queryClient.invalidateQueries({
      queryKey: ["operation-records", AREA, "dashboard"]
    });
    void queryClient.invalidateQueries({
      queryKey: ["animal-pdfs"]
    });
    invalidateConnectedQueries(queryClient);
  };
  const regenerateAnimalPdf = async (recordItem) => {
    if (demoMode || module.id !== "animal") return;
    try {
      await saveAnimalPdfVersion(recordItem);
      toast.success("PDF do animal atualizado e salvo na biblioteca.");
      void queryClient.invalidateQueries({
        queryKey: ["animal-pdfs"]
      });
    } catch (error) {
      toast.error(error instanceof Error ? `Animal salvo, mas o PDF não foi salvo: ${error.message}` : "Animal salvo, mas o PDF não foi salvo.");
    }
  };
  const createMutation = useMutation({
    mutationFn: createOperationRecord,
    onSuccess: async (recordItem) => {
      toast.success("Registro adicionado.");
      setOpen(false);
      invalidate();
      await regenerateAnimalPdf(recordItem);
    },
    onError: (error) => toast.error(error.message)
  });
  const updateMutation = useMutation({
    mutationFn: updateOperationRecord,
    onSuccess: async (recordItem) => {
      toast.success("Registro atualizado.");
      setOpen(false);
      invalidate();
      await regenerateAnimalPdf(recordItem);
    },
    onError: (error) => toast.error(error.message)
  });
  const deleteMutation = useMutation({
    mutationFn: deleteOperationRecord,
    onSuccess: () => {
      toast.success("Registro excluído.");
      invalidate();
    },
    onError: (error) => toast.error(error.message)
  });
  const [pdfLoadingId, setPdfLoadingId] = reactExports.useState(null);
  const generateAnimalPdf = async (recordItem) => {
    if (demoMode) {
      toast.info("Desligue o modo DEMO para gerar e salvar PDFs.");
      return;
    }
    setPdfLoadingId(recordItem.id);
    try {
      const doc = new jsPDF({
        unit: "pt",
        format: "a4"
      });
      const ident = recordItem.payload.identificacao || recordItem.id.slice(0, 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Ficha do Animal — Nery Agro", 40, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Identificação: ${ident}`, 40, 75);
      doc.text(`Gerado em: ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")}`, 40, 92);
      doc.setDrawColor(200);
      doc.line(40, 102, 555, 102);
      let y = 125;
      module.fields.forEach((field) => {
        const value = recordItem.payload[field.key];
        if (!value) return;
        doc.setFont("helvetica", "bold");
        doc.text(`${field.label}:`, 40, y);
        doc.setFont("helvetica", "normal");
        const wrapped = doc.splitTextToSize(String(value), 380);
        doc.text(wrapped, 200, y);
        y += Math.max(18, wrapped.length * 14);
        if (y > 780) {
          doc.addPage();
          y = 50;
        }
      });
      const blob = doc.output("blob");
      const safeIdent = ident.replace(/[^a-zA-Z0-9_-]/g, "_");
      const path = `${recordItem.id}/${safeIdent}.pdf`;
      const {
        error: uploadError
      } = await supabase.storage.from("animal-pdfs").upload(path, blob, {
        contentType: "application/pdf",
        upsert: true
      });
      if (uploadError) throw new Error(uploadError.message);
      const {
        data: urlData
      } = supabase.storage.from("animal-pdfs").getPublicUrl(path);
      const pdfUrl = urlData.publicUrl;
      await updateMutation.mutateAsync({
        id: recordItem.id,
        payload: {
          ...recordItem.payload,
          pdf_url: pdfUrl
        }
      });
      window.open(pdfUrl, "_blank", "noopener");
      toast.success("PDF gerado e salvo na ficha do animal.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar PDF.");
    } finally {
      setPdfLoadingId(null);
    }
  };
  const beginCreate = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para cadastrar dados reais.");
    setEditing(null);
    setPayload(emptyPayload(module));
    setOpen(true);
  };
  const beginEdit = (recordItem) => {
    if (demoMode) return toast.info("Dados demo não podem ser editados.");
    setEditing(recordItem);
    setPayload({
      ...emptyPayload(module),
      ...recordItem.payload
    });
    setOpen(true);
  };
  const submit = () => {
    if (demoMode) return;
    if (editing) updateMutation.mutate({
      id: editing.id,
      payload
    });
    else createMutation.mutate({
      area: AREA,
      module: module.id,
      payload
    });
  };
  const importRows = async (rows) => {
    if (demoMode) return toast.info("Desligue o modo DEMO para importar dados reais.");
    for (const row of rows) {
      const created = await createOperationRecord({
        area: AREA,
        module: module.id,
        payload: row
      });
      if (module.id === "animal") await saveAnimalPdfVersion(created);
    }
    invalidate();
  };
  const loading = !demoMode && query.isLoading;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(module.icon, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: module.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: module.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ImportRecordsButton, { fields: module.fields, disabled: demoMode, onImport: importRows }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => records.length ? exportXlsx(module, records) : toast.info("Nenhum registro para exportar."), className: "h-9 rounded-lg border border-border px-3 text-sm flex items-center gap-2 hover:bg-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-3.5 h-3.5" }),
          "Exportar Excel"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: beginCreate, className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground inline-flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          "Adicionar"
        ] })
      ] })
    ] }),
    module.id === "animal" && /* @__PURE__ */ jsxRuntimeExports.jsx(AnimalPdfLibrary, { records, demoMode }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border text-left text-xs text-muted-foreground", children: [
        module.fields.slice(0, 6).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 pr-4 font-medium", children: field.label }, field.key)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right font-medium", children: "Ações" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
        loading && Array.from({
          length: 4
        }).map((_, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border last:border-0", children: [
          module.fields.slice(0, 6).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-24 animate-pulse rounded bg-muted" }) }, field.key)),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto h-3 w-16 animate-pulse rounded bg-muted" }) })
        ] }, `sk-${idx}`)),
        !loading && records.map((recordItem) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border last:border-0", children: [
          module.fields.slice(0, 6).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-4", children: recordItem.payload[field.key] || "-" }, field.key)),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
            module.id === "animal" && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setQrRecord(recordItem), className: "inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-xs hover:bg-muted", "aria-label": "Visualizar QR Code", title: "Visualizar e exportar QR Code", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { className: "h-3.5 w-3.5" }),
              "QR"
            ] }),
            module.id === "animal" && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
              if (recordItem.payload.pdf_url) {
                window.open(recordItem.payload.pdf_url, "_blank", "noopener");
              } else {
                void generateAnimalPdf(recordItem);
              }
            }, disabled: pdfLoadingId === recordItem.id, className: "inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-xs hover:bg-muted disabled:opacity-60", "aria-label": "Gerar PDF", title: recordItem.payload.pdf_url ? "Abrir PDF salvo" : "Gerar PDF", children: [
              pdfLoadingId === recordItem.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3.5 w-3.5" }),
              "PDF"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => beginEdit(recordItem), className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted", "aria-label": "Editar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
              if (demoMode) return toast.info("Dados demo não podem ser excluídos.");
              if (window.confirm("Excluir este registro?")) deleteMutation.mutate(recordItem.id);
            }, className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-muted", "aria-label": "Excluir", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] }) })
        ] }, recordItem.id)),
        !loading && records.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "py-10 text-center text-sm text-muted-foreground", children: "Nenhum registro real cadastrado neste módulo." }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[85vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editing ? "Editar registro" : "Adicionar registro" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: module.label })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: module.fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "grid gap-1.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
          field.label,
          field.hint && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1 text-[10px] opacity-70", children: [
            "(",
            field.hint,
            ")"
          ] })
        ] }),
        field.type === "textarea" ? /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: payload[field.key] ?? "", onChange: (event) => setPayload((current) => ({
          ...current,
          [field.key]: event.target.value
        })), className: "min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: field.type ?? "text", step: field.type === "number" ? "any" : void 0, value: payload[field.key] ?? "", onChange: (event) => setPayload((current) => ({
          ...current,
          [field.key]: event.target.value
        })), className: "h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }, field.key)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setOpen(false), className: "h-9 rounded-lg border border-border px-3 text-sm", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: submit, disabled: createMutation.isPending || updateMutation.isPending, className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60", children: "Salvar" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: Boolean(qrRecord), onOpenChange: (next) => !next && setQrRecord(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "QR Code do animal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: qrRecord?.payload.identificacao || qrRecord?.payload.brinco_qr || "Ficha animal" })
      ] }),
      qrRecord && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid justify-items-center gap-4 py-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-white p-4 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeCanvas, { id: `animal-qr-${qrRecord.id}`, value: animalQrValue(qrRecord), size: 220, level: "H", includeMargin: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-full truncate rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground", children: animalQrValue(qrRecord) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setQrRecord(null), className: "h-9 rounded-lg border border-border px-3 text-sm", children: "Fechar" }),
        qrRecord && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => exportAnimalQr(qrRecord), className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground", children: "Exportar PNG" })
      ] })
    ] }) })
  ] });
}
export {
  PecuariaPage as component
};
