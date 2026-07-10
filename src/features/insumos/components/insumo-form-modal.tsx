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
import {
  insumoCategorias,
  insumoUnidades,
  type InsumoPayload,
  type InsumoRecord,
} from "@/features/insumos/types/domain";

const emptyForm = {
  nome: "",
  categoria: "Defensivos",
  unidade: "L",
  fabricante: "",
  fornecedor_padrao: "",
  codigo_interno: "",
  principio_ativo: "",
  registro: "",
  carencia_dias: "",
  reentrada_horas: "",
  estoque_minimo: "",
  observacao: "",
};

export function InsumoFormModal({
  open,
  onOpenChange,
  initial,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: InsumoRecord | null;
  saving: boolean;
  onSave: (payload: InsumoPayload, id?: string) => void;
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? { ...emptyForm, ...initial.payload } : emptyForm);
  }, [open, initial]);

  const set = (key: keyof typeof emptyForm) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar insumo" : "Novo insumo"}</DialogTitle>
          <DialogDescription>
            Cadastro do catálogo: estoque e lotes são registrados pela entrada de compra.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome comercial *" value={form.nome} onChange={set("nome")} />
          <label className="grid gap-1.5 text-sm">
            Categoria
            <select
              value={form.categoria}
              onChange={(event) => set("categoria")(event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              {insumoCategorias.map((categoria) => (
                <option key={categoria}>{categoria}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            Unidade padrão
            <select
              value={form.unidade}
              onChange={(event) => set("unidade")(event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              {insumoUnidades.map((unidade) => (
                <option key={unidade}>{unidade}</option>
              ))}
            </select>
          </label>
          <Field
            label="Estoque mínimo"
            type="number"
            value={form.estoque_minimo}
            onChange={set("estoque_minimo")}
          />
          <Field label="Fabricante" value={form.fabricante} onChange={set("fabricante")} />
          <Field
            label="Fornecedor padrão"
            value={form.fornecedor_padrao}
            onChange={set("fornecedor_padrao")}
          />
          <Field
            label="Código interno"
            value={form.codigo_interno}
            onChange={set("codigo_interno")}
          />
          <Field
            label="Princípio ativo"
            value={form.principio_ativo}
            onChange={set("principio_ativo")}
          />
          <Field label="Registro oficial" value={form.registro} onChange={set("registro")} />
          <Field
            label="Carência (dias)"
            type="number"
            value={form.carencia_dias}
            onChange={set("carencia_dias")}
          />
          <Field
            label="Reentrada (horas)"
            type="number"
            value={form.reentrada_horas}
            onChange={set("reentrada_horas")}
          />
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
              if (!form.nome.trim()) return toast.error("Informe o nome do insumo.");
              onSave({ ...form, status: initial?.payload.status || "ativo" }, initial?.id);
            }}
          >
            {initial ? "Salvar alterações" : "Cadastrar insumo"}
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
