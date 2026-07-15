import { supabase } from "@/integrations/supabase/client";
import { assertNotDemo } from "@/lib/demo-context";

export type OperationRecord = {
  id: string;
  area: string;
  module: string;
  payload: Record<string, string>;
  created_at?: string;
  updated_at?: string;
};

export async function listOperationRecords(module: string): Promise<OperationRecord[]> {
  const { data, error } = await supabase
    .from("operation_records")
    .select("*")
    .eq("module", module)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OperationRecord[];
}

export async function listOperationRecordsByArea(area: string): Promise<OperationRecord[]> {
  const { data, error } = await supabase
    .from("operation_records")
    .select("*")
    .eq("area", area)
    .order("created_at", { ascending: false })
    .limit(5000); // teto defensivo (RLS já escopa por empresa); paginação fica p/ evolução
  if (error) throw new Error(error.message);
  return (data ?? []) as OperationRecord[];
}

export async function listOperationRecordsByAreaModule(
  area: string,
  module: string,
): Promise<OperationRecord[]> {
  const { data, error } = await supabase
    .from("operation_records")
    .select("*")
    .eq("area", area)
    .eq("module", module)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OperationRecord[];
}

export async function createOperationRecord(input: {
  area: string;
  module: string;
  payload: Record<string, string>;
}): Promise<OperationRecord> {
  assertNotDemo();
  const { data, error } = await supabase
    .from("operation_records")
    .insert({ area: input.area, module: input.module, payload: input.payload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as OperationRecord;
}

export async function updateOperationRecord(input: {
  id: string;
  payload: Record<string, string>;
}): Promise<OperationRecord> {
  assertNotDemo();
  const { data, error } = await supabase
    .from("operation_records")
    .update({ payload: input.payload, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as OperationRecord;
}

export async function deleteOperationRecord(id: string): Promise<void> {
  assertNotDemo();
  const { error } = await supabase.from("operation_records").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
