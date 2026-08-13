import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, MapPinned, Beef } from "lucide-react";
import { toast } from "sonner";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { rdcKeys } from "@/features/rdc/api/query-keys";
import { createEntry, deleteEntry, updateEntry } from "@/features/rdc/api/services";
import { secaoConfig } from "@/features/rdc/data/section-config";
import type { RdcEntry, RdcEntryInput, Secao } from "@/features/rdc/types/domain";
import { TalhaoAnimalPicker, type LinkPatch } from "@/features/rdc/components/talhao-animal-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FormState = Record<string, string | undefined>;

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function RdcSectionPanel({
  rdcId,
  fichaData,
  secao,
  entries,
  demoMode,
}: {
  rdcId: string;
  fichaData: string;
  secao: Secao;
  entries: RdcEntry[];
  demoMode: boolean;
}) {
  const config = secaoConfig(secao);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RdcEntry | null>(null);
  const [form, setForm] = useState<FormState>({});

  const defaultTipo = config.inputs.find((input) => input.key === "tipo")?.options?.[0] ?? "Item";

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: rdcKeys.root });
    invalidateConnectedQueries(queryClient);
  };

  const createM = useMutation({
    mutationFn: (input: RdcEntryInput) => createEntry(rdcId, fichaData, input),
    onSuccess: () => {
      toast.success("Item adicionado.");
      setOpen(false);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const updateM = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RdcEntryInput }) =>
      updateEntry(id, rdcId, fichaData, input),
    onSuccess: () => {
      toast.success("Item atualizado.");
      setOpen(false);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess: () => {
      toast.success("Item excluído.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const setField = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const beginCreate = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para cadastrar dados reais.");
    setEditing(null);
    setForm({ tipo: defaultTipo });
    setOpen(true);
  };

  const beginEdit = (entry: RdcEntry) => {
    if (demoMode) return toast.info("Itens demo não podem ser editados.");
    setEditing(entry);
    setForm({
      tipo: entry.tipo,
      descricao: entry.descricao,
      quantidade: entry.quantidade ?? "",
      unidade: entry.unidade ?? "",
      custo: entry.custo != null ? String(entry.custo) : "",
      severidade: entry.severidade ?? "",
      status: entry.status ?? "",
      responsavel: entry.responsavel ?? "",
      talhaoId: entry.talhaoId,
      talhaoNome: entry.talhaoNome,
      animalId: entry.animalId,
      animalNome: entry.animalNome,
    });
    setOpen(true);
  };

  const submit = () => {
    if (demoMode) return;
    if (!form.descricao?.trim()) return toast.error("Informe a descrição.");
    const input: RdcEntryInput = {
      secao,
      tipo: form.tipo || defaultTipo,
      descricao: form.descricao,
      quantidade: form.quantidade || undefined,
      unidade: form.unidade || undefined,
      custo: form.custo || undefined,
      severidade: form.severidade || undefined,
      status: form.status || undefined,
      responsavel: form.responsavel || undefined,
      talhaoId: form.talhaoId,
      talhaoNome: form.talhaoNome,
      animalId: form.animalId,
      animalNome: form.animalNome,
    };
    if (editing) updateM.mutate({ id: editing.id, input });
    else createM.mutate(input);
  };

  const onLinkChange = (patch: LinkPatch) => setForm((current) => ({ ...current, ...patch }));

  return (
    <div className="rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <config.icon className="h-4 w-4 text-primary" />
            {config.label}
          </h2>
          <p className="text-sm text-muted-foreground">{config.descricao}</p>
        </div>
        <button
          type="button"
          onClick={beginCreate}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Qtd.</th>
              <th className="px-4 py-3 font-medium">Custo</th>
              <th className="px-4 py-3 font-medium">Vínculo</th>
              <th className="px-4 py-3 font-medium">Severidade / Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{entry.tipo}</td>
                <td className="px-4 py-3 text-muted-foreground">{entry.descricao}</td>
                <td className="px-4 py-3">
                  {entry.quantidade ? `${entry.quantidade} ${entry.unidade ?? ""}`.trim() : "—"}
                </td>
                <td className="px-4 py-3">{entry.custo != null ? brl(entry.custo) : "—"}</td>
                <td className="px-4 py-3">
                  {entry.talhaoId ? (
                    <Link
                      to="/campo/talhoes/$fieldId"
                      params={{ fieldId: entry.talhaoId }}
                      search={{ tab: "overview" }}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <MapPinned className="h-3.5 w-3.5" />
                      {entry.talhaoNome ?? "Talhão"}
                    </Link>
                  ) : entry.animalId ? (
                    <Link
                      to="/pecuaria"
                      search={{ tab: "rebanho" }}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Beef className="h-3.5 w-3.5" />
                      {entry.animalNome ?? "Animal"}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {[entry.severidade, entry.status].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => beginEdit(entry)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (demoMode) return toast.info("Itens demo não podem ser excluídos.");
                        if (confirm("Excluir este item?")) deleteM.mutate(entry.id);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!entries.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhum item nesta seção. Clique em “Adicionar”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar item" : "Adicionar item"}</DialogTitle>
            <DialogDescription>{config.label}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {config.inputs.map((input) => (
              <label
                key={input.key}
                className={`grid gap-1.5 text-sm ${input.full ? "sm:col-span-2" : ""}`}
              >
                <span className="text-muted-foreground">{input.label}</span>
                {input.type === "textarea" ? (
                  <textarea
                    value={form[input.key] ?? ""}
                    onChange={(event) => setField(input.key, event.target.value)}
                    className="min-h-20 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                ) : input.type === "select" ? (
                  <select
                    value={form[input.key] ?? ""}
                    onChange={(event) => setField(input.key, event.target.value)}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  >
                    {(input.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option || "—"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={input.type ?? "text"}
                    step={input.type === "number" ? "any" : undefined}
                    value={form[input.key] ?? ""}
                    onChange={(event) => setField(input.key, event.target.value)}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                )}
              </label>
            ))}
            <TalhaoAnimalPicker
              link={config.link}
              talhaoId={form.talhaoId}
              animalId={form.animalId}
              onChange={onLinkChange}
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-lg border border-border px-3 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={createM.isPending || updateM.isPending}
              className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
