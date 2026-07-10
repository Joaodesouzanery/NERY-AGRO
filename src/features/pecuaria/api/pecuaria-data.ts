import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { listFieldRecords } from "@/lib/supabase-field";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import type {
  AnimalCarencia,
  DossieElo,
  GmdAnimal,
  PecAnimal,
  PecAnimalInsert,
  PecAnimalUpdate,
  PecEstoqueSemen,
  PecEstoqueSemenInsert,
  PecEventoReprodutivo,
  PecEventoReprodutivoInsert,
  PecEventoSanitario,
  PecEventoSanitarioInsert,
  PecLote,
  PecLoteInsert,
  PecLoteUpdate,
  PecMovimentacaoGta,
  PecMovimentacaoGtaInsert,
  PecOcupacao,
  PecOcupacaoInsert,
  PecPesagem,
  PecPesagemInsert,
  PecProducao,
  PecProducaoInsert,
} from "../types/domain";
import type { PecConfigPayload } from "../lib/apartacao-config";

// Camada de dados da Pecuária v2. RLS já escopa por empresa (org_id); as leituras
// degradam para vazio quando o Supabase não está configurado (modo degradado),
// e as mutações lançam para o React Query tratar/toastar. org_id é preenchido
// pelo trigger set_org_id — nunca enviado pelo cliente.

const TETO = 10_000; // teto defensivo de linhas (paginação fica p/ evolução)

