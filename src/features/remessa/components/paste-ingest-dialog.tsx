import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ClipboardPaste, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parseRomaneio, type Confianca, type RomaneioKind } from "@/lib/romaneio-parse";
import { createOperationRecord } from "@/lib/supabase-operations";
import { createFieldRecord } from "@/lib/supabase-field";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { cn } from "@/lib/utils";

// "Caixa de entrada": cola o texto do WhatsApp/romaneio → extrai (determinístico)
// → confere (editável) → salva registro estruturado. Sem IA. Sempre com
// conferência humana. A foto do romaneio entra num passo seguinte.

const KIND_LABEL: Record<RomaneioKind, string> = {
  remessa: "Remessa / Recebimento",
  corte: "Colheita / Corte",
  carregamento: "Carregamento (chapas)",
  "caixas-vazias": "Caixas vazias",
  desconhecido: "Não identificado",
};

const KIND_FIELDS: Record<RomaneioKind, Array<{ key: string; label: string }>> = {
  remessa: [
    { key: "data", label: "Data" },
    { key: "fazenda", label: "Fazenda" },
    { key: "talhao", label: "Talhão" },
    { key: "pivo", label: "Pivô" },
    { key: "cultura", label: "Cultura" },
    { key: "variedade", label: "Variedade" },
    { key: "placa", label: "Placa" },
    { key: "motorista", label: "Motorista" },
    { key: "qtd_caixas", label: "Qtd. caixas" },
    { key: "unidade", label: "Unidade" },
    { key: "peso_bruto", label: "Peso bruto" },
    { key: "tara", label: "Tara" },
    { key: "peso_liquido", label: "Peso líquido" },
    { key: "media", label: "Média (kg/cx)" },
    { key: "hora_saida", label: "Hora saída" },
    { key: "hora_chegada", label: "Hora chegada" },
    { key: "ficou_na_lavoura", label: "Ficou na lavoura" },
    { key: "ordem_producao", label: "Ordem de produção" },
    { key: "status", label: "Status" },
  ],
  corte: [
    { key: "data", label: "Data" },
    { key: "fazenda", label: "Fazenda" },
    { key: "pivo", label: "Pivô" },
    { key: "talhao", label: "Talhão" },
    { key: "turma", label: "Turma" },
    { key: "cortadores", label: "Cortadores" },
    { key: "qtd_caixas", label: "Total de caixas" },
    { key: "media", label: "Média/pessoa" },
    { key: "carga_horaria", label: "Carga horária" },
    { key: "preco_caixa", label: "Preço/caixa" },
  ],
  carregamento: [
    { key: "data", label: "Data" },
    { key: "fazenda", label: "Fazenda" },
    { key: "chapas", label: "Chapas" },
    { key: "qtd_caixas", label: "Total de caixas" },
    { key: "media", label: "Média/chapa" },
    { key: "preco_caixa", label: "Preço/caixa" },
    { key: "carretas_vazias", label: "Carretas de vazias" },
  ],
  "caixas-vazias": [
    { key: "data", label: "Data" },
    { key: "fazenda", label: "Fazenda" },
    { key: "placa", label: "Placa" },
    { key: "tipo", label: "Tipo (saida_campo / retorno_campo)" },
    { key: "qtd_caixas", label: "Quantidade" },
  ],
  desconhecido: [
    { key: "data", label: "Data" },
    { key: "fazenda", label: "Fazenda" },
    { key: "placa", label: "Placa" },
    { key: "qtd_caixas", label: "Quantidade" },
  ],
};

const confBadge: Record<Confianca, string> = {
  alta: "bg-emerald-500/15 text-emerald-600",
  media: "bg-amber-500/15 text-amber-600",
  baixa: "bg-rose-500/15 text-rose-600",
};

export function PasteIngestButton({ onSaved }: { onSaved?: () => void } = {}) {
  const queryClient = useQueryClient();
  const { demoMode } = useDemoMode();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<RomaneioKind>("desconhecido");
  const [values, setValues] = useState<Record<string, string>>({});
  const [conf, setConf] = useState<Record<string, Confianca>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [extraiu, setExtraiu] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setText("");
    setKind("desconhecido");
    setValues({});
    setConf({});
    setWarnings([]);
    setExtraiu(false);
  };

  const extrair = () => {
    if (!text.trim()) {
      toast.info("Cole o texto do apontamento primeiro.");
      return;
    }
    const parsed = parseRomaneio(text);
    const { tipo: _tipo, ...fields } = parsed.fields;
    setKind(parsed.kind);
    setValues(fields);
    setConf(parsed.confidence);
    setWarnings(parsed.warnings);
    setExtraiu(true);
  };

  const fieldList = useMemo(() => KIND_FIELDS[kind] ?? KIND_FIELDS.desconhecido, [kind]);

  const salvar = async () => {
    if (demoMode) {
      toast.info("Modo DEMO — desligue para salvar de verdade.");
      return;
    }
    const payload: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) if (v?.trim()) payload[k] = v.trim();
    if (Object.keys(payload).length === 0) {
      toast.error("Nada para salvar — confira os campos.");
      return;
    }
    setSaving(true);
    try {
      if (kind === "corte" || kind === "carregamento") {
        await createFieldRecord({ module: `colheita-${kind}`, payload });
      } else if (kind === "caixas-vazias") {
        if (!payload.qtd && payload.qtd_caixas) payload.qtd = payload.qtd_caixas;
        if (!payload.tipo) payload.tipo = "saida_campo";
        await createOperationRecord({ area: "logistica", module: "caixas-vazias", payload });
      } else {
        // remessa (e desconhecido → tratado como remessa)
        await createOperationRecord({ area: "logistica", module: "remessa", payload });
      }
      await invalidateConnectedQueries(queryClient);
      toast.success("Registro salvo — já aparece na Torre em tempo real.");
      reset();
      setOpen(false);
      onSaved?.();
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted"
      >
        <ClipboardPaste className="h-4 w-4" />
        Colar apontamento
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Colar apontamento (WhatsApp / romaneio)</DialogTitle>
            <DialogDescription>
              Cole o texto; o sistema extrai os campos e você confere antes de salvar. Nada entra
              sem conferência.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder={
                "Ex.: Lorival placa NFN-6I47 com 881 cxs cebola TAILA talhão 03 PV 51 peso líquido de 19.178 kg média de 21.7"
              }
              className="min-h-[120px]"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={extrair}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4" />
                Extrair campos
              </button>
              {extraiu && (
                <span className="text-xs text-muted-foreground">
                  Tipo detectado — ajuste se necessário.
                </span>
              )}
            </div>

            {extraiu && (
              <>
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Tipo do apontamento</span>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as RomaneioKind)}
                    className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                  >
                    {(Object.keys(KIND_LABEL) as RomaneioKind[]).map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>

                {warnings.length > 0 && (
                  <div className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">
                    {warnings.map((w) => (
                      <div key={w} className="flex items-start gap-1.5">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {fieldList.map((f) => (
                    <label key={f.key} className="grid gap-1 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        {f.label}
                        {conf[f.key] && (
                          <span
                            className={cn(
                              "rounded px-1 py-0.5 text-[10px] font-medium",
                              confBadge[conf[f.key]],
                            )}
                          >
                            {conf[f.key]}
                          </span>
                        )}
                      </span>
                      <input
                        value={values[f.key] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        className="h-9 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvar}
              disabled={!extraiu || saving}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar registro"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
