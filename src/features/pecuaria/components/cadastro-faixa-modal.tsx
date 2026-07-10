import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import { createAnimaisBatch } from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import { contarFaixa, parseBrincoRange } from "@/features/pecuaria/lib/derived";
import { faixaSchema } from "@/features/pecuaria/schemas/pecuaria";
import type { PecAnimalInsert, PecLote } from "@/features/pecuaria/types/domain";

const NONE = "__none__";
const MAX_FAIXA = 5000;

// Cadastro por faixa de brincos — o recurso que viabiliza migrar um rebanho
// grande em segundos (ex.: 4820–4880 = 61 animais num único insert).
export function CadastroFaixaModal({
  open,
  onOpenChange,
  lotes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotes: PecLote[];
}) {
  const qc = useQueryClient();
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [categoria, setCategoria] = useState("");
  const [raca, setRaca] = useState("");
  const [sexo, setSexo] = useState<string>(NONE);
  const [loteId, setLoteId] = useState<string>(NONE);
  const [nascimento, setNascimento] = useState("");
  const [origem, setOrigem] = useState<string>(NONE);
  const [estabelecimento, setEstabelecimento] = useState("");
  const [car, setCar] = useState("");

  const comprado = origem === "comprado" || origem === "leilao";

  const total = useMemo(() => contarFaixa(inicio, fim), [inicio, fim]);
  const excedeu = total > MAX_FAIXA;

  const reset = () => {
    setInicio("");
    setFim("");
    setCategoria("");
    setRaca("");
    setSexo(NONE);
    setLoteId(NONE);
    setNascimento("");
    setOrigem(NONE);
    setEstabelecimento("");
    setCar("");
  };

  const mut = useMutation({
    mutationFn: async () => {
      const parsed = faixaSchema.safeParse({
        brincoInicial: inicio,
        brincoFinal: fim,
        categoria,
        raca,
        sexo: sexo === NONE ? undefined : sexo,
        loteId: loteId === NONE ? "" : loteId,
        nascimento,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      }
      const brincos = parseBrincoRange(inicio, fim, MAX_FAIXA);
      if (!brincos.length) throw new Error("Faixa inválida ou grande demais");
      // `origem` NUNCA assume "nascido" por padrão: marcar um animal comprado
      // como nascido na fazenda o deixaria falsamente conforme no dossiê EUDR.
      // Sem origem declarada, ele aparece como pendência — que é a verdade.
      const inputs: PecAnimalInsert[] = brincos.map((b) => ({
        brinco_visual: b,
        categoria: categoria.trim() || null,
        raca: raca.trim() || null,
        sexo: sexo === NONE ? null : sexo,
        lote_id: loteId === NONE ? null : loteId,
        nascimento: nascimento || null,
        origem: origem === NONE ? null : origem,
        origem_estabelecimento: comprado ? estabelecimento.trim() || null : null,
        origem_car: comprado ? car.trim() || null : null,
      }));
      return createAnimaisBatch(inputs);
    },
    onSuccess: (n) => {
      toast.success(`${n.toLocaleString("pt-BR")} animais cadastrados`);
      void qc.invalidateQueries({ queryKey: pecKeys.all });
      reset();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao cadastrar"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastro por faixa de brincos</DialogTitle>
          <DialogDescription>
            Cria um animal por número da faixa. Ideal para migrar um rebanho inteiro de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="faixa-inicio">Brinco inicial</Label>
            <Input
              id="faixa-inicio"
              inputMode="numeric"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              placeholder="4820"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faixa-fim">Brinco final</Label>
            <Input
              id="faixa-fim"
              inputMode="numeric"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              placeholder="4880"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faixa-categoria">Categoria</Label>
            <Input
              id="faixa-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Bezerro(a), Novilha..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faixa-raca">Raça</Label>
            <Input
              id="faixa-raca"
              value={raca}
              onChange={(e) => setRaca(e.target.value)}
              placeholder="Nelore..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sexo</Label>
            <Select value={sexo} onValueChange={setSexo}>
              <SelectTrigger>
                <SelectValue placeholder="Sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Não informado</SelectItem>
                <SelectItem value="macho">Macho</SelectItem>
                <SelectItem value="femea">Fêmea</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Lote</Label>
            <Select value={loteId} onValueChange={setLoteId}>
              <SelectTrigger>
                <SelectValue placeholder="Sem lote" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem lote</SelectItem>
                {lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faixa-nascimento">Nascimento aproximado</Label>
            <Input
              id="faixa-nascimento"
              type="date"
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Origem</Label>
            <Select value={origem} onValueChange={setOrigem}>
              <SelectTrigger>
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Não declarada</SelectItem>
                <SelectItem value="nascido">Nascido na fazenda</SelectItem>
                <SelectItem value="comprado">Comprado</SelectItem>
                <SelectItem value="leilao">Leilão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {comprado && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="faixa-estab">Estabelecimento de origem</Label>
                <Input
                  id="faixa-estab"
                  value={estabelecimento}
                  onChange={(e) => setEstabelecimento(e.target.value)}
                  placeholder="Fazenda Boa Vista"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faixa-car">CAR de origem</Label>
                <Input
                  id="faixa-car"
                  value={car}
                  onChange={(e) => setCar(e.target.value)}
                  placeholder="MG-3106200-ABC"
                />
              </div>
              {!car.trim() && (
                <p className="col-span-2 text-xs text-amber-600 dark:text-amber-400">
                  Sem CAR, estes animais ficam pendentes no EUDR e fora do mercado europeu. Dá para
                  preencher depois pelo dossiê.
                </p>
              )}
            </>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          {total > 0 ? (
            excedeu ? (
              <span className="text-destructive">
                Faixa grande demais ({total.toLocaleString("pt-BR")}). Máximo {MAX_FAIXA} por vez.
              </span>
            ) : (
              <span>
                Vai criar <strong>{total.toLocaleString("pt-BR")}</strong> animais.
              </span>
            )
          ) : (
            <span className="text-muted-foreground">Informe uma faixa numérica válida.</span>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mut.mutate()} disabled={total <= 0 || excedeu || mut.isPending}>
            {mut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Cadastrar faixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
