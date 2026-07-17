import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guarda de regressão de segurança: o schema canônico (usado em bancos NOVOS) não
// pode conceder acesso a `anon` nem ter policy `using (true)` — foi exatamente isso
// que abriu as tabelas core para qualquer visitante anônimo. Se alguém reintroduzir,
// este teste falha. (As migrações históricas não são editadas; a correção vive na
// migração de lockdown + neste guarda para o schema canônico.)

const root = process.cwd();
const schema = readFileSync(join(root, "supabase/schema.sql"), "utf8");

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
