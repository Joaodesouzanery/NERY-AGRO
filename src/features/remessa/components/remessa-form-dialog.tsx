import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Save, Scale, Sprout, Warehouse } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createOperationRecord, updateOperationRecord } from "@/lib/supabase-operations";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { validatePayload } from "@/lib/payload-schemas";
import { etapaDe, quebraDe, type RemessaEtapa } from "@/lib/remessa-metrics";
import { REMESSA_TOLERANCIAS_PADRAO } from "@/lib/app-settings";
import { registrarFonte } from "@/features/remessa/lib/fontes";
import { uploadRemessaPhoto } from "@/features/remessa/api/services";
import { compressImage } from "@/lib/image-utils";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// Entrada 100% pelo sistema — sem passar pelo WhatsApp. As três seções espelham
// as três vias do romaneio de papel (Lavoura / Balança / Beneficiamento), e cada
// uma é salvável isoladamente: quem está na lavoura preenche a primeira, e quem
// está na balança ABRE A MESMA CARGA e preenche a segunda.

type CampoForm = {
  key: string;
  label: string;
  tipo?: "text" | "number" | "date" | "time";
  hint?: string;
};

type Secao = {
  id: RemessaEtapa;
  titulo: string;
  descricao: string;
  icon: React.ComponentType<{ className?: string }>;
  campos: CampoForm[];
  responsavel: string;
};

const SECOES: Secao[] = [
  {
    id: "lavoura",
    titulo: "Preencher na lavoura",
    descricao: "O que saiu do talhão",
    icon: Sprout,
    responsavel: "resp_lavoura",
    campos: [
      { key: "data", label: "Data", tipo: "date" },
      { key: "ordem_producao", label: "Ordem de produção", hint: "TL03 PV51 SATO CEB" },
      { key: "fazenda", label: "Fazenda" },
      { key: "talhao", label: "Talhão" },
      { key: "pivo", label: "Pivô" },
      { key: "cultura", label: "Cultura" },
      { key: "variedade", label: "Variedade" },
      { key: "hora_saida", label: "Hora de saída", tipo: "time" },
      { key: "qtd_caixas", label: "Qtd. de caixas", tipo: "number" },
      { key: "unidade", label: "Unidade", hint: "cx ou beg" },
      { key: "ficou_na_lavoura", label: "Ficou na lavoura", tipo: "number" },
    ],
  },
  {
    id: "balanca",
    titulo: "Preencher na balança",
    descricao: "A pesagem de saída",
    icon: Scale,
    responsavel: "resp_balanca",
    campos: [
      { key: "romaneio_num", label: "Nº do romaneio", hint: "9426" },
      { key: "pesagem_num", label: "Nº da pesagem", hint: "016417" },
      { key: "motorista", label: "Motorista" },
      { key: "placa", label: "Placa" },
      { key: "local_descarga", label: "Local de descarga" },
      { key: "hora_entrada_balanca", label: "Hora de entrada", tipo: "time" },
      { key: "hora_saida_balanca", label: "Hora de saída", tipo: "time" },
      { key: "peso_bruto", label: "Peso bruto (kg)", tipo: "number" },
      { key: "tara", label: "Tara (kg)", tipo: "number" },
      { key: "peso_liquido", label: "Peso líquido (kg)", tipo: "number" },
    ],
  },
  {
    id: "beneficiamento",
    titulo: "Preencher no beneficiamento",
    descricao: "A conferência de chegada",
    icon: Warehouse,
    responsavel: "resp_beneficiamento",
    campos: [
      { key: "hora_conferencia", label: "Hora da conferência", tipo: "time" },
      { key: "caixas_recebidas", label: "Caixas recebidas", tipo: "number" },
      { key: "peso_liquido_destino", label: "Peso conferido (kg)", tipo: "number" },
      { key: "beneficiamento", label: "Conferência", hint: "OK / pendente" },
    ],
  },
];