// ── Lotes ────────────────────────────────────────────────────────────────
export async function listLotes(): Promise<PecLote[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("pec_lote")
    .select("*")
    .order("aberto_em", { ascending: false })
    .limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createLote(input: PecLoteInsert): Promise<PecLote> {
  const { data, error } = await supabase.from("pec_lote").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateLote(id: string, patch: PecLoteUpdate): Promise<PecLote> {
  const { data, error } = await supabase
    .from("pec_lote")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLote(id: string): Promise<void> {
  const { error } = await supabase.from("pec_lote").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Animais ──────────────────────────────────────────────────────────────
export async function listAnimais(): Promise<PecAnimal[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("pec_animal")
    .select("*")
    .order("brinco_visual", { ascending: true, nullsFirst: false })
    .limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAnimal(input: PecAnimalInsert): Promise<PecAnimal> {
  const { data, error } = await supabase.from("pec_animal").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateAnimal(id: string, patch: PecAnimalUpdate): Promise<PecAnimal> {
  const { data, error } = await supabase
    .from("pec_animal")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Cadastro por faixa de brincos: insere vários animais de uma vez. */
export async function createAnimaisBatch(inputs: PecAnimalInsert[]): Promise<number> {
  if (!inputs.length) return 0;
  const { data, error } = await supabase.from("pec_animal").insert(inputs).select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

/** Edição em massa (ex.: trocar lote/categoria de vários animais). */
export async function updateAnimaisBatch(ids: string[], patch: PecAnimalUpdate): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase
    .from("pec_animal")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw new Error(error.message);
}

// ── Pesagens ─────────────────────────────────────────────────────────────
export async function listPesagens(animalId?: string): Promise<PecPesagem[]> {
  if (!isSupabaseConfigured) return [];
  let q = supabase.from("pec_pesagem").select("*").order("data", { ascending: true }).limit(TETO);
  if (animalId) q = q.eq("animal_id", animalId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPesagem(input: PecPesagemInsert): Promise<PecPesagem> {
  const { data, error } = await supabase.from("pec_pesagem").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Sanidade ─────────────────────────────────────────────────────────────
export async function listEventosSanitarios(): Promise<PecEventoSanitario[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("pec_evento_sanitario")
    .select("*")
    .order("data", { ascending: false })
    .limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createEventoSanitario(
  input: PecEventoSanitarioInsert,
): Promise<PecEventoSanitario> {
  const { data, error } = await supabase
    .from("pec_evento_sanitario")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Aplica um protocolo ao lote inteiro gravando UM EVENTO POR ANIMAL (mantendo
 * o lote_id para agrupar na listagem).
 *
 * Por que não um único evento de lote: a carência é uma propriedade do ANIMAL
 * (ele recebeu o produto), não do piquete. Com um evento só, `v_animal_carencia`
 * casa por `lote_id` e o animal PERDE a carência ao ser movido de lote — ficaria
 * liberado para abate/venda antes do prazo. Expandindo, a carência o acompanha.
 */
export async function createEventoSanitarioLote(
  loteId: string,
  animalIds: string[],
  evento: Omit<PecEventoSanitarioInsert, "animal_id" | "lote_id">,
): Promise<number> {
  if (!animalIds.length) {
    // Lote vazio: grava só o registro do lote, para o protocolo não sumir.
    await createEventoSanitario({ ...evento, lote_id: loteId, animal_id: null });
    return 0;
  }
  const linhas = animalIds.map((animalId) => ({
    ...evento,
    lote_id: loteId,
    animal_id: animalId,
  }));
  const { data, error } = await supabase.from("pec_evento_sanitario").insert(linhas).select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

// ── Reprodução (IATF) ────────────────────────────────────────────────────
export async function listEventosReprodutivos(): Promise<PecEventoReprodutivo[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("pec_evento_reprodutivo")
    .select("*")
    .order("data", { ascending: false })
    .limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createEventoReprodutivo(
  input: PecEventoReprodutivoInsert,
): Promise<PecEventoReprodutivo> {
  const { data, error } = await supabase
    .from("pec_evento_reprodutivo")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listEstoqueSemen(): Promise<PecEstoqueSemen[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("pec_estoque_semen")
    .select("*")
    .order("touro", { ascending: true })
    .limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createEstoqueSemen(input: PecEstoqueSemenInsert): Promise<PecEstoqueSemen> {
  const { data, error } = await supabase.from("pec_estoque_semen").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Baixa `quantidade` doses da partida com COMPARE-AND-SWAP: o update só vale se
 * `doses` ainda for o valor lido. Duas inseminações simultâneas sobre a mesma
 * partida fazem a segunda falhar em vez de perder a baixa.
 *
 * O CHECK (doses >= 0) do banco NÃO resolve isso sozinho: dois writers que leem
 * 1 e escrevem 0 gravam 0 duas vezes, sem violar nada — uma dose some.
 */
export async function baixarDosesSemen(id: string, quantidade: number): Promise<void> {
  const { data: atual, error: errLeitura } = await supabase
    .from("pec_estoque_semen")
    .select("doses")
    .eq("id", id)
    .single();
  if (errLeitura) throw new Error(errLeitura.message);

  const disponivel = atual?.doses ?? 0;
  if (disponivel < quantidade) throw new Error("Doses insuficientes no estoque desta partida.");

  const { data: atualizado, error } = await supabase
    .from("pec_estoque_semen")
    .update({ doses: disponivel - quantidade, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("doses", disponivel) // ← trava: só grava se ninguém mexeu no meio
    .select("id");
  if (error) throw new Error(error.message);
  if (!atualizado?.length) {
    throw new Error("O estoque mudou durante a operação. Confira as doses e tente de novo.");
  }
}

/** Inseminação IATF: grava o evento e baixa a dose do estoque. */
export async function registrarInseminacao(input: {
  animalId: string;
  data: string;
  protocolo: string | null;
  estoqueId: string;
  semenTouro: string;
}): Promise<void> {
  await baixarDosesSemen(input.estoqueId, 1);
  await createEventoReprodutivo({
    animal_id: input.animalId,
    tipo: "iatf",
    protocolo: input.protocolo,
    semen_touro: input.semenTouro,
    data: input.data,
  });
}

// ── Produção diária (leite, ovos, mel) ───────────────────────────────────
export async function listProducao(): Promise<PecProducao[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("pec_producao")
    .select("*")
    .order("data", { ascending: false })
    .limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createProducao(input: PecProducaoInsert): Promise<PecProducao> {
  const { data, error } = await supabase.from("pec_producao").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProducao(id: string): Promise<void> {
  const { error } = await supabase.from("pec_producao").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── GTA ──────────────────────────────────────────────────────────────────
export async function listGta(): Promise<PecMovimentacaoGta[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("pec_movimentacao_gta")
    .select("*")
    .order("data", { ascending: false })
    .limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createGta(input: PecMovimentacaoGtaInsert): Promise<PecMovimentacaoGta> {
  const { data, error } = await supabase
    .from("pec_movimentacao_gta")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Ocupação de talhão (ILP) ─────────────────────────────────────────────
export async function listOcupacoes(): Promise<PecOcupacao[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("pec_ocupacao")
    .select("*")
    .order("data_entrada", { ascending: false })
    .limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createOcupacao(input: PecOcupacaoInsert): Promise<PecOcupacao> {
  const { data, error } = await supabase.from("pec_ocupacao").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

/** Fecha a ocupação aberta (data_saida = hoje). */
export async function encerrarOcupacao(id: string, dataSaida?: string): Promise<void> {
  const { error } = await supabase
    .from("pec_ocupacao")
    .update({
      data_saida: dataSaida ?? new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Move um lote para outro talhão: fecha a ocupação aberta e abre a nova.
 * Não é atômico (o PostgREST não expõe transação); se a abertura falhar após o
 * fechamento, o lote fica sem ocupação aberta — estado visível e corrigível na UI.
 */
export async function moverLote(
  loteId: string,
  talhaoDestinoId: string,
  gtaEntrada?: string,
): Promise<PecOcupacao> {
  const hoje = new Date().toISOString().slice(0, 10);
  const { data: abertas, error: errAbertas } = await supabase
    .from("pec_ocupacao")
    .select("id")
    .eq("lote_id", loteId)
    .is("data_saida", null);
  if (errAbertas) throw new Error(errAbertas.message);
  for (const o of abertas ?? []) await encerrarOcupacao(o.id, hoje);
  return createOcupacao({
    lote_id: loteId,
    talhao_id: talhaoDestinoId,
    data_entrada: hoje,
    gta_entrada: gtaEntrada ?? null,
  });
}

/** Talhões do módulo Campo (field_records module='areas') — não cria tabela nova. */
export async function listTalhoes(): Promise<TalhaoRecord[]> {
  if (!isSupabaseConfigured) return [];
  const records = await listFieldRecords("areas");
  return records.map((r) => r as TalhaoRecord);
}

// ── Views derivadas ──────────────────────────────────────────────────────
export async function listGmd(): Promise<GmdAnimal[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("v_gmd_animal").select("*").limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listCarencia(): Promise<AnimalCarencia[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("v_animal_carencia").select("*").limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listDossie(animalId: string): Promise<DossieElo[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("v_dossie_animal")
    .select("*")
    .eq("animal_id", animalId)
    .order("ordem", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Config (regras de apartação + constantes editáveis) ──────────────────
export async function getConfig(): Promise<PecConfigPayload | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("pec_config")
    .select("payload")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.payload as PecConfigPayload | undefined) ?? null;
}

export async function upsertConfig(payload: PecConfigPayload): Promise<void> {
  const existing = await supabase.from("pec_config").select("id").limit(1).maybeSingle();
  if (existing.data?.id) {
    const { error } = await supabase
      .from("pec_config")
      .update({ payload, updated_at: new Date().toISOString() })
      .eq("id", existing.data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("pec_config").insert({ payload });
    if (error) throw new Error(error.message);
  }
}
