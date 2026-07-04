---
name: react19-ui-patterns
description: Padrões de UI React 19 + shadcn/Radix + Tailwind 4 no AgroTorre (cn(), src/components/ui, ícones lucide, toasts sonner, mono-dark cantos quadrados) — use ao criar/editar componentes, telas ou formulários.
---

# UI React 19 no AgroTorre

Stack: React 19, Tailwind 4, shadcn/Radix, `lucide-react`, `sonner`, `react-hook-form` + `zod`. Design mono-dark, cantos quadrados. Strings visíveis SEMPRE em pt-BR.

## Composição de classes

- Combine classes com `cn(...)` de `src/lib/utils.ts` (`twMerge(clsx(...))`). Use para mesclar variantes e `className` recebido por prop.

```tsx
import { cn } from "@/lib/utils";
<div className={cn("rounded-none border border-border p-4", className)} />;
```

## Primitivos e tema

- Primitivos shadcn/Radix ficam em `src/components/ui/` — reutilize (`Button`, `Input`, `Card`, `Dialog`, `sonner`, etc.). Esses arquivos têm ~9 warnings de lint pré-existentes; NÃO os "conserte" de graça.
- Tema mono-dark: `<html className="dark">` no `__root.tsx`. Use tokens semânticos do Tailwind (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`) — não hardcode cores hex.
- Cantos quadrados: prefira `rounded-none`/`rounded-md`; `rounded-full` só onde já é padrão (avatares, pílulas). Imite a densidade e a nomenclatura do arquivo vizinho.

## Ícones e toasts

- Ícones via `lucide-react` (`import { Truck } from "lucide-react"`), tamanho por className (`className="h-4 w-4"`).
- Toasts via `sonner`: `import { toast } from "sonner"` e `toast.success("...")` / `toast.error("...")`. O `<Toaster theme="dark" position="top-right" />` já está montado no `__root.tsx` — não adicione outro.

## Formulários e inputs

- Inputs controlados; formulários com `react-hook-form` + resolver `zod`. Schemas ficam perto da feature (ex.: `src/features/*/schemas`) e são bons alvos de teste unitário.
- Componente reutilizável que recebe `ref`: use `forwardRef` (padrão dos primitivos em `src/components/ui`).

## Módulos e chrome do app

- O layout logado (sidebar + `OrgSwitcherBar` + `<main>`) já vem do `AppShell` em `__root.tsx`. Uma página de módulo (`/financeiro`, `/pecuaria`, `/campo`...) renderiza só o conteúdo dentro do `<Outlet />` — não redesenhe sidebar/topo.
- Módulos usam o padrão de "abas ricas" (uma superfície por aba). Ao criar uma aba/módulo novo, siga o blueprint em `docs/modules-rich-tabs-blueprint.md` e imite um módulo existente.
- Gráficos: use Recharts (ver skill `charts-recharts` se disponível); exportações (PDF/XLSX) seguem o prefixo de arquivo `agrotorre-*`.

## Server vs. cliente

- Efeitos/estado que dependem de `window`/`localStorage` só rodam no cliente — proteja com `typeof window !== "undefined"` quando necessário (o SSR renderiza o mesmo componente).

## Faça / Evite

- Faça: `cn()` para classes; tokens semânticos; reusar `src/components/ui`; strings em pt-BR; `_prefixo` em vars não usadas (regra do ESLint).
- Evite: `any` (ESLint = warn, evite mesmo assim); cores hex hardcoded; segundo `<Toaster>`; `rounded-full` fora dos casos já usados; gold-plating nos primitivos de `ui/`.
- Gate antes de concluir (nvm carregado): `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"` e então `npm run typecheck && npm run lint && npm run test:run && npm run build`.
