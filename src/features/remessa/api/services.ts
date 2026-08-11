import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-utils";
import {
  createFieldRecord,
  deleteFieldRecord,
  listFieldRecords,
  updateFieldRecord,
  type FieldRecord,
} from "@/lib/supabase-field";

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
  const base = `${input.orgId}/remessa/${input.refId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(base, input.file, {
    contentType: input.file.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(error.message);

  // Miniatura: a galeria mostra tiles de ~150px e servia o ORIGINAL de até
  // 8 MB em cada um — 12 fotos eram dezenas de MB para exibir alguns milhares
  // de pixels. Falha ao gerar não derruba o upload: a galeria cai no original,
  // que é o que já acontecia.
  let thumbPath = "";
  try {
    const thumb = await compressImage(input.file, { maxDim: 320, quality: 0.7 });
    if (thumb.size < input.file.size) {
      const alvo = `${base}.thumb.jpg`;
      const { error: erroThumb } = await supabase.storage.from(BUCKET).upload(alvo, thumb, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (!erroThumb) thumbPath = alvo;
    }
  } catch {
    // sem miniatura; segue com o original
  }

  return createFieldRecord({
    module: PHOTO_MODULE,
    payload: {
      ref_id: input.refId,
      storage_path: base,
      thumb_path: thumbPath,
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
  /** Miniatura de 320px; vazio nas fotos anteriores a esta versão. */
  thumbPath: string;
  legenda: string;
  source: RemessaPhotoSource;
  createdAt?: string;
};

/**
 * Fotos salvas (module "remessa-photo"), mais recentes primeiro.
 * - `source` filtra por origem (romaneios vs caixas vazias); omitido = todas.
 * - `refId` filtra pela CARGA: é o que transforma o mural cronológico na prova
 *   daquele romaneio específico. Fotos antigas sem `ref_module` contam como
 *   "remessa".
 */
export async function listRemessaPhotos(
  filtro: { source?: RemessaPhotoSource; refId?: string; limit?: number } = {},
): Promise<RemessaPhoto[]> {
  // `refId` vai para o SERVIDOR: abrir a ficha de uma carga baixava a lista de
  // fotos da empresa inteira para exibir duas. O filtro por `source` fica no
  // cliente porque fotos antigas não têm `ref_module` e precisam contar como
  // "remessa" — regra que o banco não conhece.
  const records = await listFieldRecords(PHOTO_MODULE, {
    payloadEq: filtro.refId ? { chave: "ref_id", valor: filtro.refId } : undefined,
    limit: filtro.limit,
  });
  return records
    .filter((r) => r.payload.storage_path)
    .map((r) => ({
      id: r.id,
      refId: r.payload.ref_id ?? "",
      path: r.payload.storage_path,
      thumbPath: r.payload.thumb_path ?? "",
      legenda: r.payload.legenda ?? "",
      source: (r.payload.ref_module as RemessaPhotoSource) || "remessa",
      createdAt: r.created_at,
    }))
    .filter((p) => !filtro.source || p.source === filtro.source)
    .filter((p) => !filtro.refId || p.refId === filtro.refId);
}

/** Remove a foto do Storage e depois o registro (mesma ordem do RDC). */
export async function deleteRemessaPhoto(
  photo: Pick<RemessaPhoto, "id" | "path"> & { thumbPath?: string },
): Promise<void> {
  // A miniatura sai junto, senão vira lixo órfão no bucket.
  const alvos = [photo.path, photo.thumbPath].filter(Boolean) as string[];
  if (alvos.length) await supabase.storage.from(BUCKET).remove(alvos);
  await deleteFieldRecord(photo.id);
}

export async function updateRemessaPhotoLegenda(
  photo: RemessaPhoto,
  legenda: string,
): Promise<FieldRecord> {
  return updateFieldRecord({
    id: photo.id,
    payload: {
      ref_id: photo.refId,
      storage_path: photo.path,
      legenda,
      ref_module: photo.source,
    },
  });
}
