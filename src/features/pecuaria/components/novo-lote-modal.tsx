import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLote } from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import { loteSchema } from "@/features/pecuaria/schemas/pecuaria";
import {
  FASES,
  FASE_LABEL,
  SISTEMAS,
  SISTEMA_LABEL,
  type Fase,
  type Sistema,
} from "@/features/pecuaria/types/domain";

const NONE = "__none__";

export function NovoLoteModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [fase, setFase] = useState(NONE);
  const [sistema, setSistema] = useState(NONE);
  const [pesoAlvo, setPesoAlvo] = useState("");
  const [abertoEm, setAbertoEm] = useState(new Date().toISOString().slice(0, 10));

  const reset = () => {
    setNome("");
    setFase(NONE);
    setSistema(NONE);
    setPesoAlvo("");
    setAbertoEm(new Date().toISOString().slice(0, 10));
  };

  const mut = useMutation({
    mutationFn: async () => {
      const peso = pesoAlvo.trim() ? Number(pesoAlvo) : undefined;
      const parsed = loteSchema.safeParse({
        nome,
        fase: fase === NONE ? undefined : fase,
        sistema: sistema === NONE ? undefined : sistema,
        peso_alvo_kg: peso,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return createLote({
        nome: nome.trim(),
        fase: fase === NONE ? null : (fase as Fase),
        sistema: sistema === NONE ? null : (sistema as Sistema),
        peso_alvo_kg: peso ?? null,
        aberto_em: abertoEm,
      });
    },
    onSuccess: () => {
      toast.success("Lote criado");
      void qc.invalidateQueries({ queryKey: pecKeys.all });
      reset();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao criar lote"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo lote</DialogTitle>
          <DialogDescription>Agrupa animais por fase e sistema de criação.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="lote-nome">Nome</Label>
            <Input
              id="lote-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Engorda Piquete 3"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fase</Label>
              <Select value={fase} onValueChange={setFase}>
                <SelectTrigger>
                  <SelectValue placeholder="Fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Não informada</SelectItem>
                  {FASES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FASE_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sistema</Label>
              <Select value={sistema} onValueChange={setSistema}>
                <SelectTrigger>
                  <SelectValue placeholder="Sistema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Não informado</SelectItem>
                  {SISTEMAS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SISTEMA_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lote-peso">Peso alvo (kg)</Label>
              <Input
                id="lote-peso"
                inputMode="numeric"
                value={pesoAlvo}
                onChange={(e) => setPesoAlvo(e.target.value)}
                placeholder="540"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lote-aberto">Aberto em</Label>
              <Input
                id="lote-aberto"
                type="date"
                value={abertoEm}
                onChange={(e) => setAbertoEm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Criar lote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
