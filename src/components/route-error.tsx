import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";

// Error boundary com escopo de conteúdo: ao contrário do errorComponent do
// __root (tela cheia), este renderiza dentro da área principal, preservando a
// top-nav. Usado como `defaultErrorComponent` do router, então vale para todas
// as rotas que não definem o seu próprio.
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  console.error(error);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Esta seção não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado ao carregar este módulo. Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}
