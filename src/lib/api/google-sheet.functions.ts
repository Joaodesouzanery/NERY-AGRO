import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { parseGoogleSheetUrl } from "@/lib/import-parsing";

// Busca o CSV de uma planilha do Google Sheets pelo servidor — o endpoint de
// export do Google não envia CORS, então o navegador não consegue direto.
// Só buscamos a URL montada por parseGoogleSheetUrl (ID sanitizado), nunca a
// URL crua do usuário.

const MAX_CSV_BYTES = 5 * 1024 * 1024;

const ERRO_ACESSO =
  "A planilha não está acessível. Em Compartilhar, marque 'Qualquer pessoa com o link' e tente de novo.";

export const fetchGoogleSheetCsv = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string().trim().min(1) }))
  .handler(async ({ data }) => {
    const csvUrl = parseGoogleSheetUrl(data.url);
    if (!csvUrl) {
      throw new Error(
        "Link inválido. Cole o endereço de uma planilha do Google Sheets (docs.google.com/spreadsheets/…).",
      );
    }

    let response: Response;
    try {
      response = await fetch(csvUrl, { redirect: "follow" });
    } catch {
      throw new Error(
        "Não foi possível acessar o Google Sheets agora. Tente de novo em instantes.",
      );
    }

    // Planilha privada não vira 403: o Google redireciona para a página de
    // login (HTML, status 200). Content-type é o sinal confiável.
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || contentType.includes("text/html")) throw new Error(ERRO_ACESSO);

    const csv = await response.text();
    if (csv.length > MAX_CSV_BYTES) {
      throw new Error("Planilha grande demais para importar (limite de 5 MB).");
    }
    if (!csv.trim() || csv.trimStart().startsWith("<")) throw new Error(ERRO_ACESSO);
    return { csv };
  });