function num(v: string | undefined): number {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function RemessaFormDialog({
  registro,
  trigger,
  onSaved,
}: {
  /** Carga existente para continuar de onde parou; ausente = nova. */
  registro?: { id: string; payload: Record<string, string> };
  trigger?: React.ReactNode;
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();
  const { demoMode } = useDemoMode();
  const { orgId, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(registro?.payload ?? {});
  const [aberta, setAberta] = useState<RemessaEtapa>("lavoura");
  const [photos, setPhotos] = useState<File[]>([]);
  const [otimizando, setOtimizando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Reabre já na etapa em que a carga está: quem chega na balança não deve
  // precisar rolar por cima do que a lavoura já preencheu.
  useEffect(() => {
    if (!open) return;
    const atual = registro ? etapaDe(registro.payload) : "lavoura";
    setValues(registro?.payload ?? {});
    setAberta(atual === "conferida" ? "beneficiamento" : atual);
  }, [open, registro]);

  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  // Bruto − tara é o líquido; preencher sozinho evita erro de conta no pátio.
  const liquidoCalculado = useMemo(() => {
    const b = num(values.peso_bruto);
    const t = num(values.tara);
    return b > 0 && t > 0 && b > t ? b - t : null;
  }, [values.peso_bruto, values.tara]);
  const liquidoDivergente =
    liquidoCalculado != null &&
    num(values.peso_liquido) > 0 &&
    Math.abs(num(values.peso_liquido) - liquidoCalculado) > 50;

  const quebra = quebraDe(values, REMESSA_TOLERANCIAS_PADRAO);

  const anexarFotos = async (files: File[]) => {
    if (!files.length) return;
    setOtimizando(true);
    try {
      setPhotos(await Promise.all(files.map((f) => compressImage(f))));
    } finally {
      setOtimizando(false);
    }
  };

  const salvar = async (concluirEtapa: boolean) => {
    if (demoMode) {
      toast.info("Modo DEMO — desligue para salvar de verdade.");
      return;
    }
    const payload: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) if (v?.trim()) payload[k] = v.trim();
    if (concluirEtapa) {
      // Concluir carimba a etapa e o responsável; salvar parcial deixa a etapa
      // ser deduzida pelo que já existe (etapaDe).
      payload.etapa = aberta === "beneficiamento" ? "conferida" : aberta;
      payload[`etapa_${aberta}_em`] = new Date().toISOString();
      if (user?.id) payload[`etapa_${aberta}_por`] = user.id;
    }
    const check = validatePayload("remessa", payload);
    if (!check.ok) {
      toast.error(check.error);
      return;
    }
    setSalvando(true);
    try {
      const comFonte: Record<string, string> = {
        ...payload,
        fontes: registrarFonte(payload, "manual", user?.id),
      };
      const alvo = registro
        ? await updateOperationRecord({ id: registro.id, payload: comFonte })
        : await createOperationRecord({
            area: "logistica",
            module: "remessa",
            payload: comFonte,
          });
      if (photos.length && orgId) {
        let falhas = 0;
        for (const file of photos) {
          try {
            await uploadRemessaPhoto({ orgId, refId: alvo.id, file, refModule: "remessa" });
          } catch (e) {
            falhas += 1;
            console.warn("[remessa] foto não subiu:", e);
          }
        }
        queryClient.invalidateQueries({ queryKey: ["remessa-photos"] });
        if (falhas) toast.warning(`${falhas} foto(s) não subiram — tente anexar de novo.`);
      }
      await invalidateConnectedQueries(queryClient);
      toast.success(
        concluirEtapa
          ? "Etapa concluída — a carga avançou no ciclo."
          : "Carga salva — continue depois.",
      );
      onSaved?.();
      setPhotos([]);
      if (concluirEtapa) setOpen(false);
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger ?? (
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova remessa
          </button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{registro ? "Continuar carga" : "Nova remessa"}</DialogTitle>
            <DialogDescription>
              As três seções seguem as vias do romaneio de papel. Preencha só a sua e salve — quem
              estiver na próxima etapa abre esta mesma carga e continua.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {SECOES.map((secao) => {
              const ativa = aberta === secao.id;
              const Icone = secao.icon;
              const preenchidos = secao.campos.filter((c) => values[c.key]?.trim()).length;
              return (
                <div key={secao.id} className="rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setAberta(secao.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2.5 text-left transition",
                      ativa ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <Icone className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{secao.titulo}</span>
                      <span className="block text-xs text-muted-foreground">{secao.descricao}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {preenchidos}/{secao.campos.length}
                    </span>
                  </button>

                  {ativa && (
                    <div className="space-y-3 border-t border-border p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {secao.campos.map((c) => (
                          <label key={c.key} className="grid gap-1 text-sm">
                            <span className="text-muted-foreground">{c.label}</span>
                            <input
                              type={c.tipo ?? "text"}
                              inputMode={c.tipo === "number" ? "decimal" : undefined}
                              value={values[c.key] ?? ""}
                              placeholder={c.hint}
                              onChange={(e) => set(c.key, e.target.value)}
                              className="h-10 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                            />
                          </label>
                        ))}
                        <label className="grid gap-1 text-sm">
                          <span className="text-muted-foreground">Responsável</span>
                          <input
                            value={values[secao.responsavel] ?? ""}
                            onChange={(e) => set(secao.responsavel, e.target.value)}
                            className="h-10 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                          />
                        </label>
                      </div>

                      {secao.id === "balanca" && liquidoCalculado != null && (
                        <p
                          className={cn(
                            "text-xs",
                            liquidoDivergente ? "text-warning" : "text-muted-foreground",
                          )}
                        >
                          Bruto − tara = {liquidoCalculado.toLocaleString("pt-BR")} kg.{" "}
                          {liquidoDivergente ? (
                            "O líquido digitado não bate — confira a balança."
                          ) : (
                            <button
                              type="button"
                              onClick={() => set("peso_liquido", String(liquidoCalculado))}
                              className="underline underline-offset-2"
                            >
                              usar este valor
                            </button>
                          )}
                        </p>
                      )}

                      {secao.id === "beneficiamento" && quebra && (
                        <p
                          className={cn(
                            "text-xs",
                            quebra.nivel === "ok" ? "text-muted-foreground" : "text-warning",
                          )}
                        >
                          Quebra: {quebra.kg.toLocaleString("pt-BR")} kg ({quebra.pct}%)
                          {quebra.nivel !== "ok" && " — acima da tolerância, vai gerar alerta."}
                        </p>
                      )}

                      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted">
                        <ImagePlus className="h-4 w-4" />
                        {otimizando
                          ? "Otimizando..."
                          : photos.length
                            ? `${photos.length} foto(s)`
                            : "Anexar foto"}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => void anexarFotos(Array.from(e.target.files ?? []))}
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <button
              type="button"
              onClick={() => void salvar(false)}
              disabled={salvando}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              Salvar e continuar depois
            </button>
            <button
              type="button"
              onClick={() => void salvar(true)}
              disabled={salvando}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Concluir etapa"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
