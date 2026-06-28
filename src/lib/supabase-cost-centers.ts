import { supabase } from "@/integrations/supabase/client";

// Centros de custo normalizados (Financeiro V2): dimensão de orçamento com
// autorizado x alocado x realizado. Espelha o padrão de supabase-financial.ts.

export type CostCenter = {
  id: string;
  nome: string;
  tipo: string;
  safra: string | null;
  talhao_id: string | null;
  valor_autorizado: number;
  valor_alocado: number;
  valor_realizado: number;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type CostCenterInput = Omit<CostCenter, "id" | "created_at" | "updated_at">;

export async function listCostCenters(): Promise<CostCenter[]> {
  const { data, error } = await supabase
    .from("cost_centers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CostCenter[];
}

export async function createCostCenter(input: CostCenterInput): Promise<CostCenter> {
  const { data, error } = await supabase.from("cost_centers").insert(input).select().single();
  if (error) throw error;
  return data as CostCenter;
}

export async function updateCostCenter(input: {
  id: string;
  patch: Partial<CostCenterInput>;
}): Promise<CostCenter> {
  const { data, error } = await supabase
    .from("cost_centers")
    .update({ ...input.patch, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .select()
    .single();
  if (error) throw error;
  return data as CostCenter;
}

export async function deleteCostCenter(id: string): Promise<void> {
  const { error } = await supabase.from("cost_centers").delete().eq("id", id);
  if (error) throw error;
}
