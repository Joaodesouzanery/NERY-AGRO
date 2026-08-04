import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { assertNotDemo } from "@/lib/demo-context";
import { listFieldRecords } from "@/lib/supabase-field";
import type { TalhaoRecord } from "@/features/talhao-360/types/domain";
import { demoPecuariaData } from "../data/demo";
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

// Modo DEMO: leituras servem o dataset local (data/demo.ts); escritas são
// bloqueadas por `assertNotDemo()` (compartilhado em demo-context) — o rebanho
// demo é read-only, como todo dado demo.
//
// LEITURA recebe `demoMode` por parâmetro; só a ESCRITA lê o localStorage
// (via assertNotDemo). O motivo é o cache: a chave do React Query vem do
// `demoMode` do React, então resolver a fonte pelo localStorage dentro da
// queryFn permitia gravar dado da vitrine sob a chave do modo REAL. Guardado
// por src/lib/demo-cache.guard.test.ts.

// ── Lotes ────────────────────────────────────────────────────────────────
export async function listLotes(demoMode: boolean): Promise<PecLote[]> {
  if (demoMode) return demoPecuariaData().lotes;
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
  assertNotDemo();
  const { data, error } = await supabase.from("pec_lote").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateLote(id: string, patch: PecLoteUpdate): Promise<PecLote> {
  assertNotDemo();
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
  assertNotDemo();
  const { error } = await supabase.from("pec_lote").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Animais ──────────────────────────────────────────────────────────────
export async function listAnimais(demoMode: boolean): Promise<PecAnimal[]> {
  if (demoMode) return demoPecuariaData().animais;
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
  assertNotDemo();
  const { data, error } = await supabase.from("pec_animal").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateAnimal(id: string, patch: PecAnimalUpdate): Promise<PecAnimal> {
  assertNotDemo();
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
  assertNotDemo();
  if (!inputs.length) return 0;
  const { data, error } = await supabase.from("pec_animal").insert(inputs).select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

/** Edição em massa (ex.: trocar lote/categoria de vários animais). */
export async function updateAnimaisBatch(ids: string[], patch: PecAnimalUpdate): Promise<void> {
  assertNotDemo();
  if (!ids.length) return;
  const { error } = await supabase
    .from("pec_animal")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw new Error(error.message);
}

// ── Pesagens ─────────────────────────────────────────────────────────────
export async function listPesagens(demoMode: boolean, animalId?: string): Promise<PecPesagem[]> {
  if (demoMode) {
    const pesagens = demoPecuariaData().pesagens;
    return animalId ? pesagens.filter((item) => item.animal_id === animalId) : pesagens;
  }
  if (!isSupabaseConfigured) return [];
  let q = supabase.from("pec_pesagem").select("*").order("data", { ascending: true }).limit(TETO);
  if (animalId) q = q.eq("animal_id", animalId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPesagem(
  input: PecPesagemInsert,
  /** Empresa dona do item — SÓ no caminho de sincronização da fila offline. */
  orgId?: string,
): Promise<PecPesagem> {
  assertNotDemo();
  // Regra geral do projeto: `org_id` não vai do cliente, o trigger `set_org_id`
  // carimba. Esta é a única exceção, e ela existe por segurança, não por
  // conveniência: na fila offline o item foi capturado numa empresa e pode
  // estar sendo enviado por outra sessão, noutro dia, noutro aparelho. Declarar
  // o `org_id` faz a policy `with check (org_id = current_org_id())` REJEITAR o
  // item alheio (42501) em vez de o trigger carimbá-lo, calado, na empresa de
  // quem estiver logado. Sem isto, o filtro do cliente seria a única barreira.
  const payload: PecPesagemInsert = orgId
    ? ({ ...input, org_id: orgId } as PecPesagemInsert)
    : input;
  const { data, error } = await supabase.from("pec_pesagem").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Sanidade ─────────────────────────────────────────────────────────────
export async function listEventosSanitarios(demoMode: boolean): Promise<PecEventoSanitario[]> {
  if (demoMode) return demoPecuariaData().sanitarios;
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
  assertNotDemo();
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
  assertNotDemo();
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
export async function listEventosReprodutivos(demoMode: boolean): Promise<PecEventoReprodutivo[]> {
  if (demoMode) return demoPecuariaData().reprodutivos;
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
  assertNotDemo();
  const { data, error } = await supabase
    .from("pec_evento_reprodutivo")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listEstoqueSemen(demoMode: boolean): Promise<PecEstoqueSemen[]> {
  if (demoMode) return demoPecuariaData().semen;
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
  assertNotDemo();
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
  assertNotDemo();
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
export async function listProducao(demoMode: boolean): Promise<PecProducao[]> {
  if (demoMode) return demoPecuariaData().producao;
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
  assertNotDemo();
  const { data, error } = await supabase.from("pec_producao").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProducao(id: string): Promise<void> {
  assertNotDemo();
  const { error } = await supabase.from("pec_producao").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── GTA ──────────────────────────────────────────────────────────────────
export async function listGta(demoMode: boolean): Promise<PecMovimentacaoGta[]> {
  if (demoMode) return demoPecuariaData().gta;
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
  assertNotDemo();
  const { data, error } = await supabase
    .from("pec_movimentacao_gta")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Ocupação de talhão (ILP) ─────────────────────────────────────────────
export async function listOcupacoes(demoMode: boolean): Promise<PecOcupacao[]> {
  if (demoMode) return demoPecuariaData().ocupacoes;
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
  assertNotDemo();
  const { data, error } = await supabase.from("pec_ocupacao").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

/** Fecha a ocupação aberta (data_saida = hoje). */
export async function encerrarOcupacao(id: string, dataSaida?: string): Promise<void> {
  assertNotDemo();
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
  assertNotDemo();
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
export async function listTalhoes(demoMode: boolean): Promise<TalhaoRecord[]> {
  if (demoMode) return demoPecuariaData().talhoes;
  if (!isSupabaseConfigured) return [];
  const records = await listFieldRecords("areas");
  return records.map((r) => r as TalhaoRecord);
}

// ── Views derivadas ──────────────────────────────────────────────────────
export async function listGmd(demoMode: boolean): Promise<GmdAnimal[]> {
  if (demoMode) return demoPecuariaData().gmd;
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("v_gmd_animal").select("*").limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listCarencia(demoMode: boolean): Promise<AnimalCarencia[]> {
  if (demoMode) return demoPecuariaData().carencia;
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("v_animal_carencia").select("*").limit(TETO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listDossie(demoMode: boolean, animalId: string): Promise<DossieElo[]> {
  if (demoMode) return demoPecuariaData().dossies[animalId] ?? [];
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
export async function getConfig(demoMode: boolean): Promise<PecConfigPayload | null> {
  if (demoMode) return null; // demo usa os padrões de apartação
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
  assertNotDemo();
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
