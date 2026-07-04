---
name: forms-zod-rhf
description: Como escrever formulários e validação no AgroTorre com zod (schemas em src/features/*/schemas) + react-hook-form + shadcn ui/form, com mensagens em pt-BR. Use ao criar/editar formulário, validar payload ou definir schema de domínio.
---

# Formulários e validação (zod + RHF)

Deps instaladas: `zod`, `react-hook-form`, `@hookform/resolvers`. Primitivos de UI: `src/components/ui/form.tsx` (exporta `Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField`).

## Schema é a fonte da verdade (pt-BR nas mensagens)

Coloque schemas em `src/features/<feature>/schemas/*.ts`. Modelo real (`src/features/talhao-360/schemas/domain.ts`):

```ts
import { z } from "zod";

export const talhaoRegistrationSchema = z.object({
  talhao: z.string().trim().min(1, "Informe o nome do talhão."),
  codigo: z.string().trim().min(1, "Informe o código."),
  area_ha: z.string().trim().min(1, "Informe a área."),
  status: z.enum(["Plantado", "Em preparo", "Colhido", "Pousio", "Planejado", "Inativo"]),
});
```

- Toda mensagem de erro em **pt-BR**.
- Regras cruzadas com `.refine(...)` (ex.: `cycleSchema` rejeita ciclo com `fimPrevisto` antes de `inicio`).
- Exporte o tipo: `export type TalhaoRegistration = z.infer<typeof talhaoRegistrationSchema>;`.

## Validação hoje: parse direto

O código atual valida chamando o schema diretamente (fora de render). Prefira `safeParse` para tratar erro sem `throw`:

```ts
const parsed = talhaoRegistrationSchema.safeParse(input);
if (!parsed.success) {
  toast.error(parsed.error.issues[0]?.message); // sonner, pt-BR
  return;
}
// parsed.data está tipado
```

## Formulário controlado (react-hook-form + resolver)

Ao montar um `<form>` interativo, ligue o schema ao RHF via `zodResolver` e use os primitivos `Form*`:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const form = useForm<TalhaoRegistration>({ resolver: zodResolver(talhaoRegistrationSchema) });
// <Form {...form}> ... <FormField control={form.control} name="codigo" render={...} /> ... </Form>
```

`FormMessage` renderiza a mensagem pt-BR do zod automaticamente.

## Persistência

Ao inserir no Supabase, NÃO envie `org_id` — o trigger `set_org_id` preenche via `current_org_id()`. RLS é a segurança real.

## Faça / Evite

- Faça: uma pasta `schemas/` por feature; `z.infer` para tipos; mensagens pt-BR.
- Faça: `safeParse` para fluxos com erro tratável; `zodResolver` em forms controlados.
- Evite: validar à mão o que o schema já cobre (DRY).
- Evite: duplicar tipos manuais quando `z.infer` resolve.

## Gate (nvm primeiro)

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm run typecheck && npm run lint && npm run test:run && npm run build
```
