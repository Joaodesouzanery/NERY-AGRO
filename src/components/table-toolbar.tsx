import { Columns3, RotateCcw, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PeriodPicker, type PeriodValue } from "@/components/period-picker";
import { cn } from "@/lib/utils";

// Barra de filtros das tabelas de módulo.
//
// Vive FORA do DataTable de propósito. A busca interna dele só varre as colunas
// visíveis — com 6 de 33 campos na tela, procurar por placa não achava nada. E,
// como ele filtra por dentro, não havia como o botão Exportar saber o que estava
// sendo visto. Com o filtro aqui, a tabela e o arquivo saem do mesmo conjunto.

export type CampoOpcao = { key: string; label: string };

export type FiltroCampo = {
  key: string;
  label: string;
  opcoes: string[];
  valor: string;
};

export function TableToolbar({
  busca,
  onBusca,
  buscaPlaceholder = "Buscar em todos os campos...",
  periodo,
  onPeriodo,
  filtros = [],
  onFiltro,
  colunas,
  onLimpar,
  total,
  visiveis,
}: {
  busca: string;
  onBusca: (valor: string) => void;
  buscaPlaceholder?: string;
  periodo?: PeriodValue;
  onPeriodo?: (valor: PeriodValue) => void;
  filtros?: FiltroCampo[];
  onFiltro?: (key: string, valor: string) => void;
  colunas?: {
    disponiveis: CampoOpcao[];
    visiveis: string[];
    alternar: (key: string) => void;
    restaurar: () => void;
  };
  onLimpar?: () => void;
  /** Total de registros antes do filtro, para o contador ser honesto. */
  total: number;
  /** Quantos sobraram depois do filtro. */
  visiveis: number;
}) {
  const filtrando = visiveis !== total;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
          placeholder={buscaPlaceholder}
          className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      </label>

      {periodo && onPeriodo && <PeriodPicker value={periodo} onChange={onPeriodo} />}

      {filtros.map((filtro) => (
        <select
          key={filtro.key}
          value={filtro.valor}
          onChange={(e) => onFiltro?.(filtro.key, e.target.value)}
          aria-label={filtro.label}
          className={cn(
            "h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40",
            filtro.valor && "border-primary/50 text-primary",
          )}
        >
          <option value="">{filtro.label}: todos</option>
          {filtro.opcoes.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      ))}

      {colunas && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-accent"
            >
              <Columns3 className="h-4 w-4" />
              Colunas
              <span className="text-xs text-muted-foreground">
                {colunas.visiveis.length}/{colunas.disponiveis.length}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="max-h-80 w-64 overflow-y-auto p-2">
            <div className="mb-1 px-2 py-1 text-xs text-muted-foreground">
              Escolha o que aparece na tabela e no arquivo exportado.
            </div>
            {colunas.disponiveis.map((campo) => {
              const marcado = colunas.visiveis.includes(campo.key);
              return (
                <label
                  key={campo.key}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => colunas.alternar(campo.key)}
                    className="h-4 w-4 accent-primary"
                  />
                  {campo.label}
                </label>
              );
            })}
            <button
              type="button"
              onClick={colunas.restaurar}
              className="mt-1 inline-flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar padrão
            </button>
          </PopoverContent>
        </Popover>
      )}

      {/* Contador honesto: com filtro ativo, diz de quantos — senão o usuário
          exporta "tudo" achando que são todos os registros. */}
      <span className="ml-auto text-xs text-muted-foreground">
        {filtrando ? `${visiveis} de ${total} registros` : `${total} registros`}
      </span>

      {filtrando && onLimpar && (
        <button
          type="button"
          onClick={onLimpar}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-muted-foreground transition hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" />
          Limpar
        </button>
      )}
    </div>
  );
}
