// Helpers puros de parsing/validação para importação de planilhas (CSV/XLSX).
// Extraídos de import-records-button.tsx para serem testáveis isoladamente.
import { localDateOf } from "@/lib/date-local";

export type ImportField = {
  key: string;
  label: string;
  type?: string;
  /** Linha sem este campo é recusada. Vem de CAMPOS_OBRIGATORIOS, via a config da aba. */
  required?: boolean;
};

export type ValidationIssue = {
  row: number;
  field: string;
  message: string;
};

export function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function cellToString(value: unknown) {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) return localDateOf(value.toISOString());
  return String(value).trim();
}

export function detectDelimiter(line: string) {
  const comma = (line.match(/,/g) ?? []).length;
  const semicolon = (line.match(/;/g) ?? []).length;
  return semicolon > comma ? ";" : ",";
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  const delimiter = detectDelimiter(text.split(/\r?\n/)[0] ?? "");
  let cell = "";
  let row: string[] = [];
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

// Converte o link de uma planilha do Google Sheets na URL de export CSV.
// A URL final é montada aqui a partir do ID sanitizado ([A-Za-z0-9_-]) — o
// servidor nunca busca a URL crua do usuário, o que fecharia a porta p/ SSRF.
export function parseGoogleSheetUrl(input: string): string | null {
  const trimmed = input.trim();
  const gid = trimmed.match(/[#?&]gid=(\d+)/)?.[1];
  // Planilha "publicada na web" (/d/e/<id>) tem endpoint próprio de CSV.
  const published = trimmed.match(
    /^https:\/\/docs\.google\.com\/spreadsheets\/(?:u\/\d+\/)?d\/e\/([A-Za-z0-9_-]{12,})/,
  );
  if (published) {
    const single = gid ? `&gid=${gid}&single=true` : "";
    return `https://docs.google.com/spreadsheets/d/e/${published[1]}/pub?output=csv${single}`;
  }
  const regular = trimmed.match(
    /^https:\/\/docs\.google\.com\/spreadsheets\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{12,})/,
  );
  if (regular) {
    const sheet = gid ? `&gid=${gid}` : "";
    return `https://docs.google.com/spreadsheets/d/${regular[1]}/export?format=csv${sheet}`;
  }
  return null;
}

export function buildAliasMap(fields: ImportField[]) {
  const aliases = new Map<string, string>();
  fields.forEach((field) => {
    aliases.set(normalize(field.key), field.key);
    aliases.set(normalize(field.label), field.key);
  });
  return aliases;
}

export function dateValue(value: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const br = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const [, day, month, year] = br;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : localDateOf(parsed.toISOString());
}

export function numberValue(value: string) {
  if (!value) return "";
  const normalizedValue = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? String(parsed) : value;
}

export function validateValue(field: ImportField, value: string): string | null {
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

export function buildPayloads({
  headers,
  dataRows,
  mapping,
  fields,
}: {
  headers: string[];
  dataRows: unknown[][];
  mapping: Record<number, string>;
  fields: ImportField[];
}) {
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const issues: ValidationIssue[] = [];
  const payloads = dataRows
    .map((row, rowIndex) => {
      const payload = Object.fromEntries(fields.map((field) => [field.key, ""])) as Record<
        string,
        string
      >;
      headers.forEach((_, index) => {
        const key = mapping[index];
        const field = fieldsByKey.get(key);
        if (!field) return;
        const raw = cellToString(row[index]);
        const prepared =
          field.type === "number" ? numberValue(raw) : field.type === "date" ? dateValue(raw) : raw;
        const issue = validateValue(field, prepared);
        if (issue) issues.push({ row: rowIndex + 2, field: field.label, message: issue });
        payload[key] = prepared;
      });
      // `validateValue` só olha valor PRESENTE (devolve null quando vazio),
      // então planilha sem a coluna do campo-chave passava batido e virava
      // registro fantasma — um veículo sem placa, que ninguém acha depois.
      fields.forEach((field) => {
        if (field.required && !payload[field.key]?.trim()) {
          issues.push({ row: rowIndex + 2, field: field.label, message: "obrigatório" });
        }
      });
      return payload;
    })
    .filter((row) => Object.values(row).some((value) => value.trim() !== ""));
  return { payloads, issues };
}
