import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ClipboardPaste, ImagePlus, ScanText, Save, Sparkles } from "lucide-react";
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
import {
  parseRomaneio,
  splitApontamentos,
  type Confianca,
  type RomaneioKind,
} from "@/lib/romaneio-parse";
import { createOperationRecord } from "@/lib/supabase-operations";
import { createFieldRecord } from "@/lib/supabase-field";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useAuth } from "@/hooks/use-auth";
import { uploadRemessaPhoto } from "@/features/remessa/api/services";
import { compressImage } from "@/lib/image-utils";
import { ocrRomaneioImages } from "@/lib/ocr-romaneio";
import { CAMPOS_INTERNOS, KIND_FIELDS, KIND_LABEL } from "@/features/remessa/lib/campos";
import { DiffPanel } from "@/features/remessa/components/diff-panel";
import {
  aplicarEscolhas,
  calcularDiff,
  escolhasPadrao,
  type DiffLinha,
  type EscolhaDiff,
} from "@/features/remessa/lib/diff";
import { cn } from "@/lib/utils";

// "Caixa de entrada": cola o texto do WhatsApp/romaneio → extrai (determinístico)
// → confere (editável) → salva registro estruturado. Sem IA. Sempre com
// conferência humana. A foto do romaneio entra num passo seguinte.

const confBadge: Record<Confianca, string> = {
  alta: "bg-emerald-500/15 text-emerald-600",
  media: "bg-amber-500/15 text-amber-600",
  baixa: "bg-rose-500/15 text-rose-600",
};

