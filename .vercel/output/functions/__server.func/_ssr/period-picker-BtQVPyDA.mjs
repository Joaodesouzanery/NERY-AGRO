import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { R as Root2, T as Trigger, P as Portal, C as Content2 } from "../_libs/radix-ui__react-popover.mjs";
import { c as cn } from "./router-D1uahgUG.mjs";
import { h as Calendar, l as ChevronDown } from "../_libs/lucide-react.mjs";
const Popover = Root2;
const PopoverTrigger = Trigger;
const PopoverContent = reactExports.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = Content2.displayName;
const presets = [
  { id: "diario", label: "Diário", hint: "Hoje" },
  { id: "semanal", label: "Semanal", hint: "Últimos 7 dias" },
  { id: "mensal", label: "Mensal", hint: "Este mês" },
  { id: "custom", label: "Período selecionado", hint: "Escolher intervalo" }
];
function todayIso() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function daysAgoIso(days) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function monthStartIso() {
  const d = /* @__PURE__ */ new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}
function defaultPeriod() {
  return {
    granularity: "mensal",
    start: monthStartIso(),
    end: todayIso(),
    label: "Este mês"
  };
}
function PeriodPicker({
  value,
  onChange,
  className
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [customStart, setCustomStart] = reactExports.useState(value.start ?? monthStartIso());
  const [customEnd, setCustomEnd] = reactExports.useState(value.end ?? todayIso());
  const choose = (g) => {
    if (g === "diario") {
      const d = todayIso();
      onChange({ granularity: g, start: d, end: d, label: "Hoje" });
      setOpen(false);
    } else if (g === "semanal") {
      onChange({
        granularity: g,
        start: daysAgoIso(6),
        end: todayIso(),
        label: "Últimos 7 dias"
      });
      setOpen(false);
    } else if (g === "mensal") {
      onChange({
        granularity: g,
        start: monthStartIso(),
        end: todayIso(),
        label: "Este mês"
      });
      setOpen(false);
    }
  };
  const applyCustom = () => {
    onChange({
      granularity: "custom",
      start: customStart,
      end: customEnd,
      label: `${formatBr(customStart)} – ${formatBr(customEnd)}`
    });
    setOpen(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: cn(
          "h-10 px-4 rounded-lg border border-border bg-card text-sm flex items-center gap-2 hover:bg-muted transition-colors",
          className
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: value.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-3.5 h-3.5 text-muted-foreground" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { align: "end", className: "w-72 p-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2", children: presets.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => choose(p.id),
          className: cn(
            "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors",
            value.granularity === p.id && "bg-muted"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: p.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: p.hint })
          ]
        },
        p.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border p-3 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-semibold tracking-wide text-muted-foreground", children: "INTERVALO PERSONALIZADO" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs text-muted-foreground", children: [
            "Início",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "date",
                value: customStart,
                onChange: (e) => setCustomStart(e.target.value),
                className: "mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs text-muted-foreground", children: [
            "Fim",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "date",
                value: customEnd,
                onChange: (e) => setCustomEnd(e.target.value),
                className: "mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: applyCustom,
            className: "w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium",
            children: "Aplicar período"
          }
        )
      ] })
    ] })
  ] });
}
function formatBr(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}
export {
  PeriodPicker as P,
  defaultPeriod as d
};
