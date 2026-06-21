import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { O as OperationAreaPage } from "./operation-area-crud-DLgh87g5.mjs";
import "../_libs/sonner.mjs";
import { a3 as ShieldCheck, r as ClipboardList, M as Leaf, Q as MapPin, C as Calculator } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./connected-agro-data-B5gpgC4B.mjs";
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
import "./router-D1uahgUG.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
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
import "./import-records-button-BiVLSQbM.mjs";
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
import "./period-picker-BtQVPyDA.mjs";
import "../_libs/radix-ui__react-popover.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "./export-xlsx-CRIENmK4.mjs";
import "../_libs/xlsx.mjs";
import "../_libs/recharts.mjs";
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
const AREA = "sustentabilidade";
const modules = [{
  id: "certificacoes",
  label: "Certificações",
  shortLabel: "Certificações",
  description: "Checklist de certificação orgânica, auditoria, validade e status.",
  icon: ShieldCheck,
  fields: [{
    key: "certificacao",
    label: "Certificação"
  }, {
    key: "checklist",
    label: "Checklist orgânico",
    type: "textarea"
  }, {
    key: "auditor",
    label: "Auditor"
  }, {
    key: "validade",
    label: "Validade",
    type: "date"
  }, {
    key: "pendencias",
    label: "Pendências",
    type: "textarea"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "agroecologia",
  label: "Caderno de Campo para Agroecologia",
  shortLabel: "Agroecologia",
  description: "Práticas agroecológicas, insumos naturais, observações e evidências.",
  icon: ClipboardList,
  fields: [{
    key: "data",
    label: "Data",
    type: "date"
  }, {
    key: "area",
    label: "Área/Talhão"
  }, {
    key: "pratica",
    label: "Prática"
  }, {
    key: "insumos_naturais",
    label: "Insumos naturais",
    type: "textarea"
  }, {
    key: "observacoes",
    label: "Observações",
    type: "textarea"
  }, {
    key: "evidencia_url",
    label: "Evidência URL"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "residuos",
  label: "Controle de Resíduos e Compostagem",
  shortLabel: "Resíduos",
  description: "Origem, volume, destino, lote de composto e maturação.",
  icon: Leaf,
  fields: [{
    key: "origem",
    label: "Origem"
  }, {
    key: "residuo",
    label: "Resíduo"
  }, {
    key: "volume",
    label: "Volume",
    type: "number"
  }, {
    key: "destino",
    label: "Destino"
  }, {
    key: "lote_composto",
    label: "Lote de composto"
  }, {
    key: "maturacao",
    label: "Maturação"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "apps",
  label: "Monitoramento de APPs e Limites",
  shortLabel: "APPs",
  description: "Área monitorada, coordenadas, ocorrência e ação corretiva.",
  icon: MapPin,
  fields: [{
    key: "area_monitorada",
    label: "Área monitorada"
  }, {
    key: "coordenadas",
    label: "Coordenadas/descrição",
    type: "textarea"
  }, {
    key: "ocorrencia",
    label: "Ocorrência"
  }, {
    key: "data",
    label: "Data",
    type: "date"
  }, {
    key: "acao_corretiva",
    label: "Ação corretiva",
    type: "textarea"
  }, {
    key: "responsavel",
    label: "Responsável"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "carbono",
  label: "Calculadora de Pegada de Carbono",
  shortLabel: "Carbono",
  description: "Atividade, fonte emissora, volume, fator estimado e CO₂e calculado.",
  icon: Calculator,
  fields: [{
    key: "atividade",
    label: "Atividade"
  }, {
    key: "fonte",
    label: "Fonte emissora"
  }, {
    key: "volume",
    label: "Volume",
    type: "number"
  }, {
    key: "fator",
    label: "Fator estimado",
    type: "number"
  }, {
    key: "co2e",
    label: "CO₂e calculado",
    type: "number"
  }, {
    key: "periodo",
    label: "Período"
  }, {
    key: "status",
    label: "Status"
  }]
}];
const demoByModule = {
  certificacoes: [record("certificacoes", "1", {
    certificacao: "Orgânico Brasil",
    checklist: "Manejo sem químicos sintéticos; rastreabilidade por lote; barreiras vegetais.",
    auditor: "Instituto Certifica",
    validade: "2026-11-20",
    pendencias: "Atualizar caderno de campo do Talhão B.",
    status: "Atenção"
  })],
  agroecologia: [record("agroecologia", "1", {
    data: "2026-05-28",
    area: "Talhão A",
    pratica: "Cobertura verde",
    insumos_naturais: "Composto maturado e biofertilizante.",
    observacoes: "Boa retenção de umidade após chuva.",
    evidencia_url: "",
    status: "Concluído"
  })],
  residuos: [record("residuos", "1", {
    origem: "Packing house",
    residuo: "Restos vegetais",
    volume: "840",
    destino: "Leira 03",
    lote_composto: "COMP-2026-05",
    maturacao: "45 dias",
    status: "Em maturação"
  })],
  apps: [record("apps", "1", {
    area_monitorada: "APP Nascente Norte",
    coordenadas: "-23.5512,-46.6334",
    ocorrencia: "Cerca danificada",
    data: "2026-05-29",
    acao_corretiva: "Reparo programado e registro fotográfico.",
    responsavel: "Equipe Campo",
    status: "Pendente"
  })],
  carbono: [record("carbono", "1", {
    atividade: "Transporte de cestas",
    fonte: "Diesel",
    volume: "180",
    fator: "2.68",
    co2e: "482.4",
    periodo: "Maio 2026",
    status: "Calculado"
  })]
};
function record(module, id, payload) {
  return {
    id: `demo-${AREA}-${module}-${id}`,
    area: AREA,
    module,
    payload,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  };
}
function SustentabilidadePage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(OperationAreaPage, { area: AREA, title: "Sustentabilidade", description: "Certificações, agroecologia, compostagem, APPs e carbono em uma rotina auditável.", modules, demoByModule });
}
export {
  SustentabilidadePage as component
};
