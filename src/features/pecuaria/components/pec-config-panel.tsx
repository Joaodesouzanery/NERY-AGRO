import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { RichTabPanel } from "@/components/rich-tab";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { upsertConfig } from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import { useConfig } from "@/features/pecuaria/hooks/use-pecuaria";
import type { PecConfigPayload } from "@/features/pecuaria/lib/apartacao-config";

/**
 * Premissas de mercado da Pecuária.
 *
 * `upsertConfig` existia há tempos sem NENHUM chamador: `pec_config` nunca era
 * gravado, `getConfig` sempre devolvia null e `DEFAULT_PEC_CONFIG` não era
 * "padrão até configurar" — era o valor único do produto. O preço da arroba
 * ficava chumbado em R$ 320 e virava dinheiro na tela no KPI "Margem/@", sem
 * nenhuma tela para corrigi-lo. Agora tem esta.
 *
 * Só entram aqui as premissas de MERCADO. As constantes agronômicas (peso da UA,
 * rendimento de carcaça, consumo, descanso por forrageira) seguem com padrão
 * Embrapa em DEFAULT_PEC_CONFIG — são boas para todo mundo até que se ajuste.
 */
export function PecConfigPanel() {
  const queryClient = useQueryClient();
  const { demoMode } = useDemoMode();
  const configQ = useConfig();
  const cfg = configQ.data;

  const [preco, setPreco] = useState<string | null>(null);
  const [bezerro, setBezerro] = useState<string | null>(null);
  const [bezerra, setBezerra] = useState<string | null>(null);

  const valorDe = (chave: string) => {
    const atual = cfg?.valorMercadoPorCategoria?.[chave];
    return atual === undefined ? "" : String(atual);
  };
  const precoMostrado =
    preco ?? (cfg?.precoArrobaVenda === null ? "" : String(cfg?.precoArrobaVenda ?? ""));
  const bezerroMostrado = bezerro ?? valorDe("bezerro");
  const bezerraMostrado = bezerra ?? valorDe("bezerra");

  const mutation = useMutation({
    mutationFn: (payload: PecConfigPayload) => upsertConfig(payload),
    onSuccess: async () => {
      // `pecKeys.all` (não a folha): a margem/@ aparece na visão geral, nos
      // resultados e na rentabilidade por lote, cada uma na sua chave.
      await queryClient.invalidateQueries({ queryKey: pecKeys.all });
      toast.success("Premissas atualizadas — a margem/@ recalcula.");
      setPreco(null);
      setBezerro(null);
      setBezerra(null);
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar."),
  });

  const salvar = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para salvar configurações.");
    if (!cfg) return;

    const numero = (texto: string): number | null => {
      const limpo = texto.trim().replace(/\./g, "").replace(",", ".");
      if (!limpo) return null;
      const n = Number(limpo);
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    const precoNum = numero(precoMostrado);
    if (precoMostrado.trim() && precoNum === null) {
      return toast.error("Preço da arroba inválido — informe um valor maior que zero.");
    }

    // Categoria com campo vazio some da tabela: apagar o valor é uma edição
    // legítima ("não sei mais quanto vale"), não um erro a ignorar.
    const valorMercadoPorCategoria: Record<string, number> = {};
    const bezerroNum = numero(bezerroMostrado);
    const bezerraNum = numero(bezerraMostrado);
    if (bezerroNum !== null) valorMercadoPorCategoria.bezerro = bezerroNum;
    if (bezerraNum !== null) valorMercadoPorCategoria.bezerra = bezerraNum;

    mutation.mutate({ ...cfg, precoArrobaVenda: precoNum, valorMercadoPorCategoria });
  };

  const campos = [
    {
      label: "Preço da arroba (R$/@)",
      valor: precoMostrado,
      set: setPreco,
      hint: "Base da Margem/@ e do romaneio de venda",
    },
    {
      label: "Bezerro (R$/cabeça)",
      valor: bezerroMostrado,
      set: setBezerro,
      hint: "Transferência interna do desmame",
    },
    { label: "Bezerra (R$/cabeça)", valor: bezerraMostrado, set: setBezerra, hint: "" },
  ];

  return (
    <RichTabPanel
      title="Premissas de mercado"
      description="Preços da empresa — sem eles a margem aparece como “—”"
    >
      <div className="rounded-lg border border-border bg-background/60 p-4">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4" />
          Preços de venda e de transferência
        </h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Não têm valor padrão de propósito: cotação muda toda semana e varia por região e por
          comprador. Enquanto não forem informados, a Margem/@ mostra “—” em vez de um número que
          ninguém escolheu.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          {campos.map(({ label, valor, set, hint }) => (
            <label key={label} className="grid gap-1 text-xs text-muted-foreground">
              {label}
              <input
                inputMode="decimal"
                value={valor}
                onChange={(e) => set(e.target.value)}
                placeholder="não informado"
                className="h-9 w-40 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              {hint && <span className="text-[11px] text-muted-foreground/80">{hint}</span>}
            </label>
          ))}
          <button
            type="button"
            onClick={salvar}
            disabled={mutation.isPending || !cfg}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Salvar
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Constantes agronômicas (peso da UA, rendimento de carcaça, consumo, descanso das
          forrageiras) seguem com referência Embrapa e não são editadas aqui.
        </p>
      </div>
    </RichTabPanel>
  );
}
