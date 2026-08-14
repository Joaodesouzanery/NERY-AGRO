import { supabase } from "@/integrations/supabase/client";
import { assertNotDemo } from "@/lib/demo-context";

// Contratos normalizados (Financeiro V2): compra de insumo, venda de grãos,
// fixação, frete, CSA, etc. Drill-down via cost_center_id. Espelha supabase-financial.ts.

export type Contract = {
  id: string;
  contrato: string;
  tipo: string;
  contraparte: string | null;
  cost_center_id: string | null;
  talhao_id: string | null;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  qtd_contratada: number;
  qtd_liquidada: number;
  preco_unit: number;
  valor: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type ContractInput = Omit<Contract, "id" | "created_at" | "updated_at">;

export async function listContracts(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Contract[];
}

export async function createContract(input: ContractInput): Promise<Contract> {
  assertNotDemo();
  const { data, error } = await supabase.from("contracts").insert(input).select().single();
  if (error) throw error;
  return data as Contract;
}

export async function updateContract(input: {
  id: string;
  patch: Partial<ContractInput>;
}): Promise<Contract> {
  assertNotDemo();
  const { data, error } = await supabase
    .from("contracts")
    .update({ ...input.patch, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .select()
    .single();
  if (error) throw error;
  return data as Contract;
}

export async function deleteContract(id: string): Promise<void> {
  assertNotDemo();
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) throw error;
}
