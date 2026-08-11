import { supabase } from "@/integrations/supabase/client";
import { assertNotDemo } from "@/lib/demo-context";

export type FieldRecord = {
  id: string;
  module: string;
  payload: Record<string, string>;
  created_at?: string;
  updated_at?: string;
};

const fieldRecords = () => supabase.from("field_records");

export async function listFieldRecords(
  module: string,
  /**
   * `payloadEq` filtra por uma chave do jsonb NO SERVIDOR — antes a galeria de
   * fotos baixava todas as fotos da empresa para mostrar as de uma remessa. O
   * `eq("module", ...)` continua entrando primeiro e usa o índice
   * (org_id, module, created_at), então o filtro extra roda sobre um
   * subconjunto pequeno, sem precisar de índice GIN.
   */
  opts: { payloadEq?: { chave: string; valor: string }; limit?: number } = {},
): Promise<FieldRecord[]> {
  let q = fieldRecords().select("*").eq("module", module);
  if (opts.payloadEq) q = q.eq(`payload->>${opts.payloadEq.chave}`, opts.payloadEq.valor);
  q = q.order("created_at", { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as FieldRecord[];
}

export async function listAllFieldRecords(): Promise<FieldRecord[]> {
  const { data, error } = await fieldRecords()
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000); // teto defensivo (RLS já escopa por empresa); paginação fica p/ evolução
  if (error) throw new Error(error.message);
  return (data ?? []) as FieldRecord[];
}

export async function createFieldRecord(input: {
  module: string;
  payload: Record<string, string>;
}): Promise<FieldRecord> {
  assertNotDemo();
  const { data, error } = await fieldRecords()
    .insert({ module: input.module, payload: input.payload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as FieldRecord;
}

export async function updateFieldRecord(input: {
  id: string;
  payload: Record<string, string>;
}): Promise<FieldRecord> {
  assertNotDemo();
  const { data, error } = await fieldRecords()
    .update({ payload: input.payload, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as FieldRecord;
}

export async function deleteFieldRecord(id: string): Promise<void> {
  assertNotDemo();
  const { error } = await fieldRecords().delete().eq("id", id);
  if (error) throw new Error(error.message);
}
