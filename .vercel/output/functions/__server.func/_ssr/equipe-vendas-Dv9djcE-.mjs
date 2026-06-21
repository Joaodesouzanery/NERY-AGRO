import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { O as OperationAreaPage } from "./operation-area-crud-DLgh87g5.mjs";
import "../_libs/sonner.mjs";
import { H as HandCoins, ag as Users, a6 as SquareCheckBig } from "../_libs/lucide-react.mjs";
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
const AREA = "equipe-vendas";
const modules = [{
  id: "vendas",
  label: "Vendas Diretas e Clientes",
  shortLabel: "Vendas",
  description: "Cadastro de clientes, canal de venda, pedidos e valor por venda.",
  icon: HandCoins,
  fields: [{
    key: "cliente",
    label: "Cliente"
  }, {
    key: "canal",
    label: "Canal (WhatsApp, Feira, Loja...)"
  }, {
    key: "produto",
    label: "Produto/Lote"
  }, {
    key: "quantidade",
    label: "Quantidade",
    type: "number"
  }, {
    key: "valor",
    label: "Valor",
    type: "number"
  }, {
    key: "data",
    label: "Data",
    type: "date"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "mao_de_obra",
  label: "Gestão de Mão de Obra e Equipe",
  shortLabel: "Mão de Obra",
  description: "Diárias, tarefas atribuídas e custo de mão de obra por colaborador.",
  icon: Users,
  fields: [{
    key: "colaborador",
    label: "Colaborador"
  }, {
    key: "funcao",
    label: "Função"
  }, {
    key: "atividade",
    label: "Atividade"
  }, {
    key: "data",
    label: "Data",
    type: "date"
  }, {
    key: "horas",
    label: "Horas trabalhadas",
    type: "number"
  }, {
    key: "mao_obra",
    label: "Custo (mão de obra)",
    type: "number"
  }, {
    key: "status",
    label: "Status"
  }]
}, {
  id: "tarefas",
  label: "To-Do List da Operação",
  shortLabel: "Tarefas",
  description: "Tarefas prioritárias do dia, responsável, prazo e status.",
  icon: SquareCheckBig,
  fields: [{
    key: "tarefa",
    label: "Tarefa"
  }, {
    key: "responsavel",
    label: "Responsável"
  }, {
    key: "prioridade",
    label: "Prioridade (Alta/Média/Baixa)"
  }, {
    key: "prazo",
    label: "Prazo",
    type: "date"
  }, {
    key: "status",
    label: "Status"
  }]
}];
const demoByModule = {
  vendas: [record("vendas", "1", {
    cliente: "Feira Municipal Centro",
    canal: "Feira",
    produto: "Caixa de tomate orgânico",
    quantidade: "40",
    valor: "1280",
    data: "2026-06-10",
    status: "Concluída"
  }), record("vendas", "2", {
    cliente: "Maria Oliveira",
    canal: "WhatsApp",
    produto: "Cesta agroecológica",
    quantidade: "8",
    valor: "640",
    data: "2026-06-12",
    status: "Aguardando entrega"
  })],
  mao_de_obra: [record("mao_de_obra", "1", {
    colaborador: "José Almeida",
    funcao: "Operador de campo",
    atividade: "Colheita Talhão B",
    data: "2026-06-14",
    horas: "8",
    mao_obra: "240",
    status: "Concluída"
  })],
  tarefas: [record("tarefas", "1", {
    tarefa: "Revisar irrigação do Talhão A",
    responsavel: "Equipe Campo",
    prioridade: "Alta",
    prazo: "2026-06-18",
    status: "Pendente"
  }), record("tarefas", "2", {
    tarefa: "Confirmar entrega da feira",
    responsavel: "Logística",
    prioridade: "Média",
    prazo: "2026-06-17",
    status: "Em andamento"
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
function EquipeVendasPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(OperationAreaPage, { area: AREA, title: "Equipe & Vendas", description: "Vendas diretas, clientes, mão de obra e tarefas prioritárias conectadas ao restante da operação.", modules, demoByModule });
}
export {
  EquipeVendasPage as component
};
