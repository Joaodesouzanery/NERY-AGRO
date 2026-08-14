import { localDateOf, localToday } from "@/lib/date-local";
import { assertNotDemo } from "@/lib/demo-context";
import { assertImagemValida, nomeSeguroDeArquivo } from "@/lib/upload-guard";
import { supabase } from "@/integrations/supabase/client";
import {
  createFieldRecord,
  deleteFieldRecord,
  listAllFieldRecords,
  updateFieldRecord,
  type FieldRecord,
} from "@/lib/supabase-field";
import { listOperationRecordsByAreaModule } from "@/lib/supabase-operations";
import {
  SECOES,
  isOcorrenciaTipo,
  type LinkOption,
  type RdcDailySummary,
  type RdcEntry,
  type RdcEntryInput,
  type RdcFicha,
  type RdcFichaSummary,
  type RdcModel,
  type RdcPhoto,
  type Secao,
} from "@/features/rdc/types/domain";

export const RDC_PHOTOS_BUCKET = "rdc-photos";

const MOD_FICHA = "rdc-ficha";
const MOD_ENTRY = "rdc-entry";
const MOD_PHOTO = "rdc-photo";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function num(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Mantém só chaves com valor (string não-vazia) — itens enxutos e alertas corretos na Torre. */
function compact(
  payload: Record<string, string | number | undefined | null>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    const text = String(value);
    if (text === "") continue;
    out[key] = text;
  }
  return out;
}

