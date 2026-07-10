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
import { num } from "@/features/insumos/lib/estoque";
import {
  locaisEstoquePadrao,
  type InsumoRecord,
  type LotePayload,
} from "@/features/insumos/types/domain";

const emptyForm = {
  insumo_id: "",
  numero: "",
  fabricacao: "",
  validade: "",
  quantidade_inicial: "",
  custo_unitario: "",
  fornecedor: "",
  nota_fiscal: "",
  local: locaisEstoquePadrao[0] as string,
  observacao: "",
};

export function EntradaLoteModal({
  open,
  onOpenChange,
  insumos,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insumos: InsumoRecord[];
  saving: boolean;
  onSave: (payload: LotePayload) => void;
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) setForm((current) => ({ ...emptyForm, insumo_id: current.insumo_id }));
  }, [open]);

  const set = (key: keyof typeof emptyForm) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const insumo = insumos.find((item) => item.id === form.insumo_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Entrada de estoque</DialogTitle>
          <DialogDescription>
            Compra ou saldo inicial: cria um lote rastreável com validade, custo e local.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            Insumo *
            <select
              value={form.insumo_id}
              onChange={(event) => set("insumo_id")(event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              <option value="">Selecione…</option>
              {insumos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.payload.nome} ({item.payload.unidade || "un"})
                </option>
              ))}
            </select>
          </label>
          <Field label="Número do lote" value={form.numero} onChange={set("numero")} />
          <Field
            label={`Quantidade * ${insumo?.payload.unidade ? `(${insumo.payload.unidade})` : ""}`}
            type="number"
            value={form.quantidade_inicial}
            onChange={set("quantidade_inicial")}
          />
          <Field
            label="Custo unitário (R$)"
            type="number"
            value={form.custo_unitario}
            onChange={set("custo_unitario")}
          />
          <label className="grid gap-1.5 text-sm">
            Local de armazenamento
            <select
              value={form.local}
              onChange={(event) => set("local")(event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              {locaisEstoquePadrao.map((local) => (
                <option key={local}>{local}</option>
              ))}
            </select>
          </label>
          <Field
            label="Fabricação"
            type="date"
            value={form.fabricacao}
            onChange={set("fabricacao")}
          />
          <Field label="Validade" type="date" value={form.validade} onChange={set("validade")} />
          <Field label="Fornecedor" value={form.fornecedor} onChange={set("fornecedor")} />
          <Field label="Nota fiscal" value={form.nota_fiscal} onChange={set("nota_fiscal")} />
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
            onClick={() => {
              if (!insumo) return toast.error("Selecione o insumo.");
              if (num(form.quantidade_inicial) <= 0)
                return toast.error("Informe uma quantidade maior que zero.");
              onSave({
                ...form,
                insumo: insumo.payload.nome,
                status: "disponivel",
              });
            }}
          >
            Registrar entrada
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
