import { supabase } from "@/integrations/supabase/client";
import { createFieldRecord, deleteFieldRecord, listFieldRecords } from "@/lib/supabase-field";
import { assertNotDemo } from "@/lib/demo-context";
import { compressImage } from "@/lib/image-utils";
import { assertImagemValida, nomeSeguroDeArquivo } from "@/lib/upload-guard";

// Anexo de QUALQUER registro do sistema.
//
// Antes só três telas guardavam arquivo: romaneio, RDC e PDF de animal. No
// resto havia campos "Foto URL", "Áudio URL", "Laudo URL" e "Evidência URL" que
// eram **caixas de texto** — e KPIs contando "registros com foto" a partir
// delas. O painel dizia que 12 registros tinham foto quando ninguém conseguia
// anexar uma sem hospedar a imagem em outro lugar antes.
//
// Generaliza o caminho da Remessa, que era o mais completo dos três: valida no
// serviço, sanitiza o nome, gera miniatura, compensa órfão e prefixa o caminho
// com `org_id` — que é o que a policy do Storage compara para isolar empresas.

const BUCKET = "rdc-photos";
const MODULE = "anexo";

export type Anexo = {
  id: string;
  refId: string;
  refModule: string;
  path: string;
  thumbPath: string;
  nome: string;
  createdAt?: string;
};

export async function uploadAnexo(input: {
  orgId: string;
  /** Id do registro ao qual o arquivo pertence. */
  refId: string;
  /** Módulo do registro (`diario`, `scouting`, `fluxo`, `gta`...). */
  refModule: string;
  file: File;
}): Promise<void> {
  assertNotDemo();
  assertImagemValida(input.file);

  const safe = nomeSeguroDeArquivo(input.file.name);
  // O 1º segmento do caminho é a empresa: é o que
  // `(storage.foldername(name))[1] = current_org_id()` compara na policy.
  const base = `${input.orgId}/anexo/${input.refModule}/${input.refId}/${Date.now()}-${safe}`;

  const { error } = await supabase.storage.from(BUCKET).upload(base, input.file, {
    contentType: input.file.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(error.message);

  // Miniatura: a lista mostra tiles pequenos, e servir o original de até 8 MB
  // em cada um é o que já custava caro na galeria de romaneios.
  let thumbPath = "";
  try {
    const thumb = await compressImage(input.file, { maxDim: 320, quality: 0.7 });
    if (thumb.size < input.file.size) {
      const alvo = `${base}.thumb.jpg`;
      const { error: erroThumb } = await supabase.storage
        .from(BUCKET)
        .upload(alvo, thumb, { contentType: "image/jpeg", upsert: true });
      if (!erroThumb) thumbPath = alvo;
    }
  } catch {
    // Sem miniatura; a lista cai no original.
  }

  try {
    await createFieldRecord({
      module: MODULE,
      payload: {
        ref_id: input.refId,
        ref_module: input.refModule,
        storage_path: base,
        thumb_path: thumbPath,
        nome: input.file.name,
      },
    });
  } catch (erro) {
    // Sem compensar, o arquivo fica no bucket sem nenhuma linha apontando para
    // ele: invisível e impossível de remover pela interface.
    await supabase.storage
      .from(BUCKET)
      .remove([base, thumbPath].filter(Boolean) as string[])
      .catch(() => undefined);
    throw erro;
  }
}

/** Anexos de UM registro. O filtro por `ref_id` vai ao servidor. */
export async function listAnexos(refId: string): Promise<Anexo[]> {
  const records = await listFieldRecords(MODULE, {
    payloadEq: { chave: "ref_id", valor: refId },
  });
  return records
    .filter((r) => r.payload.storage_path)
    .map((r) => ({
      id: r.id,
      refId: r.payload.ref_id ?? "",
      refModule: r.payload.ref_module ?? "",
      path: r.payload.storage_path,
      thumbPath: r.payload.thumb_path ?? "",
      nome: r.payload.nome ?? "arquivo",
      createdAt: r.created_at,
    }));
}

export async function getAnexoUrl(path: string, ttlSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSeconds);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteAnexo(anexo: Pick<Anexo, "id" | "path" | "thumbPath">): Promise<void> {
  const alvos = [anexo.path, anexo.thumbPath].filter(Boolean) as string[];
  if (alvos.length) await supabase.storage.from(BUCKET).remove(alvos);
  await deleteFieldRecord(anexo.id);
}

/**
 * Apaga os anexos de um registro. Como o vínculo é `payload.ref_id` (texto no
 * jsonb) e não uma FK, o banco não cascateia — quem apaga o registro precisa
 * chamar isto, senão o arquivo fica no bucket para sempre.
 */
export async function deleteAnexosDe(refId: string): Promise<void> {
  for (const anexo of await listAnexos(refId)) {
    await deleteAnexo(anexo).catch((erro) => {
      console.warn("[anexo] não removido no cascade:", erro);
    });
  }
}
