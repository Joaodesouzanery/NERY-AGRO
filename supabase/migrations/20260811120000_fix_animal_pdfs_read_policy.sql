-- ════════════════════════════════════════════════════════════════════════
-- P0 — Fecha a policy de leitura aberta que sobreviveu ao isolamento por empresa
-- ------------------------------------------------------------------------
-- A migração 20260601024553 criou quatro policies abertas no bucket
-- `animal-pdfs`, da época em que o produto era protótipo com RLS aberta. A de
-- leitura chamava-se **animal_pdfs_read**:
--
--     CREATE POLICY "animal_pdfs_read" ON storage.objects
--       FOR SELECT USING (bucket_id = 'animal-pdfs');   -- sem TO → PUBLIC
--
-- A migração de isolamento (20260628140000) tentou removê-las e dropou
-- `animal_pdfs_select` — um nome que **nunca existiu**. As de insert, update e
-- delete casaram; a de SELECT, não. Ou seja: justamente a de LEITURA ficou.
--
-- Por que isso importa, mesmo com o bucket privado (`public = false`, feito na
-- mesma migração): bucket privado barra a URL pública direta, mas
-- `createSignedUrl` passa pela RLS de storage.objects. E policies são avaliadas
-- em **OR** — basta uma permitir. Sem cláusula `TO`, a policy vale para PUBLIC,
-- o que inclui `authenticated` e `anon`. Na prática: quem soubesse o caminho de
-- um PDF conseguiria assiná-lo, de qualquer empresa.
--
-- Idempotente: `if exists` torna seguro rodar mesmo se ela já tiver sumido.
-- ════════════════════════════════════════════════════════════════════════

drop policy if exists "animal_pdfs_read" on storage.objects;

-- Defesa em profundidade: qualquer outro nome legado que ainda esteja de pé.
drop policy if exists "animal_pdfs_select" on storage.objects;
drop policy if exists "rdc_photos_read" on storage.objects;
drop policy if exists "rdc_photos_select" on storage.objects;

-- ── Limites no BUCKET, não só em JavaScript ──────────────────────────────
-- O teto de 8 MB e o "só imagem" viviam apenas no cliente
-- (src/features/remessa/api/services.ts e rdc/components/photo-uploader.tsx).
-- Quem chamasse a API do Storage direto com o próprio token — o que qualquer
-- usuário autenticado pode fazer — subia um arquivo de qualquer tipo e tamanho.
update storage.buckets
   set file_size_limit = 8388608, -- 8 MB, o mesmo teto que a UI promete
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
 where id = 'rdc-photos';

update storage.buckets
   set file_size_limit = 8388608,
       allowed_mime_types = array['application/pdf']
 where id = 'animal-pdfs';

-- ════════════════════════════════════════════════════════════════════════
-- CONFIRA (tem que voltar ZERO linha — só as org_files_* devem existir):
--
--   select policyname, roles, cmd
--     from pg_policies
--    where schemaname = 'storage' and tablename = 'objects'
--      and policyname not like 'org_files_%';
--
-- E os limites aplicados:
--
--   select id, public, file_size_limit, allowed_mime_types
--     from storage.buckets where id in ('animal-pdfs', 'rdc-photos');
-- ════════════════════════════════════════════════════════════════════════