function asSecao(value: string | undefined): Secao {
  return SECOES.includes(value as Secao) ? (value as Secao) : "campo";
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// mappers (FieldRecord -> domínio)
// ---------------------------------------------------------------------------

export function fichaFromRecord(record: FieldRecord): RdcFicha {
  const p = record.payload;
  return {
    id: record.id,
    data: p.data || record.created_at?.slice(0, 10) || "",
    titulo: p.titulo || "RDC",
    responsavel: p.responsavel || "",
    local: p.local || "",
    safra: p.safra || "",
    dia: p.dia || "",
    clima: p.clima || "",
    climaResumo: p.clima_resumo || "",
    atividades: parseList(p.atividades),
    atividadesOutros: p.atividades_outros || "",
    resumo: p.resumo || "",
    status: p.status === "Concluído" ? "Concluído" : "Rascunho",
    createdAt: record.created_at,
  };
}

export function entryFromRecord(record: FieldRecord): RdcEntry {
  const p = record.payload;
  return {
    id: record.id,
    rdcId: p.rdc_id || "",
    secao: asSecao(p.secao),
    tipo: p.tipo || "Item",
    data: p.data || record.created_at?.slice(0, 10) || "",
    descricao: p.descricao || "",
    quantidade: p.quantidade || undefined,
    unidade: p.unidade || undefined,
    custo: p.custo ? num(p.custo) : undefined,
    severidade: p.severidade || undefined,
    status: p.status || undefined,
    responsavel: p.responsavel || undefined,
    talhaoId: p.talhao_id || undefined,
    talhaoNome: p.talhao_nome || undefined,
    animalId: p.animal_id || undefined,
    animalNome: p.animal_nome || undefined,
  };
}

export function photoFromRecord(record: FieldRecord): RdcPhoto {
  const p = record.payload;
  return {
    id: record.id,
    rdcId: p.rdc_id || "",
    secao: asSecao(p.secao),
    storagePath: p.storage_path || "",
    url: p.url || "",
    legenda: p.legenda || undefined,
    talhaoId: p.talhao_id || undefined,
    animalId: p.animal_id || undefined,
  };
}

// ---------------------------------------------------------------------------
// loading
// ---------------------------------------------------------------------------

export async function listRdcRecords(): Promise<FieldRecord[]> {
  return listAllFieldRecords();
}

// ---------------------------------------------------------------------------
// selectors (puros — operam sobre o FieldRecord[] já carregado)
// ---------------------------------------------------------------------------

function emptyBySecao(): Record<Secao, RdcEntry[]> {
  return { campo: [], pecuaria: [], observacoes: [], equipe: [] };
}

export function buildRdcModel(records: FieldRecord[], rdcId: string): RdcModel | null {
  const fichaRecord = records.find((r) => r.module === MOD_FICHA && r.id === rdcId);
  if (!fichaRecord) return null;

  const entries = records
    .filter((r) => r.module === MOD_ENTRY && r.payload.rdc_id === rdcId)
    .map(entryFromRecord);
  const photos = records
    .filter((r) => r.module === MOD_PHOTO && r.payload.rdc_id === rdcId)
    .map(photoFromRecord);

  const entriesBySecao = emptyBySecao();
  for (const entry of entries) entriesBySecao[entry.secao].push(entry);

  return {
    ficha: fichaFromRecord(fichaRecord),
    entriesBySecao,
    photos,
    totalCusto: entries.reduce((sum, e) => sum + (e.custo ?? 0), 0),
    totalItens: entries.length,
    ocorrenciasAbertas: entries.filter((e) => isOcorrenciaTipo(e.tipo) && e.status !== "Resolvido")
      .length,
  };
}

export function listFichaSummaries(records: FieldRecord[]): RdcFichaSummary[] {
  const entriesByRdc = new Map<string, RdcEntry[]>();
  const photosByRdc = new Map<string, number>();
  for (const record of records) {
    if (record.module === MOD_ENTRY) {
      const id = record.payload.rdc_id;
      if (!id) continue;
      const list = entriesByRdc.get(id) ?? [];
      list.push(entryFromRecord(record));
      entriesByRdc.set(id, list);
    } else if (record.module === MOD_PHOTO) {
      const id = record.payload.rdc_id;
      if (id) photosByRdc.set(id, (photosByRdc.get(id) ?? 0) + 1);
    }
  }
  return records
    .filter((r) => r.module === MOD_FICHA)
    .map((record) => {
      const ficha = fichaFromRecord(record);
      const entries = entriesByRdc.get(record.id) ?? [];
      return {
        ...ficha,
        itens: entries.length,
        fotos: photosByRdc.get(record.id) ?? 0,
        custo: entries.reduce((sum, e) => sum + (e.custo ?? 0), 0),
      };
    })
    .sort((a, b) => (b.data + b.id).localeCompare(a.data + a.id));
}

function fichaDateMap(records: FieldRecord[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const record of records) {
    if (record.module === MOD_FICHA) {
      map.set(record.id, record.payload.data || record.created_at?.slice(0, 10) || "");
    }
  }
  return map;
}

function entriesLinkedBy(
  records: FieldRecord[],
  predicate: (record: FieldRecord) => boolean,
): RdcEntry[] {
  const dates = fichaDateMap(records);
  return records
    .filter((r) => r.module === MOD_ENTRY && predicate(r))
    .map((r) => {
      const entry = entryFromRecord(r);
      // Fonte única de verdade: a data exibida segue a ficha-pai (ela pode ter sido editada).
      return { ...entry, data: dates.get(entry.rdcId) || entry.data };
    })
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function listEntriesForTalhao(records: FieldRecord[], talhaoId: string): RdcEntry[] {
  return entriesLinkedBy(records, (r) => r.payload.talhao_id === talhaoId);
}

export function listEntriesForAnimal(records: FieldRecord[], animalId: string): RdcEntry[] {
  return entriesLinkedBy(records, (r) => r.payload.animal_id === animalId);
}

// A implementação vive em @/lib/date-local (o RDC deixou de ser dono dela
// quando o resto do app passou a precisar). Re-exportado para não mexer nos
// chamadores que já importam daqui — e usado logo abaixo, neste arquivo.
export { localDateOf, localToday };

/** Data da ficha mais recente do conjunto (para a vitrine DEMO não depender do relógio). */
export function latestFichaDate(records: FieldRecord[]): string {
  const dates = records
    .filter((r) => r.module === MOD_FICHA)
    .map((r) => r.payload.data)
    .filter(Boolean)
    .sort();
  return dates.at(-1) ?? localToday();
}

export function buildRdcDailySummary(records: FieldRecord[], date: string): RdcDailySummary {
  // Fichas do dia: `payload.data` explícito, ou a data local de `created_at` quando
  // a ficha foi salva sem data (senão não contava em "RDC de hoje" mesmo sendo de hoje).
  const fichas = records.filter(
    (r) => r.module === MOD_FICHA && (r.payload.data || localDateOf(r.created_at)) === date,
  );
  const ids = new Set(fichas.map((f) => f.id));
  const entries = records
    .filter((r) => r.module === MOD_ENTRY && ids.has(r.payload.rdc_id))
    .map(entryFromRecord);
  return {
    data: date,
    fichas: fichas.length,
    itens: entries.length,
    custoTotal: entries.reduce((sum, e) => sum + (e.custo ?? 0), 0),
    ocorrencias: entries.filter((e) => isOcorrenciaTipo(e.tipo)).length,
    talhoesTocados: new Set(entries.map((e) => e.talhaoId).filter(Boolean)).size,
    animaisTocados: new Set(entries.map((e) => e.animalId).filter(Boolean)).size,
  };
}

export function listTalhaoOptions(records: FieldRecord[]): LinkOption[] {
  return records
    .filter((r) => r.module === "areas")
    .map((r) => ({ id: r.id, nome: r.payload.talhao || r.payload.codigo || r.id }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function listAnimalOptions(): Promise<LinkOption[]> {
  const animals = await listOperationRecordsByAreaModule("pecuaria", "animal");
  return animals.map((a) => ({
    id: a.id,
    nome: a.payload.identificacao || a.payload.brinco_qr || a.id,
  }));
}

export async function listEmployeeOptions(): Promise<LinkOption[]> {
  const rows = await listOperationRecordsByAreaModule("equipe-vendas", "mao_de_obra");
  const seen = new Set<string>();
  const options: LinkOption[] = [];
  for (const row of rows) {
    const nome = row.payload.colaborador || row.payload.nome || row.payload.funcionario || "";
    if (!nome || seen.has(nome)) continue;
    seen.add(nome);
    options.push({ id: row.id, nome });
  }
  return options;
}

// ---------------------------------------------------------------------------
// ficha CRUD
// ---------------------------------------------------------------------------

function fichaToPayload(ficha: Partial<RdcFicha>): Record<string, string> {
  return compact({
    data: ficha.data,
    titulo: ficha.titulo,
    responsavel: ficha.responsavel,
    local: ficha.local,
    safra: ficha.safra,
    dia: ficha.dia,
    clima: ficha.clima,
    clima_resumo: ficha.climaResumo,
    atividades:
      ficha.atividades && ficha.atividades.length ? JSON.stringify(ficha.atividades) : undefined,
    atividades_outros: ficha.atividadesOutros,
    resumo: ficha.resumo,
    status: ficha.status || "Rascunho",
  });
}

export async function createFicha(ficha: Partial<RdcFicha>): Promise<FieldRecord> {
  return createFieldRecord({ module: MOD_FICHA, payload: fichaToPayload(ficha) });
}

export async function updateFicha(id: string, ficha: RdcFicha): Promise<FieldRecord> {
  return updateFieldRecord({ id, payload: fichaToPayload(ficha) });
}

/** Apaga a ficha e cascateia itens + fotos (incl. objetos no storage). */
export async function deleteFicha(rdcId: string): Promise<void> {
  const all = await listAllFieldRecords();
  const children = all.filter(
    (r) => (r.module === MOD_ENTRY || r.module === MOD_PHOTO) && r.payload.rdc_id === rdcId,
  );
  const paths = children
    .filter((r) => r.module === MOD_PHOTO && r.payload.storage_path)
    .map((r) => r.payload.storage_path)
    .filter((path) => path && !path.startsWith("demo/"));
  if (paths.length) {
    await supabase.storage.from(RDC_PHOTOS_BUCKET).remove(paths);
  }
  for (const child of children) await deleteFieldRecord(child.id);
  await deleteFieldRecord(rdcId);
}

// ---------------------------------------------------------------------------
// entry CRUD
// ---------------------------------------------------------------------------

function entryToPayload(
  rdcId: string,
  fichaData: string,
  input: RdcEntryInput,
): Record<string, string> {
  return compact({
    rdc_id: rdcId,
    secao: input.secao,
    tipo: input.tipo,
    data: fichaData,
    descricao: input.descricao,
    quantidade: input.quantidade,
    unidade: input.unidade,
    custo: input.custo,
    severidade: input.severidade,
    status: input.status,
    responsavel: input.responsavel,
    talhao_id: input.talhaoId,
    talhao_nome: input.talhaoNome,
    animal_id: input.animalId,
    animal_nome: input.animalNome,
    // alias que vira título do alerta na Torre (buildControlAlerts)
    ocorrencia: isOcorrenciaTipo(input.tipo) ? input.descricao : undefined,
  });
}

export async function createEntry(
  rdcId: string,
  fichaData: string,
  input: RdcEntryInput,
): Promise<FieldRecord> {
  return createFieldRecord({ module: MOD_ENTRY, payload: entryToPayload(rdcId, fichaData, input) });
}

export async function updateEntry(
  id: string,
  rdcId: string,
  fichaData: string,
  input: RdcEntryInput,
): Promise<FieldRecord> {
  return updateFieldRecord({ id, payload: entryToPayload(rdcId, fichaData, input) });
}

export async function deleteEntry(id: string): Promise<void> {
  return deleteFieldRecord(id);
}

// ---------------------------------------------------------------------------
// fotos (Supabase Storage + registro rdc-photo)
// ---------------------------------------------------------------------------

export async function uploadRdcPhoto(input: {
  orgId: string;
  rdcId: string;
  secao: Secao;
  file: File;
  legenda?: string;
  talhaoId?: string;
  animalId?: string;
}): Promise<FieldRecord> {
  // Validação no SERVIÇO, não só na tela: `accept="image/*"` no input é dica
  // visual, e qualquer chamador novo nasceria sem proteção. A Remessa já fazia
  // assim; aqui era só na UI, e as duas ainda usavam regex de sanitização
  // diferentes — agora as duas usam @/lib/upload-guard.
  assertNotDemo();
  assertImagemValida(input.file);
  const safeName = nomeSeguroDeArquivo(input.file.name);
  // Caminho prefixado por org_id → a RLS de storage isola por empresa. Bucket é
  // privado; exibição usa URL assinada (getSignedPhotoUrl).
  const path = `${input.orgId}/${input.rdcId}/${input.secao}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from(RDC_PHOTOS_BUCKET)
    .upload(path, input.file, { contentType: input.file.type || "image/jpeg", upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  try {
    return await createFieldRecord({
      module: MOD_PHOTO,
      payload: compact({
        rdc_id: input.rdcId,
        secao: input.secao,
        storage_path: path,
        legenda: input.legenda,
        talhao_id: input.talhaoId,
        animal_id: input.animalId,
      }),
    });
  } catch (erro) {
    // Compensa o órfão: sem isto o arquivo fica no bucket sem nenhuma linha
    // apontando para ele — invisível e impossível de remover pela interface.
    await supabase.storage
      .from(RDC_PHOTOS_BUCKET)
      .remove([path])
      .catch(() => undefined);
    throw erro;
  }
}

/** URL assinada (temporária) para exibir/baixar uma foto privada do RDC. */
export async function getSignedPhotoUrl(path: string, ttlSeconds = 3600): Promise<string | null> {
  if (!path || path.startsWith("demo/")) return null;
  const { data } = await supabase.storage.from(RDC_PHOTOS_BUCKET).createSignedUrl(path, ttlSeconds);
  return data?.signedUrl ?? null;
}

export async function deletePhoto(photo: RdcPhoto): Promise<void> {
  if (photo.storagePath && !photo.storagePath.startsWith("demo/")) {
    await supabase.storage.from(RDC_PHOTOS_BUCKET).remove([photo.storagePath]);
  }
  await deleteFieldRecord(photo.id);
}
