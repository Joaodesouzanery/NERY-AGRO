import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { acharBrincoExato, filtrarAnimais } from "@/features/pecuaria/lib/busca";
import type { PecAnimal } from "@/features/pecuaria/types/domain";

// Campo de busca de animal por brinco. Substitui a lista suspensa: com centenas
// de cabeças, rolar um <select> é inviável — no curral se digita o brinco.
// Teclado: ↑ ↓ para navegar, Enter confirma, Esc fecha.

export function BuscaAnimal({
  animais,
  value,
  onChange,
  placeholder = "Digite o brinco…",
  id,
}: {
  animais: PecAnimal[];
  /** id do animal selecionado, ou "" */
  value: string;
  onChange: (animalId: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [consulta, setConsulta] = useState("");
  const [aberto, setAberto] = useState(false);
  const [destacado, setDestacado] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selecionado = useMemo(
    () => (value ? (animais.find((a) => a.id === value) ?? null) : null),
    [animais, value],
  );

  const resultados = useMemo(() => filtrarAnimais(animais, consulta, 8), [animais, consulta]);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [aberto]);

  useEffect(() => setDestacado(0), [consulta]);

  const escolher = (animalId: string) => {
    onChange(animalId);
    setConsulta("");
    setAberto(false);
  };

  const limpar = () => {
    onChange("");
    setConsulta("");
    setAberto(false);
  };

  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setAberto(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberto(true);
      setDestacado((i) => Math.min(i + 1, resultados.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestacado((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      // Digitou o brinco inteiro? confirma direto, sem precisar da lista.
      const exato = acharBrincoExato(animais, consulta);
      const alvo = exato ?? resultados[destacado];
      if (alvo) escolher(alvo.id);
    }
  };

  // Animal já escolhido: mostra o chip com o brinco e o botão de limpar.
  if (selecionado) {
    return (
      <div className="flex h-9 items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-sm">
        <span className="truncate">
          <span className="font-medium">{selecionado.brinco_visual ?? "sem brinco"}</span>
          {selecionado.categoria && (
            <span className="ml-2 text-xs text-muted-foreground">{selecionado.categoria}</span>
          )}
        </span>
        <button
          type="button"
          onClick={limpar}
          aria-label="Trocar animal"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const listboxId = id ? `${id}-listbox` : "busca-animal-listbox";

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          role="combobox"
          aria-expanded={aberto}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          className="pl-8"
          value={consulta}
          placeholder={placeholder}
          onFocus={() => setAberto(true)}
          onChange={(e) => {
            setConsulta(e.target.value);
            setAberto(true);
          }}
          onKeyDown={aoTeclar}
        />
      </div>

      {aberto && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md"
        >
          {resultados.length ? (
            resultados.map((a, i) => (
              <li key={a.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === destacado}
                  onMouseEnter={() => setDestacado(i)}
                  onMouseDown={(e) => e.preventDefault()} // não perde o foco antes do clique
                  onClick={() => escolher(a.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                    i === destacado ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                  )}
                >
                  <span className="font-medium tabular-nums">
                    {a.brinco_visual ?? "sem brinco"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[a.categoria, a.raca].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-2 py-2 text-sm text-muted-foreground">
              Nenhum brinco encontrado para “{consulta.trim()}”.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
