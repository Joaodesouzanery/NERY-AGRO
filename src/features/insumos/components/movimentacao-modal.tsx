import { localToday } from "@/lib/date-local";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatQtd, num } from "@/features/insumos/lib/estoque";
import {
  locaisEstoquePadrao,
  movimentacaoTipoLabel,
  type InsumosModel,
  type MovimentacaoPayload,
  type MovimentacaoTipo,
} from "@/features/insumos/types/domain";

const tipos: MovimentacaoTipo[] = [
  "saida",
  "reserva",
  "transferencia",
  "ajuste",
  "perda",
  "devolucao",
];

export type MovimentacaoContext = {
  talhaoId?: string;
  talhao?: string;
  safra?: string;
  ciclo?: string;
};

const emptyForm = {
  tipo: "saida" as MovimentacaoTipo,
  insumo_id: "",
  lote_id: "",
  quantidade: "",
  data: localToday(),
  operacao: "",
  talhao_id: "",
  talhao: "",
  safra: "",
  ciclo: "",
  responsavel: "",
  local_destino: locaisEstoquePadrao[0] as string,
  observacao: "",
};

export function MovimentacaoModal({
  open,
  onOpenChange,
  model,
  saving,
  context,
  talhaoOptions,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: InsumosModel;
  saving: boolean;
  context?: MovimentacaoContext;
  talhaoOptions?: Array<{ id: string; nome: string }>;
  onSave: (payload: MovimentacaoPayload) => void;
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...emptyForm,
      data: localToday(),
      talhao_id: context?.talhaoId ?? "",
      talhao: context?.talhao ?? "",
      safra: context?.safra ?? "",
      ciclo: context?.ciclo ?? "",
    });
  }, [open, context]);

  const set = (key: keyof typeof emptyForm) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const resumo = model.insumos.find((item) => item.insumo.id === form.insumo_id);
  const lotes = resumo?.lotes ?? [];
  const loteResumo = lotes.find((item) => item.lote.id === form.lote_id);
  const unidade = resumo?.insumo.payload.unidade || "un";
  const isReserva = form.tipo === "reserva";
  const isAjuste = form.tipo === "ajuste";
  const isTransferencia = form.tipo === "transferencia";
  const baixaDisponivel = ["saida", "perda", "devolucao", "reserva"].includes(form.tipo);

  const submit = () => {
    if (!resumo) return toast.error("Selecione o insumo.");
    if (!form.lote_id && !isReserva) return toast.error("Selecione o lote para rastreabilidade.");
    const quantidade = num(form.quantidade);
    if (isAjuste ? quantidade === 0 : quantidade <= 0)
      return toast.error("Informe uma quantidade válida.");
    if (!form.data) return toast.error("Informe a data.");
    if (isTransferencia && !form.local_destino) return toast.error("Informe o local de destino.");
    if (loteResumo?.vencido && (form.tipo === "saida" || isReserva))
      return toast.error("Lote vencido: registre perda ou ajuste, não uso em operação.");
    if (loteResumo && loteResumo.lote.payload.status === "bloqueado")
      return toast.error("Este lote está bloqueado para uso.");
    if (baixaDisponivel) {
      const disponivel = loteResumo ? loteResumo.disponivel : resumo.disponivel;
      if (quantidade > disponivel)
        return toast.error(`Quantidade acima do disponível (${formatQtd(disponivel)} ${unidade}).`);
    }
    if (isAjuste && loteResumo && quantidade < 0 && Math.abs(quantidade) > loteResumo.saldoFisico)
      return toast.error("O ajuste deixaria o saldo do lote negativo.");

    onSave({
      tipo: form.tipo,
      insumo_id: resumo.insumo.id,
      insumo: resumo.insumo.payload.nome,
      lote_id: form.lote_id,
      lote: loteResumo?.lote.payload.numero || "",
      quantidade: String(quantidade),
      unidade,
      data: form.data,
      local: loteResumo?.lote.payload.local || "",
      local_destino: isTransferencia ? form.local_destino : "",
      talhao_id: form.talhao_id,
      talhao: form.talhao,
      safra: form.safra,
      ciclo: form.ciclo,
      operacao: form.operacao,
      responsavel: form.responsavel,
      status: isReserva ? "ativa" : "",
      observacao: form.observacao,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova movimentação</DialogTitle>
          <DialogDescription>
            Reserva separa estoque para operação futura; saída baixa definitivamente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            Tipo
            <select
              value={form.tipo}
              onChange={(event) => set("tipo")(event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {movimentacaoTipoLabel[tipo]}
                </option>
              ))}
            </select>
          </label>
          <Field label="Data *" type="date" value={form.data} onChange={set("data")} />
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Insumo *
            <select
              value={form.insumo_id}
              onChange={(event) => {
                const value = event.target.value;
                setForm((current) => ({ ...current, insumo_id: value, lote_id: "" }));
              }}
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              <option value="">Selecione…</option>
              {model.insumos.map((item) => (
                <option key={item.insumo.id} value={item.insumo.id}>
                  {item.insumo.payload.nome} — disp. {formatQtd(item.disponivel)}{" "}
                  {item.insumo.payload.unidade || "un"}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Lote {isReserva ? "(opcional)" : "*"}
            <select
              value={form.lote_id}
              onChange={(event) => set("lote_id")(event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3"
              disabled={!resumo}
            >
              <option value="">{isReserva ? "Sem lote definido" : "Selecione…"}</option>
              {lotes.map((item) => (
                <option key={item.lote.id} value={item.lote.id}>
                  {item.lote.payload.numero || item.lote.id.slice(0, 8)} · disp.{" "}
                  {formatQtd(item.disponivel)} {unidade} · {item.lote.payload.local || "sem local"}
                  {item.vencido ? " · VENCIDO" : ""}
                </option>
              ))}
            </select>
          </label>
          <Field
            label={`Quantidade * (${unidade})${isAjuste ? " — negativa reduz o saldo" : ""}`}
            type="number"
            value={form.quantidade}
            onChange={set("quantidade")}
          />
          <Field label="Operação" value={form.operacao} onChange={set("operacao")} />
          {isTransferencia && (
            <label className="grid gap-1.5 text-sm">
              Local de destino *
              <select
                value={form.local_destino}
                onChange={(event) => set("local_destino")(event.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3"
              >
                {locaisEstoquePadrao.map((local) => (
                  <option key={local}>{local}</option>
                ))}
              </select>
            </label>
          )}
          {context?.talhaoId ? (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm sm:col-span-2">
              Vinculado a <strong>{context.talhao}</strong>
              {context.safra ? ` · Safra ${context.safra}` : ""}
              {context.ciclo ? ` · ${context.ciclo}` : ""}
            </div>
          ) : (
            <>
              <label className="grid gap-1.5 text-sm">
                Talhão
                <select
                  value={form.talhao_id}
                  onChange={(event) => {
                    const id = event.target.value;
                    const nome = talhaoOptions?.find((item) => item.id === id)?.nome ?? "";
                    setForm((current) => ({ ...current, talhao_id: id, talhao: nome }));
                  }}
                  className="h-10 rounded-lg border border-border bg-background px-3"
                >
                  <option value="">Sem vínculo</option>
                  {(talhaoOptions ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Safra" value={form.safra} onChange={set("safra")} />
              <Field label="Ciclo" value={form.ciclo} onChange={set("ciclo")} />
            </>
          )}
          <Field label="Responsável" value={form.responsavel} onChange={set("responsavel")} />
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Observações
            <textarea
              value={form.observacao}
              onChange={(event) => set("observacao")(event.target.value)}
              rows={2}
              className="rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
        </div>
        <DialogFooter>
          <button className="h-9 rounded-lg border px-3" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button
            className="h-9 rounded-lg bg-primary px-3 text-primary-foreground disabled:opacity-60"
            disabled={saving}
            onClick={submit}
          >
            Registrar movimentação
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-border bg-background px-3"
      />
    </label>
  );
}
