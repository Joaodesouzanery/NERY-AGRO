import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { demoBloqueado, ehErroDeDemo } from "@/lib/demo-mensagens";

// `useMutation` que trata o modo DEMO de um jeito só.
//
// O produto tinha três comportamentos diferentes para a mesma situação:
//  (a) a maioria das telas checa `demoMode` antes e mostra um aviso azul;
//  (b) Insumos e Calendário gravam num store local (o dado fica no navegador);
//  (c) a Pecuária NÃO checava — a mutação disparava, `assertNotDemo()` lançava,
//      e a mensagem chegava VERMELHA, como se o produto tivesse quebrado. Nove
//      arquivos, sem nenhum `useDemoMode` importado.
//
// Este wrapper resolve (c) sem repetir a checagem em cada uma das dezenas de
// mutações: em DEMO ele nem dispara, e explica em tom de aviso. `assertNotDemo`
// continua no data layer como backstop — ele é quem garante que nada chegue ao
// banco, e não sai daqui.
//
// Trocar `useMutation` por `useMutacaoReal` é a única mudança no call site.

export function useMutacaoReal<TData = unknown, TError = Error, TVariables = void>(
  options: UseMutationOptions<TData, TError, TVariables> & {
    /** Verbo para a mensagem: "excluir", "cadastrar", "editar". */
    acaoDemo?: string;
  },
) {
  const { demoMode } = useDemoMode();
  const { acaoDemo, mutationFn, onError, ...resto } = options;

  return useMutation<TData, TError, TVariables>({
    ...resto,
    // `...args` em vez de assinatura fixa: esta versão do TanStack Query passa
    // um `MutationFunctionContext` além das variáveis, e repassar cegamente
    // mantém o wrapper correto se a assinatura mudar de novo.
    mutationFn: async (...args: Parameters<NonNullable<typeof mutationFn>>) => {
      if (demoMode) {
        // Erro reconhecível pelo `onError` abaixo, para virar aviso em vez de
        // falha — e para não vazar texto técnico ao usuário.
        throw new Error(demoBloqueado(acaoDemo));
      }
      if (!mutationFn) throw new Error("mutationFn ausente.");
      return mutationFn(...args);
    },
    onError: (...args: Parameters<NonNullable<typeof onError>>) => {
      const erro = args[0];
      // Tentativa de escrever em DEMO é aviso, não falha: nada quebrou, a
      // pessoa só está na vitrine.
      if (ehErroDeDemo(erro) || (erro as Error)?.message?.startsWith("Você está no modo DEMO")) {
        toast.info((erro as Error).message);
        return;
      }
      onError?.(...args);
    },
  });
}