export function PasteIngestButton({ onSaved }: { onSaved?: () => void } = {}) {
  const queryClient = useQueryClient();
  const { demoMode } = useDemoMode();
  const { orgId } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<RomaneioKind>("desconhecido");
  const [values, setValues] = useState<Record<string, string>>({});
  const [conf, setConf] = useState<Record<string, Confianca>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [extraiu, setExtraiu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  // Originais (sem compressão) só para o OCR: a comprimida cai para 1600px e o
  // manuscrito do romaneio perde legibilidade justamente onde ele é mais fraco.
  const [originais, setOriginais] = useState<File[]>([]);
  const [otimizando, setOtimizando] = useState(false);
  const [ocrPct, setOcrPct] = useState<number | null>(null); // null = ocioso
  const [textoOcr, setTextoOcr] = useState("");
  const [abaTexto, setAbaTexto] = useState<"colado" | "ocr">("colado");
  const [queue, setQueue] = useState<string[]>([]); // multi-colar: blocos a conferir
  const [queueIndex, setQueueIndex] = useState(0);
  const [soConferir, setSoConferir] = useState(false); // modo rápido: só campos incertos
  // Confronto foto × formulário (nada é sobrescrito sem escolha explícita).
  const [diff, setDiff] = useState<DiffLinha[] | null>(null);
  const [diffEscolhas, setDiffEscolhas] = useState<Record<string, EscolhaDiff>>({});
  const [diffKind, setDiffKind] = useState<RomaneioKind>("desconhecido");

  const reset = () => {
    setText("");
    setKind("desconhecido");
    setValues({});
    setConf({});
    setWarnings([]);
    setExtraiu(false);
    setPhotos([]);
    setOriginais([]);
    setTextoOcr("");
    setAbaTexto("colado");
    setQueue([]);
    setQueueIndex(0);
    setSoConferir(false);
    setDiff(null);
    setDiffEscolhas({});
  };

  // aplica um bloco de texto no formulário de conferência
  const applyBlock = (block: string) => {
    const parsed = parseRomaneio(block);
    const { tipo: _tipo, ...fields } = parsed.fields;
    setKind(parsed.kind);
    setValues(fields);
    setConf(parsed.confidence);
    setWarnings(parsed.warnings);
    setExtraiu(true);
  };

  const textoAtivo = abaTexto === "ocr" ? textoOcr : text;

  const extrair = () => {
    if (!textoAtivo.trim()) {
      toast.info("Cole o texto do apontamento primeiro.");
      return;
    }
    const blocks = splitApontamentos(textoAtivo);
    setQueue(blocks);
    setQueueIndex(0);
    applyBlock(blocks[0]);
    if (blocks.length > 1) {
      toast.info(`Detectei ${blocks.length} apontamentos — confira e salve um de cada vez.`);
    }
  };

  // Anexa fotos já comprimidas/orientadas (fotos de celular são grandes; isso
  // economiza storage/banda e acelera a galeria). O original fica guardado só
  // para o OCR.
  const anexarFotos = async (files: File[]) => {
    if (!files.length) return;
    setOtimizando(true);
    try {
      setOriginais(files);
      setPhotos(await Promise.all(files.map((f) => compressImage(f))));
    } finally {
      setOtimizando(false);
    }
  };

  // OCR on-device de TODAS as fotos anexadas (um worker só) → texto → mesma
  // conferência do colar. Roda 100% no navegador; a foto não sai do dispositivo.
  // Quando já há campos conferidos, abre o confronto em vez de sobrescrever.
  const lerFotos = async () => {
    const fonte = originais.length ? originais : photos;
    if (!fonte.length) {
      toast.info("Anexe a foto do romaneio primeiro.");
      return;
    }
    setOcrPct(0);
    try {
      const textos = await ocrRomaneioImages(fonte, (pct) => setOcrPct(pct));
      // "---" é separador reconhecido por splitApontamentos: cada foto vira um
      // bloco na fila de conferência, sem código extra.
      const texto = textos.filter((t) => t.trim()).join("\n---\n");
      if (!texto.trim()) {
        toast.error("Não consegui ler texto na foto — tente uma mais nítida e enquadrada.");
        return;
      }
      setTextoOcr(texto);
      setAbaTexto("ocr");
      const blocks = splitApontamentos(texto);
      const parsed = parseRomaneio(blocks[0]);
      const { tipo: _tipo, ...camposFoto } = parsed.fields;

      if (extraiu) {
        // Já havia conferência em tela: confronta em vez de destruir.
        const linhas = calcularDiff(values, camposFoto);
        setDiff(linhas);
        setDiffEscolhas(escolhasPadrao(linhas));
        setDiffKind(parsed.kind);
        toast.info(`${fonte.length} foto(s) lida(s) — confira o que veio diferente.`);
        return;
      }
      setQueue(blocks);
      setQueueIndex(0);
      applyBlock(blocks[0]);
      toast.success(
        blocks.length > 1
          ? `${blocks.length} apontamentos lidos — confira e salve um de cada vez.`
          : "Foto lida — confira os campos e ajuste o manuscrito.",
      );
    } catch (e) {
      toast.error((e as Error).message || "Falha ao ler a foto.");
    } finally {
      setOcrPct(null);
    }
  };

  const aplicarDiff = () => {
    if (!diff) return;
    setValues(aplicarEscolhas(values, diff, diffEscolhas));
    // Campo que veio da foto perde a confiança do texto colado: quem escolheu
    // "da foto" precisa reler o valor manuscrito.
    setConf((c) => {
      const next = { ...c };
      for (const [key, escolha] of Object.entries(diffEscolhas)) {
        if (escolha === "novo") next[key] = "baixa";
      }
      return next;
    });
    if (kind === "desconhecido" && diffKind !== "desconhecido") setKind(diffKind);
    setDiff(null);
    setDiffEscolhas({});
    toast.success("Campos atualizados com o que você escolheu.");
  };

  const restantes = Math.max(0, queue.length - 1 - queueIndex);

  const fieldList = useMemo(() => {
    const all = KIND_FIELDS[kind] ?? KIND_FIELDS.desconhecido;
    if (!soConferir) return all;
    // modo rápido: esconde só os campos que vieram com confiança alta
    const filtered = all.filter((f) => conf[f.key] !== "alta");
    return filtered.length ? filtered : all;
  }, [kind, soConferir, conf]);

  // Campos extraídos que não pertencem ao tipo escolhido. Antes iam para o banco
  // sem nunca aparecer na tela — é assim que um erro de regex vazava sem revisão.
  const outrosCampos = useMemo(() => {
    const conhecidos = new Set((KIND_FIELDS[kind] ?? KIND_FIELDS.desconhecido).map((f) => f.key));
    return Object.keys(values).filter(
      (k) => !conhecidos.has(k) && !CAMPOS_INTERNOS.has(k) && values[k]?.trim(),
    );
  }, [kind, values]);

  const salvar = async () => {
    if (demoMode) {
      toast.info("Modo DEMO — desligue para salvar de verdade.");
      return;
    }
    if (kind === "desconhecido") {
      toast.error("Escolha o tipo do apontamento antes de salvar.");
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
      let created: { id: string };
      if (kind === "corte" || kind === "carregamento" || kind === "diarias") {
        created = await createFieldRecord({ module: `colheita-${kind}`, payload });
      } else if (kind === "caixas-vazias") {
        if (!payload.qtd && payload.qtd_caixas) payload.qtd = payload.qtd_caixas;
        if (!payload.tipo) payload.tipo = "saida_campo";
        created = await createOperationRecord({
          area: "logistica",
          module: "caixas-vazias",
          payload,
        });
      } else {
        created = await createOperationRecord({ area: "logistica", module: "remessa", payload });
      }
      // origem da foto: separa a galeria de romaneios da de caixas vazias
      const refModule = kind === "caixas-vazias" ? "caixas-vazias" : "remessa";
      let fotoFalhas = 0;
      if (photos.length) {
        if (orgId) {
          for (const file of photos) {
            try {
              await uploadRemessaPhoto({ orgId, refId: created.id, file, refModule });
            } catch (e) {
              fotoFalhas += 1;
              console.warn("[remessa] foto não subiu:", e);
            }
          }
        } else {
          fotoFalhas = photos.length;
          toast.info("Registro salvo, mas a foto não foi anexada (sem empresa ativa).");
        }
      }
      await invalidateConnectedQueries(queryClient);
      if (photos.length) queryClient.invalidateQueries({ queryKey: ["remessa-photos"] });
      if (fotoFalhas > 0 && orgId) {
        toast.warning(
          `Registro salvo, mas ${fotoFalhas} de ${photos.length} foto(s) não subiram — tente anexar de novo.`,
        );
      } else {
        toast.success("Registro salvo — já aparece na Torre em tempo real.");
      }
      onSaved?.();
      if (restantes > 0) {
        // multi-colar: carrega o próximo apontamento para conferir
        const nextIndex = queueIndex + 1;
        setQueueIndex(nextIndex);
        setPhotos([]);
        setOriginais([]);
        applyBlock(queue[nextIndex]);
      } else {
        reset();
        setOpen(false);
      }
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
            {textoOcr && (
              <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 text-xs">
                {(["colado", "ocr"] as const).map((aba) => (
                  <button
                    key={aba}
                    type="button"
                    onClick={() => setAbaTexto(aba)}
                    className={cn(
                      "flex-1 rounded px-2 py-1 font-medium transition",
                      abaTexto === aba
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {aba === "colado" ? "Texto colado" : "Texto do OCR"}
                  </button>
                ))}
              </div>
            )}
            <Textarea
              value={textoAtivo}
              onChange={(e) =>
                abaTexto === "ocr" ? setTextoOcr(e.target.value) : setText(e.target.value)
              }
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

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 font-medium text-foreground transition hover:bg-muted">
                <ImagePlus className="h-4 w-4" />
                Anexar foto do romaneio
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void anexarFotos(Array.from(e.target.files ?? []))}
                />
              </label>
              {otimizando ? (
                <span>Otimizando foto...</span>
              ) : (
                photos.length > 0 && <span>{photos.length} foto(s) anexada(s)</span>
              )}
              {photos.length > 0 && !demoMode && (
                <button
                  type="button"
                  onClick={() => void lerFotos()}
                  disabled={ocrPct !== null || otimizando}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
                >
                  <ScanText className="h-4 w-4" />
                  {ocrPct !== null
                    ? `Lendo... ${ocrPct}%`
                    : photos.length > 1
                      ? `Ler ${photos.length} fotos (OCR)`
                      : "Ler foto (OCR)"}
                </button>
              )}
            </div>

            {diff && (
              <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-start gap-1.5 text-xs text-primary">
                  <ScanText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    A foto trouxe valores diferentes do que já estava conferido. Escolha, campo a
                    campo, o que vale — nada é sobrescrito sem você mandar.
                  </span>
                </div>
                <DiffPanel
                  linhas={diff}
                  escolhas={diffEscolhas}
                  onEscolher={(key, escolha) => setDiffEscolhas((e) => ({ ...e, [key]: escolha }))}
                  tituloAtual="No formulário"
                  tituloNovo="Na foto (OCR)"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={aplicarDiff}
                    className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    Aplicar escolhas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiff(null);
                      setDiffEscolhas({});
                    }}
                    className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium transition hover:bg-muted"
                  >
                    Descartar o que veio da foto
                  </button>
                </div>
              </div>
            )}

            {extraiu && (
              <>
                {queue.length > 1 && (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-primary">
                    <span>
                      Apontamento {queueIndex + 1} de {queue.length} — confira e salve; o próximo
                      aparece em seguida.
                    </span>
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={soConferir}
                    onChange={(e) => setSoConferir(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Modo rápido — mostrar só os campos a conferir
                </label>

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

                {outrosCampos.length > 0 && (
                  <details className="rounded-lg border border-border bg-muted/30 p-3">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Outros campos detectados ({outrosCampos.length}) — também serão salvos
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {outrosCampos.map((key) => (
                        <label key={key} className="grid gap-1 text-sm">
                          <span className="text-muted-foreground">{key}</span>
                          <input
                            value={values[key] ?? ""}
                            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                            className="h-9 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                          />
                        </label>
                      ))}
                    </div>
                  </details>
                )}
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
              {saving
                ? "Salvando..."
                : restantes > 0
                  ? `Salvar e próximo (${restantes} restante${restantes > 1 ? "s" : ""})`
                  : "Salvar registro"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
