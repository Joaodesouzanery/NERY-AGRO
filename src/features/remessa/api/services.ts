import { supabase } from "@/integrations/supabase/client";
import { createFieldRecord, listFieldRecords, type FieldRecord } from "@/lib/supabase-field";

// Foto do romaneio como prova/anexo. Reusa o bucket privado org-isolado
// `rdc-photos` (RLS por 1º segmento do path = org_id), sob o prefixo `remessa/`.
// Não precisa de bucket/migração nova.
const BUCKET = "rdc-photos";
const PHOTO_MODULE = "remessa-photo";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB (mesmo teto do RDC)

// Origem da foto (para separar a galeria de romaneios da de caixas vazias).
export type RemessaPhotoSource = "remessa" | "caixas-vazias";

export async function uploadRemessaPhoto(input: {
  orgId: string;
  refId: string; // id do registro de remessa/apontamento
  file: File;
  legenda?: string;
  refModule?: RemessaPhotoSource; // origem (default "remessa")
}): Promise<FieldRecord> {
  // Valida no serviço (não só na UI): todo caller fica protegido de tipo/tamanho
  // inválido subindo ao Storage. `accept="image/*"` no input é só dica visual.
  if (!input.file.type.startsWith("image/")) {
    throw new Error("Envie uma imagem (JPG/PNG). Este arquivo não é uma imagem.");
  }
  if (input.file.size > MAX_PHOTO_BYTES) {
    throw new Error("Imagem maior que 8 MB. Reduza o tamanho e tente novamente.");
  }
  const safe = input.file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${input.orgId}/remessa/${input.refId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    contentType: input.file.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return createFieldRecord({
    module: PHOTO_MODULE,
    payload: {
      ref_id: input.refId,
      storage_path: path,
      legenda: input.legenda ?? "",
      ref_module: input.refModule ?? "remessa",
    },
  });
}

export async function getRemessaPhotoUrl(path: string, ttlSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSeconds);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export type RemessaPhoto = {
  id: string;
  refId: string;
  path: string;
  legenda: string;
  source: RemessaPhotoSource;
  createdAt?: string;
};

/**
 * Fotos salvas (module "remessa-photo"), mais recentes primeiro. `source` filtra
 * por origem (romaneios vs caixas vazias); omitido = todas. Fotos antigas sem
 * `ref_module` contam como "remessa".
 */
export async function listRemessaPhotos(source?: RemessaPhotoSource): Promise<RemessaPhoto[]> {
  const records = await listFieldRecords(PHOTO_MODULE); // já vem ordenado desc
  return records
    .filter((r) => r.payload.storage_path)
    .map((r) => ({
      id: r.id,
      refId: r.payload.ref_id ?? "",
      path: r.payload.storage_path,
      legenda: r.payload.legenda ?? "",
      source: (r.payload.ref_module as RemessaPhotoSource) || "remessa",
      createdAt: r.created_at,
    }))
    .filter((p) => !source || p.source === source);
}
