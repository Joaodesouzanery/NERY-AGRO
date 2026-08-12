import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guarda de regressão de segurança: o schema canônico (usado em bancos NOVOS) não
// pode conceder acesso a `anon` nem ter policy `using (true)` — foi exatamente isso
// que abriu as tabelas core para qualquer visitante anônimo. Se alguém reintroduzir,
// este teste falha. (As migrações históricas não são editadas; a correção vive na
// migração de lockdown + neste guarda para o schema canônico.)

const root = process.cwd();

// Remove comentários SQL (`-- linha` e `/* bloco */`) para não dar falso-positivo
// quando um comentário explica o padrão perigoso (ex.: o cabeçalho do lockdown).
function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");
}

const schema = stripSqlComments(readFileSync(join(root, "supabase/schema.sql"), "utf8"));

describe("RLS — schema canônico é seguro", () => {
  it("não concede nada para `anon`", () => {
    expect(schema).not.toMatch(/\bto\s+anon\b/i);
  });

  it("não tem policy permissiva `using (true)`", () => {
    expect(schema).not.toMatch(/using\s*\(\s*true\s*\)/i);
    expect(schema).not.toMatch(/with\s+check\s*\(\s*true\s*\)/i);
  });

  it("escopa as tabelas core por org (current_org_id)", () => {
    expect(schema).toMatch(/org_id\s*=\s*public\.current_org_id\(\)/);
  });
});

describe("RLS — migração de lockdown presente", () => {
  const lockdown = join(root, "supabase/migrations/20260717120000_rls_lockdown.sql");
  it("existe e revoga anon + recria org-scoped", () => {
    expect(existsSync(lockdown)).toBe(true);
    const sql = readFileSync(lockdown, "utf8");
    expect(sql).toMatch(/revoke all on public/i);
    expect(sql).toMatch(/org_id = public\.current_org_id\(\)/);
  });
});

describe("RLS — cobertura total: nenhuma tabela do schema fica sem RLS", () => {
  // Toda `create table ... public.X` precisa de RLS ligada — via `alter table ...
  // enable row level security` explícito OU dentro do loop `data_tables` (o bloco
  // DO que faz o enable/policies de cada tabela de dados). Foi a falta desse enable
  // em `platform_admin_emails` que expôs os e-mails dos super-admins.
  const createdTables = [...schema.matchAll(/create table if not exists (public\.\w+)/gi)].map(
    (m) => m[1],
  );
  const explicit = new Set(
    [...schema.matchAll(/alter table (public\.\w+) enable row level security/gi)].map((m) => m[1]),
  );
  const loopArray = schema.match(/data_tables\s+text\[\]\s*:=\s*array\[([\s\S]*?)\]/i)?.[1] ?? "";
  const looped = new Set([...loopArray.matchAll(/'(\w+)'/g)].map((m) => `public.${m[1]}`));
  const rlsCovered = new Set([...explicit, ...looped]);

  it("achou tabelas e o loop data_tables (sanidade do parser)", () => {
    expect(createdTables.length).toBeGreaterThan(10);
    expect(looped.size).toBeGreaterThan(10);
  });

  it("toda tabela public.* criada tem RLS habilitada", () => {
    const semRls = createdTables.filter((t) => !rlsCovered.has(t));
    expect(semRls, `tabelas sem RLS: ${semRls.join(", ") || "(nenhuma)"}`).toEqual([]);
  });

  it("platform_admin_emails tem RLS + revoga anon/authenticated (allowlist de super-admins)", () => {
    expect(schema).toMatch(/alter table public\.platform_admin_emails enable row level security/i);
    expect(schema).toMatch(
      /revoke all on public\.platform_admin_emails from anon,\s*authenticated/i,
    );
  });
});

