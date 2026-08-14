-- ============================================================================
-- Contas globais da NERY AGRO: neryadministrativo@ E joaodsouzanery@
-- ----------------------------------------------------------------------------
-- Correção de rota. A migração 20260731120000_single_global_admin.sql (removida
-- do repo) rebaixava joaodsouzanery@ a membro comum, por leitura errada do
-- pedido: "uma empresa global" é a Nery Agro — e as DUAS contas dela são
-- globais. Empresa cliente (Fazenda Matrice) é que nunca é global.
--
-- Este script é idempotente e seguro nos dois cenários: se a migração errada
-- chegou a rodar, ele desfaz; se não rodou, não muda nada.
-- ============================================================================

-- 1) Allowlist com as duas contas (handle_new_user() lê isto a cada cadastro,
--    então é o que garante o privilégio se um login for recriado).
insert into public.platform_admin_emails (email) values
  ('neryadministrativo@gmail.com'), ('joaodsouzanery@gmail.com')
on conflict (email) do nothing;

-- 2) Quem já existe no Auth e está na allowlist volta a ser admin global.
insert into public.platform_admins (user_id)
select u.id
from auth.users u
join public.platform_admin_emails e on lower(e.email) = lower(u.email)
on conflict do nothing;

-- 3) Se a migração errada tinha vinculado joaodsouzanery@ como membro de uma
--    empresa, o vínculo perde a razão de ser: admin global escolhe a empresa
--    ativa pelo seletor (admin_active_org), não por membership. Um membership
--    residual não quebra nada, mas confunde a leitura de "quem é de qual
--    empresa" — então sai.
delete from public.organization_members m
using auth.users u, public.platform_admins pa
where m.user_id = u.id
  and pa.user_id = u.id
  and lower(u.email) = 'joaodsouzanery@gmail.com';

-- ── Conferência ─────────────────────────────────────────────────────────────
-- Esperado: as DUAS contas da Nery Agro.
select u.email as admin_global
from public.platform_admins pa
join auth.users u on u.id = pa.user_id
order by u.email;

-- Esperado: gerencia.adm.fin@fazendamatrice.com.br como owner da Fazenda
-- Matrice, e NENHUMA conta @gmail da Nery Agro nesta lista.
select o.nome as empresa, u.email as usuario, m.role
from public.organization_members m
join public.organizations o on o.id = m.org_id
join auth.users u on u.id = m.user_id
order by o.nome, u.email;
