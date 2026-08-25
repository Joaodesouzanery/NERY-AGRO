import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Link2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
// v9: the default export returns ALL sheets ([{ sheet, data }]); `readSheet`
// returns the rows of a single sheet, which is what this importer expects.
import { readSheet } from "read-excel-file/browser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchGoogleSheetCsv } from "@/lib/api/google-sheet.functions";
import { cn } from "@/lib/utils";
import {
  buildAliasMap,
  buildPayloads,
  cellToString,
  normalize,
  parseCsv,
  type ImportField,
} from "@/lib/import-parsing";

type ImportRecordsButtonProps = {
  fields: ImportField[];
  disabled?: boolean;
  className?: string;
  onImport: (rows: Record<string, string>[]) => unknown | Promise<unknown>;
};

type ImportStep = "map" | "preview";

export function ImportRecordsButton({
  fields,
  disabled,
  className,
  onImport,
}: ImportRecordsButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("map");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<unknown[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [importing, setImporting] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [fetchingSheet, setFetchingSheet] = useState(false);

  const aliases = useMemo(() => buildAliasMap(fields), [fields]);
  const { payloads, issues } = useMemo(
    () => buildPayloads({ headers, dataRows, mapping, fields }),
    [dataRows, fields, headers, mapping],
  );
  const mappedCount = Object.values(mapping).filter(Boolean).length;

  const ingestMatrix = (matrix: unknown[][]) => {
    const [headerRow, ...rows] = matrix;
    const parsedHeaders = (headerRow ?? []).map((header) => cellToString(header));

    if (!parsedHeaders.length || !rows.length) {
      toast.info("A planilha precisa ter cabeçalho e pelo menos uma linha de dados.");
      return false;
    }

    setHeaders(parsedHeaders);
    setDataRows(rows);
    setMapping(
      Object.fromEntries(
        parsedHeaders.map((header, index) => [index, aliases.get(normalize(header)) ?? ""]),
      ),
    );
    setStep("map");
    setOpen(true);
    return true;
  };

  const parseFile = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    const matrix: unknown[][] =
      lowerName.endsWith(".csv") || file.type.includes("csv")
        ? parseCsv(await file.text())
        : await readSheet(file);
    ingestMatrix(matrix);
  };

  const importFromGoogleSheet = async () => {
    setFetchingSheet(true);
    try {
      const { csv } = await fetchGoogleSheetCsv({ data: { url: sheetUrl } });
      if (ingestMatrix(parseCsv(csv))) {
        setLinkOpen(false);
        setSheetUrl("");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao buscar a planilha do Google Sheets.",
      );
    } finally {
      setFetchingSheet(false);
    }
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

  const triggerClassName =
    className ??
    "flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-muted";

  return (
    <>
      {disabled ? (
        <button
          type="button"
          onClick={() => toast.info("Desligue o modo DEMO para importar dados reais.")}
          className={triggerClassName}
        >
          <Upload className="h-3.5 w-3.5" />
          Importar
        </button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={triggerClassName}>
              <Upload className="h-3.5 w-3.5" />
              Importar
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Arquivo Excel/CSV
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLinkOpen(true)}>
              <Link2 className="mr-2 h-4 w-4" />
              Link do Google Sheets
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void parseFile(file);
        }}
      />

      <Dialog open={linkOpen} onOpenChange={(next) => !fetchingSheet && setLinkOpen(next)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar do Google Sheets</DialogTitle>
            <DialogDescription>
              Cole o link da planilha. Em Compartilhar, ela precisa estar como &quot;Qualquer pessoa
              com o link&quot;.
            </DialogDescription>
          </DialogHeader>
          <input
            value={sheetUrl}
            onChange={(event) => setSheetUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && sheetUrl.trim() && !fetchingSheet) {
                void importFromGoogleSheet();
              }
            }}
            placeholder="https://docs.google.com/spreadsheets/d/…"
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          />
          <DialogFooter>
            <button
              onClick={() => setLinkOpen(false)}
              disabled={fetchingSheet}
              className="h-9 rounded-lg border border-border px-3 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={() => void importFromGoogleSheet()}
              disabled={fetchingSheet || !sheetUrl.trim()}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {fetchingSheet ? "Buscando…" : "Buscar planilha"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar planilha</DialogTitle>
            <DialogDescription>
              Mapeie as colunas, confira a validação e salve os registros na aba atual.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 text-xs">
            <span
              className={cn(
                "rounded-md border px-2 py-1",
                step === "map" ? "border-primary bg-primary/10 text-primary" : "border-border",
              )}
            >
              1. Mapeamento
            </span>
            <span
              className={cn(
                "rounded-md border px-2 py-1",
                step === "preview" ? "border-primary bg-primary/10 text-primary" : "border-border",
              )}
            >
              2. Validação e prévia
            </span>
            <span className="rounded-md border border-border px-2 py-1">
              {payloads.length} linhas detectadas
            </span>
          </div>

          {step === "map" ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Coluna da planilha</th>
                    <th className="px-3 py-2 font-medium">Exemplo</th>
                    <th className="px-3 py-2 font-medium">Campo da aba</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((header, index) => (
                    <tr key={`${header}-${index}`} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium">{header || `Coluna ${index + 1}`}</td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-muted-foreground">
                        {cellToString(dataRows[0]?.[index]) || "-"}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={mapping[index] ?? ""}
                          onChange={(event) =>
                            setMapping((current) => ({ ...current, [index]: event.target.value }))
                          }
                          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                        >
                          <option value="">Ignorar coluna</option>
                          {fields.map((field) => (
                            <option key={field.key} value={field.key}>
                              {field.label}
                              {field.type ? ` (${field.type})` : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  issues.length
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-success/30 bg-success/10 text-success",
                )}
              >
                {issues.length ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {issues.length
                  ? `${issues.length} problema(s) encontrados.`
                  : "Mapeamento validado e pronto para salvar."}
              </div>
              {issues.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-border">
                  {issues.slice(0, 30).map((issue, index) => (
                    <div
                      key={`${issue.row}-${issue.field}-${index}`}
                      className="border-b border-border px-3 py-2 text-xs last:border-0"
                    >
                      Linha {issue.row} · {issue.field}: {issue.message}
                    </div>
                  ))}
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      {fields.slice(0, 7).map((field) => (
                        <th key={field.key} className="px-3 py-2 font-medium">
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payloads.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-b border-border last:border-0">
                        {fields.slice(0, 7).map((field) => (
                          <td key={field.key} className="max-w-[180px] truncate px-3 py-2">
                            {row[field.key] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="h-9 rounded-lg border border-border px-3 text-sm"
            >
              Cancelar
            </button>
            {step === "preview" && (
              <button
                onClick={() => setStep("map")}
                className="h-9 rounded-lg border border-border px-3 text-sm"
              >
                Voltar
              </button>
            )}
            {step === "map" ? (
              <button
                onClick={() => setStep("preview")}
                disabled={mappedCount === 0}
                className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                Validar prévia
              </button>
            ) : (
              <button
                onClick={confirm}
                disabled={importing || issues.length > 0 || !payloads.length}
                className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                Importar {payloads.length} registros
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