describe("RLS — storage.objects só tem policy org-scoped", () => {
  // Esta suíte existe por causa de um vazamento real que passou meses de pé.
  //
  // A migração de protótipo (20260601024553) criou `animal_pdfs_read`:
  //   CREATE POLICY ... FOR SELECT USING (bucket_id = 'animal-pdfs')
  // Sem cláusula `TO`, o Postgres aplica a PUBLIC — `authenticated` E `anon`.
  //
  // A migração de isolamento tentou removê-la dropando `animal_pdfs_select`,
  // nome que NUNCA existiu. Insert, update e delete casaram; a de LEITURA não.
  // Policies são avaliadas em OR: bastava ela para qualquer um assinar o PDF de
  // qualquer empresa (bucket privado barra URL pública, mas createSignedUrl
  // passa pela RLS).
  //
  // A regra que sobrevive a isso: em storage.objects, ou a policy é
  // `org_files_*`, ou não existe. Nome fora do padrão é erro — foi exatamente
  // por um nome fora do padrão que ela escapou do drop.

  const PREFIXO_PERMITIDO = /^org_files_/;

  it("o schema canônico não cria policy de storage fora do padrão", () => {
    const criadas = [...schema.matchAll(/create policy "([^"]+)" on storage\.objects/gi)].map(
      (m) => m[1],
    );
    expect(criadas.length, "nenhuma policy de storage encontrada no schema").toBeGreaterThan(0);
    expect(criadas.filter((nome) => !PREFIXO_PERMITIDO.test(nome))).toEqual([]);
  });

  it("toda policy de storage do schema é `to authenticated` e compara org", () => {
    // Sem `to authenticated`, vale para anon. Sem a comparação de pasta, vale
    // para qualquer empresa. As duas juntas são o isolamento.
    const blocos = [
      ...schema.matchAll(/create policy "org_files_\w+" on storage\.objects([\s\S]*?);/gi),
    ].map((m) => m[1]);
    expect(blocos.length).toBeGreaterThan(0);
    for (const bloco of blocos) {
      expect(bloco).toMatch(/to authenticated/i);
      expect(bloco).toMatch(/storage\.foldername\(name\)\)\[1\] = public\.current_org_id\(\)/i);
    }
  });

  it("o schema dropa as policies abertas do protótipo, inclusive pelo nome CERTO", () => {
    // `animal_pdfs_read` é o nome real. Dropar só `animal_pdfs_select` é o erro
    // que deixou o furo aberto — e o `if exists` faz o drop do nome errado
    // passar silenciosamente.
    expect(schema).toMatch(/drop policy if exists "animal_pdfs_read" on storage\.objects/i);
  });

  it("os buckets têm limite de tamanho e de tipo no BANCO", () => {
    // O teto de 8 MB e o "só imagem" viviam apenas em JavaScript; quem chamasse
    // a API do Storage com o próprio token subia o que quisesse.
    expect(schema).toMatch(/file_size_limit/i);
    expect(schema).toMatch(/allowed_mime_types/i);
  });
});

describe("RLS — nenhuma migração NOVA reintroduz acesso aberto", () => {
  // Guarda só para frente: as migrações históricas têm o padrão antigo e não podem
  // ser editadas (a correção é a própria lockdown). Da lockdown em diante, ninguém
  // pode voltar a conceder `anon` nem criar policy `using (true)`.
  const CUTOFF = "20260717120000";
  const dir = join(root, "supabase/migrations");
  const novas = readdirSync(dir)
    .filter((f) => f.endsWith(".sql") && f.slice(0, 14) >= CUTOFF)
    .sort();

  it.each(novas)("%s não concede anon nem usa using(true)", (f) => {
    const sql = stripSqlComments(readFileSync(join(dir, f), "utf8"));
    expect(sql).not.toMatch(/\bto\s+anon\b/i);
    expect(sql).not.toMatch(/using\s*\(\s*true\s*\)/i);
  });

  // Lacuna que passou despercebida até agora: a checagem de "toda tabela tem
  // RLS" varria só o schema.sql. Tabela criada DENTRO de uma migração — como a
  // de backup da correção de datas, que guarda linhas de todas as empresas —
  // escapava. Tudo em `public` é exposto pelo PostgREST; tabela sem RLS ali é
  // leitura aberta para qualquer usuário autenticado de qualquer empresa.
  it.each(novas)("%s: tabela nova em public tem RLS ligada", (f) => {
    const sql = stripSqlComments(readFileSync(join(dir, f), "utf8"));
    const criadas = [...sql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi)].map(
      (m) => m[1],
    );
    const comRls = new Set(
      [...sql.matchAll(/alter table public\.(\w+) enable row level security/gi)].map((m) => m[1]),
    );
    expect(criadas.filter((t) => !comRls.has(t))).toEqual([]);
  });
});
