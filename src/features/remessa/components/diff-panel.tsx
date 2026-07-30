import { cn } from "@/lib/utils";
import type { DiffLinha, EscolhaDiff } from "@/features/remessa/lib/diff";

// Painel de confronto entre duas fontes da MESMA carga: o que já está no
// formulário/registro x o que veio da foto (OCR) ou de outra mensagem.
// Regra: nada é sobrescrito sem o usuário escolher. Só campos divergentes ou
// novos são acionáveis; os iguais aparecem em cinza, para dar confiança de que
// as duas fontes batem. A lógica pura (calcular/aplicar) vive em lib/diff.ts.

function resumir(value: string): string {
  return value.length > 60 ? `${value.slice(0, 57)}...` : value;
}

export function DiffPanel({
  linhas,
  escolhas,
  onEscolher,
  tituloAtual = "No formulário",
  tituloNovo = "Nesta fonte",
}: {
  linhas: DiffLinha[];
  escolhas: Record<string, EscolhaDiff>;
  onEscolher: (key: string, escolha: EscolhaDiff) => void;
  tituloAtual?: string;
  tituloNovo?: string;
}) {
  const divergentes = linhas.filter((l) => !l.igual);
  const iguais = linhas.filter((l) => l.igual);

  if (!divergentes.length) {
    return (
      <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700">
        As duas fontes batem em todos os {iguais.length} campos — nada a decidir.
      </p>
    );
  }

  const botao = (linha: DiffLinha, lado: EscolhaDiff, valor: string) => (
    <button
      type="button"
      onClick={() => onEscolher(linha.key, lado)}
      title={valor || "(vazio)"}
      className={cn(
        "min-w-0 flex-1 rounded border px-2 py-1 text-left text-xs transition",
        escolhas[linha.key] === lado
          ? "border-primary bg-primary/10 font-medium text-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      <span className="block truncate">{valor ? resumir(valor) : "— vazio —"}</span>
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 pl-[8.5rem] text-[10px] uppercase tracking-wide text-muted-foreground">
        <span className="flex-1">{tituloAtual}</span>
        <span className="flex-1">{tituloNovo}</span>
      </div>
      <div className="space-y-1.5">
        {divergentes.map((l) => (
          <div key={l.key} className="flex items-center gap-2">
            <span className="w-32 shrink-0 truncate text-xs text-muted-foreground" title={l.label}>
              {l.label}
            </span>
            {botao(l, "atual", l.atual)}
            {botao(l, "novo", l.novo)}
          </div>
        ))}
      </div>
      {iguais.length > 0 && (
        <details className="rounded-lg border border-border bg-muted/30 p-2">
          <summary className="cursor-pointer text-[11px] text-muted-foreground">
            {iguais.length} campo(s) idêntico(s) nas duas fontes
          </summary>
          <div className="mt-2 space-y-1">
            {iguais.map((l) => (
              <div key={l.key} className="flex gap-2 text-[11px] text-muted-foreground">
                <span className="w-32 shrink-0 truncate">{l.label}</span>
                <span className="truncate">{resumir(l.atual)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
