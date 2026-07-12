import { supabase } from "@/integrations/supabase/client";
import { createFieldRecord, type FieldRecord } from "@/lib/supabase-field";

// Foto do romaneio como prova/anexo. Reusa o bucket privado org-isolado
// `rdc-photos` (RLS por 1º segmento do path = org_id), sob o prefixo `remessa/`.
// Não precisa de bucket/migração nova.
const BUCKET = "rdc-photos";

export async function uploadRemessaPhoto(input: {
  orgId: string;
  refId: string; // id do registro de remessa/apontamento
  file: File;
  legenda?: string;
}): Promise<FieldRecord> {
  const safe = input.file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${input.orgId}/remessa/${input.refId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    contentType: input.file.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return createFieldRecord({
    module: "remessa-photo",
    payload: { ref_id: input.refId, storage_path: path, legenda: input.legenda ?? "" },
  });
}

export async function getRemessaPhotoUrl(path: string, ttlSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSeconds);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
