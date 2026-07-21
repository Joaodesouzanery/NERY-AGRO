import { supabase } from "@/integrations/supabase/client";
import { assertNotDemo } from "@/lib/demo-context";
import { downloadPdf, makeReportPdf, type PdfTableRow } from "@/lib/pdf-utils";

// Biblioteca de fichas em PDF por animal: gera, versiona e guarda no bucket
// privado `animal-pdfs` (isolado por org via 1º segmento do path).
//
// Neutro em relação ao domínio: recebe a ficha já montada (métricas + seções),
// não a linha crua de nenhuma tabela. Assim serve tanto ao módulo pec_* quanto
// a qualquer outra origem, sem prender a lib a um schema.

export type AnimalPdfRecord = {
  id: string;
  animal_record_id: string;
  animal_identifier: string;
  version: number;
  file_path: string;
  file_name: string;
  payload_snapshot: Record<string, string>;
  created_at: string;
};

/** Ficha pronta para virar PDF. `snapshot` é o que fica gravado como histórico. */
export type AnimalPdfInput = {
  animalId: string;
  identificador: string;
  snapshot: Record<string, string>;
  metrics: Array<{ label: string; value: string }>;
  sections: Array<{ title: string; head: string[]; body: PdfTableRow[] }>;
};

const BUCKET = "animal-pdfs";

export function createAnimalPdf(input: AnimalPdfInput) {
  return makeReportPdf({
    title: `Ficha Animal - ${input.identificador}`,
    subtitle: `Gerada em ${new Date().toLocaleString("pt-BR")}`,
    metrics: input.metrics,
    sections: input.sections,
  });
}

export function downloadAnimalPdf(input: AnimalPdfInput) {
  downloadPdf(createAnimalPdf(input), `animal-${input.identificador}.pdf`);
}

export async function listAnimalPdfRecords(animalId?: string): Promise<AnimalPdfRecord[]> {
  let query = supabase
    .from("animal_pdf_records")
    .select("*")
    .order("created_at", { ascending: false });
  if (animalId) query = query.eq("animal_record_id", animalId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as AnimalPdfRecord[];
}

/** Gera o PDF, sobe no storage e registra a versão (v1, v2, …). */
export async function saveAnimalPdfVersion(
  input: AnimalPdfInput,
  orgId: string,
): Promise<AnimalPdfRecord> {
  // Nunca grava PDF real (Storage + tabela) no modo DEMO — mesma trava dos demais
  // writes. Sem isso, uma sessão de demonstração poluía o bucket/tabela reais.
  assertNotDemo();
  const anteriores = await listAnimalPdfRecords(input.animalId);
  const version = anteriores.length + 1;
  const fileName = `animal-${input.identificador}-v${version}.pdf`.replace(/[^\w.-]+/g, "_");
  // Prefixo org_id → RLS de storage isola por empresa (bucket privado).
  const filePath = `${orgId}/${input.animalId}/${Date.now()}-${fileName}`;
  const blob = createAnimalPdf(input).output("blob");

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("animal_pdf_records")
    .insert({
      animal_record_id: input.animalId,
      animal_identifier: input.identificador,
      version,
      file_path: filePath,
      file_name: fileName,
      payload_snapshot: input.snapshot,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as AnimalPdfRecord;
}

export async function downloadStoredAnimalPdf(record: AnimalPdfRecord) {
  const { data, error } = await supabase.storage.from(BUCKET).download(record.file_path);
  if (error) throw new Error(error.message);
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = record.file_name;
  link.click();
  URL.revokeObjectURL(url);
}

/** URL assinada (temporária) para abrir um PDF privado de animal. */
export async function getSignedAnimalPdfUrl(
  path: string,
  ttlSeconds = 3600,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSeconds);
  return data?.signedUrl ?? null;
}
