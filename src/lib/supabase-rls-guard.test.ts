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
});
