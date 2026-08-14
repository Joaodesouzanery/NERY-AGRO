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
import {
  createOperationRecord,
  listOperationRecordsByAreaModule,
  updateOperationRecord,
} from "@/lib/supabase-operations";
import { createFieldRecord } from "@/lib/supabase-field";
import { matchRemessaCandidates, type MatchCandidate } from "@/lib/remessa-match";
import { origemDe, registrarFonte } from "@/features/remessa/lib/fontes";
import { ConciliarRemessaDialog } from "@/features/remessa/components/conciliar-remessa-dialog";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { draftHora, useFormDraft } from "@/lib/form-draft";
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
  const { orgId, user } = useAuth();
  const userId = user?.id;
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
  // Rascunho local do que foi DIGITADO. Colar e conferir um apontamento custa
  // de 2 a 5 minutos de atenção de alguém dentro de um caminhão; a rede volta em
  // 30 segundos, mas o texto não voltava nunca. `photos` fica de fora: File[]
  // não serializa, e um romaneio em base64 estoura a cota do localStorage.
  const [rascunhoAviso, setRascunhoAviso] = useState<string | null>(null);
  // Confronto foto × formulário (nada é sobrescrito sem escolha explícita).
  const [diff, setDiff] = useState<DiffLinha[] | null>(null);
  const [diffEscolhas, setDiffEscolhas] = useState<Record<string, EscolhaDiff>>({});
  const [diffKind, setDiffKind] = useState<RomaneioKind>("desconhecido");
  // Cargas já registradas que podem ser esta mesma (outra fonte da mesma carga).
  const [candidatos, setCandidatos] = useState<MatchCandidate[]>([]);

  const reset = () => {
    setRascunhoAviso(null);
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
    setCandidatos([]);
  };

  // Só o que é digitação entra no rascunho. `enabled: open` porque um diálogo
  // fechado não tem o que salvar — e reabrir é justamente quando se restaura.
  const rascunhoValor = { text, kind, values, conf, extraiu, queue, queueIndex, soConferir };
  const rascunho = useFormDraft("remessa-colar", rascunhoValor, { enabled: open && !demoMode });

  const restaurarRascunho = (d: typeof rascunhoValor) => {
    setText(d.text ?? "");
    setKind(d.kind ?? "desconhecido");
    setValues(d.values ?? {});
    setConf(d.conf ?? {});
    setExtraiu(Boolean(d.extraiu));
    setQueue(d.queue ?? []);
    setQueueIndex(d.queueIndex ?? 0);
    setSoConferir(Boolean(d.soConferir));
    setRascunhoAviso(null);
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

  // Memoizado: o diálogo de conciliação usa isto como dependência de useMemo —
  // recriar o objeto a cada render recalcularia o diff sem necessidade.
  const payloadAtual = useMemo(() => {
    const payload: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) if (v?.trim()) payload[k] = v.trim();
    return payload;
  }, [values]);

  const montarPayload = (): Record<string, string> | null =>
    Object.keys(payloadAtual).length ? payloadAtual : null;

  // Avança a fila do multi-colar ou fecha o diálogo.
  const seguirDepoisDeSalvar = () => {
    onSaved?.();
    if (restantes > 0) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      setPhotos([]);
      setOriginais([]);
      setCandidatos([]);
      applyBlock(queue[nextIndex]);
    } else {
      // Salvou de verdade: aí sim o rascunho some.
      rascunho.discard();
      reset();
      setOpen(false);
    }
  };

  // Sobe as fotos anexadas para o registro (novo ou conciliado) e avisa falhas
  // sem perder o registro já salvo.
  const anexarAoRegistro = async (refId: string, refModule: "remessa" | "caixas-vazias") => {
    if (!photos.length) return;
    if (!orgId) {
      toast.info("Registro salvo, mas a foto não foi anexada (sem empresa ativa).");
      return;
    }
    let falhas = 0;
    for (const file of photos) {
      try {
        await uploadRemessaPhoto({ orgId, refId, file, refModule });
      } catch (e) {
        falhas += 1;
        console.warn("[remessa] foto não subiu:", e);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["remessa-photos"] });
    if (falhas > 0) {
      toast.warning(
        `Registro salvo, mas ${falhas} de ${photos.length} foto(s) não subiram — tente anexar de novo.`,
      );
    }
  };

  const persistir = async (payload: Record<string, string>) => {
    setSaving(true);
    try {
      const origem = origemDe({ veioDeOcr: abaTexto === "ocr", campos: payload });
      const comFonte: Record<string, string> = {
        ...payload,
        fontes: registrarFonte(payload, origem, userId),
      };
      let created: { id: string };
      if (kind === "corte" || kind === "carregamento" || kind === "diarias") {
        created = await createFieldRecord({ module: `colheita-${kind}`, payload: comFonte });
      } else if (kind === "caixas-vazias") {
        if (!comFonte.qtd && comFonte.qtd_caixas) comFonte.qtd = comFonte.qtd_caixas;
        if (!comFonte.tipo) comFonte.tipo = "saida_campo";
        created = await createOperationRecord({
          area: "logistica",
          module: "caixas-vazias",
          payload: comFonte,
        });
      } else {
        created = await createOperationRecord({
          area: "logistica",
          module: "remessa",
          payload: comFonte,
        });
      }
      // origem da foto: separa a galeria de romaneios da de caixas vazias
      await anexarAoRegistro(created.id, kind === "caixas-vazias" ? "caixas-vazias" : "remessa");
      await invalidateConnectedQueries(queryClient);
      toast.success("Registro salvo — já aparece na Torre em tempo real.");
      seguirDepoisDeSalvar();
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const conciliar = async (candidato: MatchCandidate, payloadMesclado: Record<string, string>) => {
    setSaving(true);
    try {
      const origem = origemDe({ veioDeOcr: abaTexto === "ocr", campos: payloadMesclado });
      await updateOperationRecord({
        id: candidato.id,
        payload: { ...payloadMesclado, fontes: registrarFonte(payloadMesclado, origem, userId) },
      });
      await anexarAoRegistro(candidato.id, "remessa");
      await invalidateConnectedQueries(queryClient);
      toast.success("Fontes conciliadas na mesma carga.");
      setCandidatos([]);
      seguirDepoisDeSalvar();
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível conciliar.");
    } finally {
      setSaving(false);
    }
  };

  const salvar = async () => {
    if (demoMode) {
      toast.info("Modo DEMO — desligue para salvar de verdade.");
      return;
    }
    if (kind === "desconhecido") {
      toast.error("Escolha o tipo do apontamento antes de salvar.");
      return;
    }
    const payload = montarPayload();
    if (!payload) {
      toast.error("Nada para salvar — confira os campos.");
      return;
    }
    // Antes de criar mais uma linha solta, procura a MESMA carga já registrada
    // por outra fonte (texto × foto do romaneio × ticket da balança).
    if (kind === "remessa") {
      setSaving(true);
      try {
        const existentes = await listOperationRecordsByAreaModule("logistica", "remessa");
        const achados = matchRemessaCandidates(payload, existentes);
        if (achados.length) {
          setCandidatos(achados);
          return; // o diálogo de conciliação assume daqui
        }
      } catch (e) {
        // Buscar candidatos é melhoria, não pré-requisito: se falhar, salva novo.
        console.warn("[remessa] não deu para buscar cargas parecidas:", e);
      } finally {
        setSaving(false);
      }
    }
    await persistir(payload);
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
          // Fechar limpa a TELA, mas o rascunho fica em disco de propósito:
          // fechar sem querer (ou o navegador matar a aba) é justamente o caso
          // que ele existe para cobrir. Só o salvamento bem-sucedido descarta.
          if (!next) reset();
          else {
            const d = rascunho.read();
            if (d?.value?.text) setRascunhoAviso(d.savedAt);
          }
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
            {/* Oferta, não restauração automática: um formulário que se
                auto-preenche por cima do que a pessoa está digitando é pior que
                um que perdeu o texto. */}
            {rascunhoAviso && !text && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
                <span>Há um rascunho de {draftHora(rascunhoAviso)} não enviado.</span>
                <button
                  type="button"
                  onClick={() => {
                    const d = rascunho.read();
                    if (d) restaurarRascunho(d.value);
                  }}
                  className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                >
                  Recuperar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    rascunho.discard();
                    setRascunhoAviso(null);
                  }}
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground"
                >
                  Descartar
                </button>
                <span className="w-full text-xs text-muted-foreground">
                  As fotos precisam ser anexadas de novo.
                </span>
              </div>
            )}

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

      {candidatos.length > 0 && (
        <ConciliarRemessaDialog
          open
          onOpenChange={(next) => {
            if (!next) setCandidatos([]);
          }}
          candidatos={candidatos}
          novaFonte={payloadAtual}
          salvando={saving}
          onConciliar={(candidato, mesclado) => void conciliar(candidato, mesclado)}
          onCriarNovo={() => {
            const payload = montarPayload();
            setCandidatos([]);
            if (payload) void persistir(payload);
          }}
        />
      )}
    </>
  );
}
