import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { R as Root, P as Portal, a as Content, C as Close, T as Title, D as Description, O as Overlay } from "../_libs/radix-ui__react-dialog.mjs";
import { c as cn } from "./router-D1uahgUG.mjs";
import { af as Upload, ad as TriangleAlert, q as CircleCheck, ak as X } from "../_libs/lucide-react.mjs";
import { r as readSheet } from "../_libs/read-excel-file.mjs";
const Dialog = Root;
const DialogPortal = Portal;
const DialogOverlay = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = Overlay.displayName;
const DialogContent = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = Content.displayName;
const DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className), ...props });
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
const DialogTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = Title.displayName;
const DialogDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = Description.displayName;
function normalize(value) {
  return value.trim().toLowerCase().normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function cellToString(value) {
  if (value === void 0 || value === null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}
function detectDelimiter(line) {
  const comma = (line.match(/,/g) ?? []).length;
  const semicolon = (line.match(/;/g) ?? []).length;
  return semicolon > comma ? ";" : ",";
}
function parseCsv(text) {
  const rows = [];
  const delimiter = detectDelimiter(text.split(/\r?\n/)[0] ?? "");
  let cell = "";
  let row = [];
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}
function buildAliasMap(fields) {
  const aliases = /* @__PURE__ */ new Map();
  fields.forEach((field) => {
    aliases.set(normalize(field.key), field.key);
    aliases.set(normalize(field.label), field.key);
  });
  return aliases;
}
function dateValue(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const br = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const [, day, month, year] = br;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().slice(0, 10);
}
function numberValue(value) {
  if (!value) return "";
  const normalizedValue = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? String(parsed) : value;
}
function validateValue(field, value) {
  if (!value) return null;
  if (field.type === "number") {
    const normalizedValue = value.replace(/\./g, "").replace(",", ".");
    return Number.isFinite(Number(normalizedValue)) ? null : "Número inválido";
  }
  if (field.type === "date") {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateValue(value)) ? null : "Data inválida";
  }
  if (field.type === "gps" && value && !/^-?\d+([.,]\d+)?\s*,\s*-?\d+([.,]\d+)?$/.test(value)) {
    return "GPS deve estar em latitude,longitude";
  }
  return null;
}
function buildPayloads({
  headers,
  dataRows,
  mapping,
  fields
}) {
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const issues = [];
  const payloads = dataRows.map((row, rowIndex) => {
    const payload = Object.fromEntries(fields.map((field) => [field.key, ""]));
    headers.forEach((_, index) => {
      const key = mapping[index];
      const field = fieldsByKey.get(key);
      if (!field) return;
      const raw = cellToString(row[index]);
      const prepared = field.type === "number" ? numberValue(raw) : field.type === "date" ? dateValue(raw) : raw;
      const issue = validateValue(field, prepared);
      if (issue) issues.push({ row: rowIndex + 2, field: field.label, message: issue });
      payload[key] = prepared;
    });
    return payload;
  }).filter((row) => Object.values(row).some((value) => value.trim() !== ""));
  return { payloads, issues };
}
function ImportRecordsButton({
  fields,
  disabled,
  className,
  onImport
}) {
  const inputRef = reactExports.useRef(null);
  const [open, setOpen] = reactExports.useState(false);
  const [step, setStep] = reactExports.useState("map");
  const [headers, setHeaders] = reactExports.useState([]);
  const [dataRows, setDataRows] = reactExports.useState([]);
  const [mapping, setMapping] = reactExports.useState({});
  const [importing, setImporting] = reactExports.useState(false);
  const aliases = reactExports.useMemo(() => buildAliasMap(fields), [fields]);
  const { payloads, issues } = reactExports.useMemo(
    () => buildPayloads({ headers, dataRows, mapping, fields }),
    [dataRows, fields, headers, mapping]
  );
  const mappedCount = Object.values(mapping).filter(Boolean).length;
  const parseFile = async (file) => {
    const lowerName = file.name.toLowerCase();
    const matrix = lowerName.endsWith(".csv") || file.type.includes("csv") ? parseCsv(await file.text()) : await readSheet(file);
    const [headerRow, ...rows] = matrix;
    const parsedHeaders = (headerRow ?? []).map((header) => cellToString(header));
    const nextMapping = Object.fromEntries(
      parsedHeaders.map((header, index) => [index, aliases.get(normalize(header)) ?? ""])
    );
    if (!parsedHeaders.length || !rows.length) {
      toast.info("A planilha precisa ter cabeçalho e pelo menos uma linha de dados.");
      return;
    }
    setHeaders(parsedHeaders);
    setDataRows(rows);
    setMapping(nextMapping);
    setStep("map");
    setOpen(true);
  };
  const confirm = async () => {
    if (issues.length) {
      toast.error("Corrija o mapeamento ou os valores inválidos antes de importar.");
      return;
    }
    if (!payloads.length || mappedCount === 0) {
      toast.error("Mapeie pelo menos uma coluna com dados para importar.");
      return;
    }
    setImporting(true);
    try {
      await onImport(payloads);
      toast.success(`${payloads.length} registros importados.`);
      setOpen(false);
      setHeaders([]);
      setDataRows([]);
      setMapping({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao importar registros.");
    } finally {
      setImporting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => {
          if (disabled) {
            toast.info("Desligue o modo DEMO para importar dados reais.");
            return;
          }
          inputRef.current?.click();
        },
        className: className ?? "flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-muted",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3.5 w-3.5" }),
          "Importar"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: inputRef,
        type: "file",
        accept: ".csv,.xlsx",
        className: "hidden",
        onChange: (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void parseFile(file);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[88vh] max-w-5xl overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Importar planilha" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Mapeie as colunas, confira a validação e salve os registros na aba atual." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: cn(
              "rounded-md border px-2 py-1",
              step === "map" ? "border-primary bg-primary/10 text-primary" : "border-border"
            ),
            children: "1. Mapeamento"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: cn(
              "rounded-md border px-2 py-1",
              step === "preview" ? "border-primary bg-primary/10 text-primary" : "border-border"
            ),
            children: "2. Validação e prévia"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-md border border-border px-2 py-1", children: [
          payloads.length,
          " linhas detectadas"
        ] })
      ] }),
      step === "map" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-lg border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border text-left text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-medium", children: "Coluna da planilha" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-medium", children: "Exemplo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-medium", children: "Campo da aba" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: headers.map((header, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border last:border-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-medium", children: header || `Coluna ${index + 1}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "max-w-[220px] truncate px-3 py-2 text-muted-foreground", children: cellToString(dataRows[0]?.[index]) || "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: mapping[index] ?? "",
              onChange: (event) => setMapping((current) => ({ ...current, [index]: event.target.value })),
              className: "h-9 w-full rounded-md border border-border bg-background px-2 text-sm",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Ignorar coluna" }),
                fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: field.key, children: [
                  field.label,
                  field.type ? ` (${field.type})` : ""
                ] }, field.key))
              ]
            }
          ) })
        ] }, `${header}-${index}`)) })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              issues.length ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-success/30 bg-success/10 text-success"
            ),
            children: [
              issues.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }),
              issues.length ? `${issues.length} problema(s) encontrados.` : "Mapeamento validado e pronto para salvar."
            ]
          }
        ),
        issues.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-36 overflow-y-auto rounded-lg border border-border", children: issues.slice(0, 30).map((issue, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "border-b border-border px-3 py-2 text-xs last:border-0",
            children: [
              "Linha ",
              issue.row,
              " · ",
              issue.field,
              ": ",
              issue.message
            ]
          },
          `${issue.row}-${issue.field}-${index}`
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-lg border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-b border-border text-left text-xs text-muted-foreground", children: fields.slice(0, 7).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-medium", children: field.label }, field.key)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: payloads.slice(0, 10).map((row, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-b border-border last:border-0", children: fields.slice(0, 7).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "max-w-[180px] truncate px-3 py-2", children: row[field.key] || "-" }, field.key)) }, index)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setOpen(false),
            className: "h-9 rounded-lg border border-border px-3 text-sm",
            children: "Cancelar"
          }
        ),
        step === "preview" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setStep("map"),
            className: "h-9 rounded-lg border border-border px-3 text-sm",
            children: "Voltar"
          }
        ),
        step === "map" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setStep("preview"),
            disabled: mappedCount === 0,
            className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60",
            children: "Validar prévia"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: confirm,
            disabled: importing || issues.length > 0 || !payloads.length,
            className: "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60",
            children: [
              "Importar ",
              payloads.length,
              " registros"
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  Dialog as D,
  ImportRecordsButton as I,
  DialogContent as a,
  DialogDescription as b,
  DialogFooter as c,
  DialogHeader as d,
  DialogTitle as e
};
