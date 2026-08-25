import { cn } from "@/lib/utils";
import { localDateOf } from "@/lib/date-local";
import { EmptyState } from "@/components/empty-state";
import { PanelBody, PanelHeader, PanelShell } from "@/components/panel";

// Agenda recurso × tempo — o padrão "Bookings" (sala×hora) traduzido: linhas
// são recursos (veículos, máquinas), colunas são dias ou horas, e cada célula
// empilha os cartões daquele cruzamento.
//
// Deliberadamente CELULAR, não contínua: o Gantt da Linha do Tempo posiciona
// faixas por percentual porque ciclo de safra tem início e fim espalhados por
// meses. Aqui o dado real tem precisão de dia (cargas) ou de hora cheia
// (remessas), e célula discreta evita toda a aritmética de sobreposição — dois
// cartões no mesmo dia simplesmente empilham.
//
// O cartão segue o EventChip do calendário: borda esquerda colorida SÓ por
// estado (regra do produto — cor é estado, nunca decoração).

export type AgendaItem = {
  id: string;
  recursoId: string;
  /** Chave da coluna: "YYYY-MM-DD" no modo dias, "HH" no modo horas. */
  coluna: string;
  titulo: string;
  subtitulo?: string;
  tone?: "neutro" | "success" | "warning" | "destructive";
};

export type AgendaRecursoLinha = {
  id: string;
  label: string;
  /** Ex.: "sem cadastro na frota" — aparece abaixo do rótulo. */
  hint?: string;
};

export type AgendaColunas =
  | { tipo: "dias"; inicio: Date; dias: number }
  | { tipo: "horas"; horaInicio: number; horaFim: number };

const TONE_BORDA: Record<NonNullable<AgendaItem["tone"]>, string> = {
  neutro: "border-l-border",
  success: "border-l-success",
  warning: "border-l-warning",
  destructive: "border-l-destructive",
};

const DIA_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function colunasDe(
  colunas: AgendaColunas,
  hoje: string,
): Array<{ chave: string; rotulo: string; ehAgora: boolean }> {
  if (colunas.tipo === "horas") {
    const horaAgora = new Date().getHours();
    return Array.from({ length: colunas.horaFim - colunas.horaInicio + 1 }, (_, i) => {
      const h = colunas.horaInicio + i;
      return {
        chave: String(h).padStart(2, "0"),
        rotulo: `${String(h).padStart(2, "0")}h`,
        ehAgora: h === horaAgora,
      };
    });
  }
  return Array.from({ length: colunas.dias }, (_, i) => {
    const d = new Date(colunas.inicio);
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    const chave = localDateOf(d.toISOString());
    return {
      chave,
      rotulo: `${DIA_SEMANA[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      ehAgora: chave === hoje,
    };
  });
}

export function AgendaRecurso({
  titulo,
  descricao,
  recursos,
  itens,
  colunas,
  onItem,
  onCelulaVazia,
  className,
}: {
  titulo: string;
  descricao?: string;
  recursos: AgendaRecursoLinha[];
  itens: AgendaItem[];
  colunas: AgendaColunas;
  /** Clique num cartão — abre a ficha do registro. */
  onItem?: (id: string) => void;
  /** Clique no "+ Adicionar" de uma célula vazia, com recurso e coluna pré-escolhidos. */
  onCelulaVazia?: (recursoId: string, coluna: string) => void;
  className?: string;
}) {
  const hoje = localDateOf(new Date().toISOString());
  const cols = colunasDe(colunas, hoje);

  return (
    <PanelShell className={className}>
      <PanelHeader title={titulo} description={descricao} />
      <PanelBody>
        {recursos.length === 0 ? (
          <EmptyState
            title="Nenhum recurso para agendar"
            description="Cadastre veículos na Frota para ver a agenda."
          />
        ) : (
          // Conteúdo largo rola no PRÓPRIO container — nunca overflow no
          // ancestral, que viraria scroll container e mataria sticky.
          <div className="overflow-x-auto">
            <div className="min-w-[840px]">
              {/* cabeçalho de colunas */}
              <div
                className="grid border-b border-border pl-44"
                style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}
              >
                {cols.map((c) => (
                  <div
                    key={c.chave}
                    className={cn(
                      "border-l border-border px-1.5 pb-2 text-[10px] font-bold uppercase",
                      c.ehAgora ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {c.rotulo}
                    {c.ehAgora && colunas.tipo === "dias" && (
                      <span className="ml-1 rounded bg-primary px-1 py-0.5 text-[9px] font-semibold text-primary-foreground">
                        hoje
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {recursos.map((recurso) => (
                <div
                  key={recurso.id}
                  className="flex items-stretch border-b border-border last:border-0"
                >
                  <div className="w-44 shrink-0 py-2 pr-3">
                    <div className="truncate text-sm font-semibold">{recurso.label}</div>
                    {recurso.hint && (
                      <div className="truncate text-[11px] text-muted-foreground">
                        {recurso.hint}
                      </div>
                    )}
                  </div>
                  <div
                    className="grid flex-1"
                    style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}
                  >
                    {cols.map((c) => {
                      const daCelula = itens.filter(
                        (i) => i.recursoId === recurso.id && i.coluna === c.chave,
                      );
                      return (
                        <div
                          key={c.chave}
                          className={cn(
                            "group/celula min-h-14 space-y-1 border-l border-border p-1",
                            c.ehAgora && "bg-primary/5",
                          )}
                        >
                          {daCelula.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={onItem ? () => onItem(item.id) : undefined}
                              className={cn(
                                "block w-full truncate rounded border-l-2 bg-muted/60 px-1.5 py-1 text-left text-[11px] leading-tight transition-colors",
                                TONE_BORDA[item.tone ?? "neutro"],
                                onItem && "hover:bg-muted",
                              )}
                              title={`${item.titulo}${item.subtitulo ? ` · ${item.subtitulo}` : ""}`}
                            >
                              <span className="block truncate font-medium">{item.titulo}</span>
                              {item.subtitulo && (
                                <span className="block truncate text-muted-foreground">
                                  {item.subtitulo}
                                </span>
                              )}
                            </button>
                          ))}
                          {daCelula.length === 0 && onCelulaVazia && (
                            <button
                              type="button"
                              onClick={() => onCelulaVazia(recurso.id, c.chave)}
                              className="hidden h-full min-h-10 w-full items-center justify-center rounded border border-dashed border-border text-[11px] text-muted-foreground hover:bg-muted/40 group-hover/celula:flex"
                              aria-label={`Adicionar em ${recurso.label}, ${c.rotulo}`}
                            >
                              + Adicionar
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PanelBody>
    </PanelShell>
  );
}
