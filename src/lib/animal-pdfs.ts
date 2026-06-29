import { supabase } from "@/integrations/supabase/client";
import type { OperationRecord } from "@/lib/supabase-operations";
import { downloadPdf, makeReportPdf } from "@/lib/pdf-utils";

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

const BUCKET = "animal-pdfs";

function identifier(record: OperationRecord) {
  return record.payload.identificacao || record.payload.brinco_qr || record.id;
}

export function createAnimalPdf(record: OperationRecord) {
  const payload = record.payload;
  return makeReportPdf({
    title: `Ficha Animal - ${identifier(record)}`,
    subtitle: `Gerada em ${new Date().toLocaleString("pt-BR")}`,
    metrics: [
      { label: "Espécie", value: payload.especie || "-" },
      { label: "Raça", value: payload.raca || "-" },
      { label: "Peso atual", value: payload.peso_atual ? `${payload.peso_atual} kg` : "-" },
      { label: "Status", value: payload.status || "-" },
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
          ["Linhagem", payload.linhagem || "-"],
        ],
      },
      {
        title: "Histórico e genealogia",
        head: ["Campo", "Informação"],
        body: [
          ["Histórico de pesagens", payload.historico_pesagens || "-"],
          ["Genealogia", payload.genealogia || "-"],
        ],
      },
    ],
  });
}

export function downloadAnimalPdf(record: OperationRecord) {
  downloadPdf(createAnimalPdf(record), `animal-${identifier(record)}.pdf`);
}

export async function listAnimalPdfRecords(): Promise<AnimalPdfRecord[]> {
  const { data, error } = await supabase
    .from("animal_pdf_records")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AnimalPdfRecord[];
}

export async function saveAnimalPdfVersion(
  record: OperationRecord,
  orgId: string,
): Promise<AnimalPdfRecord> {
  const animalIdentifier = identifier(record);
  const current = await listAnimalPdfRecords();
  const versions = current.filter((item) => item.animal_record_id === record.id);
  const version = versions.length + 1;
  const fileName = `animal-${animalIdentifier}-v${version}.pdf`.replace(/[^\w.-]+/g, "_");
  // Prefixo org_id → RLS de storage isola por empresa (bucket privado).
  const filePath = `${orgId}/${record.id}/${Date.now()}-${fileName}`;
  const blob = createAnimalPdf(record).output("blob");

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("animal_pdf_records")
    .insert({
      animal_record_id: record.id,
      animal_identifier: animalIdentifier,
      version,
      file_path: filePath,
      file_name: fileName,
      payload_snapshot: record.payload,
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

/** Sobe um PDF (gerado fora) no caminho isolado por empresa e devolve o path. */
export async function uploadAnimalPdfBlob(
  orgId: string,
  recordId: string,
  fileName: string,
  blob: Blob,
): Promise<string> {
  const path = `${orgId}/${recordId}/${fileName.replace(/[^\w.-]+/g, "_")}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "application/pdf", upsert: true });
  if (error) throw new Error(error.message);
  return path;
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
