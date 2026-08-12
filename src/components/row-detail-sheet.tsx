import type { ReactNode } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnexosPanel } from "@/components/anexos-panel";

// "Ver as informações completas" de um registro.
//
// A tabela mostra as colunas escolhidas — 6 de até 33 campos. Sem isto, a única
// forma de ver o resto era abrir o formulário de EDIÇÃO, o que transforma
// "quero conferir" em "posso alterar sem querer". Em Inteligência, Equipe,
// COGS e Sustentabilidade nem o seletor de colunas existia: os campos 7 em
// diante eram invisíveis, ponto.
//
// Mostra TODOS os campos preenchidos, incluindo os que não são coluna. Campo
// vazio fica de fora: uma lista com 20 traços não informa nada, e o que
// interessa é o que foi registrado.

export type RowDetailField = { key: string; label: string };

export function RowDetailSheet({
  open,
  onOpenChange,
  titulo,
  subtitulo,
  payload,
  fields,
  onEditar,
  onExcluir,
  anexos,
  extra,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  subtitulo?: string;
  payload: Record<string, string>;
  /** Rótulos conhecidos do módulo, na ordem do formulário. */
  fields: RowDetailField[];
  onEditar?: () => void;
  onExcluir?: () => void;
  /**
   * Liga a anexação de arquivos a este registro. Fica aqui, e não como campo do
   * formulário, porque o arquivo precisa de um id — que só existe depois de o
   * registro ser salvo.
   */
  anexos?: { refId: string; refModule: string };
  /** Bloco específico do módulo (ex.: tratativa de SLA), acima dos anexos. */
  extra?: ReactNode;
}) {
  const rotulos = new Map(fields.map((f) => [f.key, f.label]));

  // Ordem: primeiro os campos declarados do módulo (a ordem que a pessoa
  // conhece do formulário), depois o que veio no payload e não está declarado —
  // que existe de verdade, por importação ou por versão anterior do módulo, e
  // some da tela se a gente listar só o que o config conhece.
  const declarados = fields.filter((f) => (payload[f.key] ?? "").trim() !== "");
  const extras = Object.keys(payload)
    .filter((k) => !rotulos.has(k) && String(payload[k] ?? "").trim() !== "")
    .map((k) => ({ key: k, label: k }));
  const linhas = [...declarados, ...extras];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6">{titulo}</DialogTitle>
          {subtitulo && <p className="text-sm text-muted-foreground">{subtitulo}</p>}
        </DialogHeader>

        {linhas.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Este registro não tem nenhum campo preenchido.
          </p>
        ) : (
          <dl className="divide-y divide-border">
            {linhas.map(({ key, label }) => (
              <div key={key} className="flex items-start justify-between gap-4 py-2 text-sm">
                <dt className="shrink-0 text-muted-foreground">{label}</dt>
                <dd className="break-words text-right">{payload[key]}</dd>
              </div>
            ))}
          </dl>
        )}

        {extra}

        {anexos?.refId && <AnexosPanel refId={anexos.refId} refModule={anexos.refModule} />}

        {(onEditar || onExcluir) && (
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            {onEditar && (
              <button
                type="button"
                onClick={onEditar}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-accent"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            )}
            {onExcluir && (
              <button
                type="button"
                onClick={onExcluir}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/40 px-3 text-sm font-medium text-destructive transition hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
