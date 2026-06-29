import { supabase } from "@/integrations/supabase/client";

export type FinancialRecord = {
  id: string;
  module: string;
  payload: Record<string, string>;
  created_at?: string;
  updated_at?: string;
};

// Lovable Cloud is always configured; flag kept for backward UI compatibility.
export const isSupabaseConfigured = true;

export async function listFinancialRecords(module: string): Promise<FinancialRecord[]> {
  const { data, error } = await supabase
    .from("financial_records")
    .select("*")
    .eq("module", module)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FinancialRecord[];
}

export async function listAllFinancialRecords(): Promise<FinancialRecord[]> {
  const { data, error } = await supabase
    .from("financial_records")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000); // teto defensivo (RLS já escopa por empresa); paginação fica p/ evolução
  if (error) throw new Error(error.message);
  return (data ?? []) as FinancialRecord[];
}

export async function createFinancialRecord(input: {
  module: string;
  payload: Record<string, string>;
}): Promise<FinancialRecord> {
  const { data, error } = await supabase
    .from("financial_records")
    .insert({ module: input.module, payload: input.payload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as FinancialRecord;
}

export async function updateFinancialRecord(input: {
  id: string;
  payload: Record<string, string>;
}): Promise<FinancialRecord> {
  const { data, error } = await supabase
    .from("financial_records")
    .update({ payload: input.payload, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as FinancialRecord;
}

export async function deleteFinancialRecord(id: string): Promise<void> {
  const { error } = await supabase.from("financial_records").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
