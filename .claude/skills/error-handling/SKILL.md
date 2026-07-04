---
name: error-handling
description: Padrão de tratamento de erro do AgroTorre — use ao lidar com try/catch, falha de Supabase/rede, feedback ao usuário (toast), degradação sem crash ou erro em SSR.
---

# Tratamento de erro consistente

Princípio: **degradar sem crashar**, nunca engolir o erro, sempre dar contexto no log e feedback em pt-BR ao usuário.

## Padrões do repo

- **Supabase degrada, não quebra**: `src/integrations/supabase/client.ts` usa Proxy lazy e devolve um client _placeholder_ quando falta env, sem derrubar a app. Antes de operar, cheque:

  ```ts
  import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
  if (!isSupabaseConfigured()) {
    toast.error("Configuração indisponível. Tente novamente mais tarde.");
    return;
  }
  ```

- **Erro do Supabase vem no retorno, não como throw**: sempre inspecione `error`.

  ```ts
  const { data, error } = await supabase.from("field_records").select("*");
  if (error) {
    console.error("[field_records] select falhou", error);
    toast.error("Não foi possível carregar os registros.");
    return;
  }
  ```

- **Feedback ao usuário**: use `sonner` (`toast.error` / `toast.success`) com mensagem curta em pt-BR. Log técnico vai no `console.error` com prefixo/contexto — nunca despeje o erro cru na tela.
- **SSR**: `src/server.ts` é a entrada e normaliza a resposta (headers de segurança em toda resposta). Erro não tratado em rota vira 500; não deixe promise sem `await` no caminho de render.

## Faça / Evite

- Faça: logar com contexto identificável (`console.error("[modulo] ação falhou", error)`).
- Faça: `await` em toda promise; tratar `error` do Supabase em todo `select/insert/update`.
- Faça: mensagem ao usuário em pt-BR, curta e acionável; detalhe técnico só no console.
- Evite: `catch {}` vazio ou `catch (e) {}` que ignora — se não trata, não capture.
- Evite: `throw` cru chegando à UI, ou `alert()`; use `toast`.
- Evite: assumir que `supabase` está configurado — cheque `isSupabaseConfigured()`.
- Evite: promise flutuante (sem await) em handler async — floating promise mascara falha.
