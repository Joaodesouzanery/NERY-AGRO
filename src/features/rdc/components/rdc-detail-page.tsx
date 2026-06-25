import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Camera,
  FileDown,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  ListChecks,
  Save,
  Trash2,
  Wallet,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { StatKpi } from "@/components/stat-kpi";
import { Skeleton } from "@/components/ui/skeleton";
import { rdcKeys } from "@/features/rdc/api/query-keys";
import { deleteFicha, updateFicha } from "@/features/rdc/api/services";
import { useEmployeeOptions, useRdc } from "@/features/rdc/hooks/use-rdc";
import { SECAO_CONFIGS } from "@/features/rdc/data/section-config";
import { exportRdcPdf } from "@/features/rdc/pdf/rdc-pdf";
import { exportRdcCsv } from "@/features/rdc/pdf/rdc-csv";
import { fillFichaFromText } from "@/features/rdc/data/text-fill";
import { fileToDataUrl, getRdcLogo, setRdcLogo } from "@/features/rdc/data/logo";
import { ATIVIDADES_AGRO, CLIMA_OPTIONS, type RdcFicha } from "@/features/rdc/types/domain";
import { RdcSectionPanel } from "@/features/rdc/components/rdc-section-panel";
import { RdcPhotoSection } from "@/features/rdc/components/photo-uploader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const inputCls =
  "h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function RdcDetailPage({ rdcId }: { rdcId: string }) {
  const { model, isLoading, error, demoMode } = useRdc(rdcId);
  const employees = useEmployeeOptions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<RdcFicha | null>(null);
  const [exporting, setExporting] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [logoOpen, setLogoOpen] = useState(false);
  const [logo, setLogoState] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const fichaId = model?.ficha.id;

  // Reseta o form ao trocar de ficha (não estraga edição em andamento num refetch).
  useEffect(() => {
    setForm(model ? model.ficha : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fichaId]);

  useEffect(() => {
    setLogoState(getRdcLogo());
  }, []);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: rdcKeys.root });
    invalidateConnectedQueries(queryClient);
  };

  const updateM = useMutation({
    mutationFn: (ficha: RdcFicha) => updateFicha(rdcId, ficha),
    onSuccess: () => {
      toast.success("Ficha salva.");
      invalidate();
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const deleteM = useMutation({
    mutationFn: () => deleteFicha(rdcId),
    onSuccess: () => {
      toast.success("Ficha excluída.");
      invalidate();
      void navigate({ to: "/rdc" });
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="mx-auto mt-16 max-w-xl rounded-xl border border-dashed p-10 text-center">
        <h1 className="text-xl font-semibold">Ficha não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ? error.message : "Esta ficha de RDC não existe ou foi removida."}
        </p>
        <Link to="/rdc" className="mt-5 inline-block text-primary">
          Voltar para o histórico
        </Link>
      </div>
    );
  }

  const f = form ?? model.ficha;
  const setField = <K extends keyof RdcFicha>(key: K, value: RdcFicha[K]) =>
    setForm({ ...f, [key]: value });
  const toggleAtividade = (atividade: string) =>
    setForm({
      ...f,
      atividades: f.atividades.includes(atividade)
        ? f.atividades.filter((a) => a !== atividade)
        : [...f.atividades, atividade],
    });

  const handleSave = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para salvar a ficha.");
    updateM.mutate(f);
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportRdcPdf({ ...model, ficha: f }, { logoDataUrl: logo });
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setExporting(false);
    }
  };

  const handleTextFill = () => {
    if (!textValue.trim()) return;
    setForm(fillFichaFromText(textValue, f));
    setTextOpen(false);
    setTextValue("");
    toast.success("Campos preenchidos a partir do texto — revise e salve.");
  };

  const handleLogoFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setRdcLogo(dataUrl);
      setLogoState(dataUrl);
      toast.success("Logo configurada para o PDF.");
    } catch (logoError) {
      toast.error((logoError as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
      {/* breadcrumb + ações */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link to="/rdc" className="hover:text-foreground">
              RDC
            </Link>
            <span>/</span>
            <span className="truncate">{f.titulo || "Ficha"}</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {f.titulo || "Relatório Diário de Campo"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Action onClick={handleSave} icon={Save} primary disabled={updateM.isPending}>
            {updateM.isPending ? "Salvando…" : "Salvar"}
          </Action>
          <Action onClick={() => void handleExportPdf()} icon={FileDown} disabled={exporting}>
            {exporting ? "Gerando…" : "PDF"}
          </Action>
          <Action onClick={() => exportRdcCsv({ ...model, ficha: f })} icon={FileSpreadsheet}>
            CSV
          </Action>
          <Action onClick={() => setTextOpen(true)} icon={Wand2}>
            Preencher com Texto
          </Action>
          <Action onClick={() => setLogoOpen(true)} icon={ImagePlus}>
            Logo
          </Action>
          <Action
            onClick={() => {
              if (demoMode) return toast.info("Fichas demo não podem ser excluídas.");
              if (confirm("Excluir esta ficha e todos os itens/fotos?")) deleteM.mutate();
            }}
            icon={Trash2}
            danger
          >
            Excluir
          </Action>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatKpi label="Itens" value={String(model.totalItens)} icon={FileText} />
        <StatKpi label="Custo total" value={brl(model.totalCusto)} icon={Wallet} />
        <StatKpi
          label="Ocorrências"
          value={String(model.ocorrenciasAbertas)}
          icon={AlertTriangle}
        />
        <StatKpi label="Fotos" value={String(model.photos.length)} icon={Camera} />
      </div>

      <div className="mt-5 space-y-5">
        {/* Informações Gerais */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            Informações Gerais
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Data">
              <input
                type="date"
                value={f.data}
                onChange={(event) => setField("data", event.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Título">
              <input
                value={f.titulo}
                onChange={(event) => setField("titulo", event.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Local / Fazenda">
              <input
                value={f.local}
                onChange={(event) => setField("local", event.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Safra">
              <input
                value={f.safra}
                placeholder="2025/2026"
                onChange={(event) => setField("safra", event.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Dia">
              <input
                value={f.dia}
                placeholder="Ex.: 03"
                onChange={(event) => setField("dia", event.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Responsável">
              <input
                list="rdc-employees"
                value={f.responsavel}
                placeholder="Selecione ou digite"
                onChange={(event) => setField("responsavel", event.target.value)}
                className={inputCls}
              />
              <datalist id="rdc-employees">
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.nome} />
                ))}
              </datalist>
            </Field>
            <Field label="Status">
              <select
                value={f.status}
                onChange={(event) => setField("status", event.target.value as RdcFicha["status"])}
                className={inputCls}
              >
                <option value="Rascunho">Rascunho</option>
                <option value="Concluído">Concluído</option>
              </select>
            </Field>
            <Field label="Clima (nota)">
              <input
                value={f.climaResumo}
                placeholder="Ex.: 28°C, vento fraco"
                onChange={(event) => setField("climaResumo", event.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Condições climáticas</span>
            <div className="flex flex-wrap gap-2">
              {CLIMA_OPTIONS.map((clima) => (
                <button
                  key={clima}
                  type="button"
                  onClick={() => setField("clima", f.clima === clima ? "" : clima)}
                  className={cn(
                    "h-9 rounded-md border px-3 text-sm transition",
                    f.clima === clima
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {clima}
                </button>
              ))}
            </div>
          </div>

          <Field label="Resumo do dia" className="mt-4">
            <textarea
              value={f.resumo}
              onChange={(event) => setField("resumo", event.target.value)}
              className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </Field>
        </section>

        {/* Atividades executadas no dia */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <ListChecks className="h-4 w-4 text-primary" />
            Atividades executadas no dia
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Marque tudo que foi feito hoje.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ATIVIDADES_AGRO.map((atividade) => (
              <label key={atividade} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={f.atividades.includes(atividade)}
                  onChange={() => toggleAtividade(atividade)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                {atividade}
              </label>
            ))}
          </div>
          <Field label="Outras atividades" className="mt-4">
            <input
              value={f.atividadesOutros}
              onChange={(event) => setField("atividadesOutros", event.target.value)}
              className={inputCls}
            />
          </Field>
        </section>

        {/* Seções (itens detalhados com custo/COGS) */}
        {SECAO_CONFIGS.map((config) => (
          <RdcSectionPanel
            key={config.secao}
            rdcId={rdcId}
            fichaData={f.data}
            secao={config.secao}
            entries={model.entriesBySecao[config.secao]}
            demoMode={demoMode}
          />
        ))}

        {/* Fotos */}
        <RdcPhotoSection rdcId={rdcId} photos={model.photos} demoMode={demoMode} />
      </div>

      {/* Dialog: Preencher com Texto */}
      <Dialog open={textOpen} onOpenChange={setTextOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preencher com texto</DialogTitle>
            <DialogDescription>
              Cole o relato do dia. O sistema marca atividades e clima e tenta extrair o responsável
              — depois é só revisar e salvar.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={textValue}
            onChange={(event) => setTextValue(event.target.value)}
            placeholder="Ex.: Hoje fizemos pulverização e adubação no Talhão 03. Dia de sol. Responsável: João Silva."
            className="min-h-40 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setTextOpen(false)}
              className="h-9 rounded-lg border border-border px-3 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleTextFill}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Preencher
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Configurar Logo */}
      <Dialog open={logoOpen} onOpenChange={setLogoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Logo do PDF</DialogTitle>
            <DialogDescription>
              Aparece no cabeçalho do PDF. Fica salva neste navegador.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
              {logo ? (
                <img src={logo} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
              >
                Enviar imagem
              </button>
              {logo && (
                <button
                  type="button"
                  onClick={() => {
                    setRdcLogo(null);
                    setLogoState(null);
                  }}
                  className="h-9 rounded-lg border border-border px-3 text-sm"
                >
                  Remover
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleLogoFile(event.target.files?.[0])}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setLogoOpen(false)}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Action({
  icon: Icon,
  children,
  onClick,
  primary,
  danger,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium disabled:opacity-60",
        primary
          ? "border-primary bg-primary text-primary-foreground"
          : danger
            ? "border-destructive/40 text-destructive hover:bg-destructive/10"
            : "border-border hover:bg-muted",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}
