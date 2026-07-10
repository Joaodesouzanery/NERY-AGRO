import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Syringe } from "lucide-react";
import { RichTabPanel } from "@/components/rich-tab";
import { EmptyState } from "@/components/empty-state";
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
import { cn } from "@/lib/utils";
import { Tag } from "@/features/pecuaria/components/tag";
import { BuscaAnimal } from "@/features/pecuaria/components/busca-animal";
import { ReproducaoPanel } from "@/features/pecuaria/components/reproducao-panel";
import { ProducaoPanel } from "@/features/pecuaria/components/producao-panel";
import { useAnimais, useEventosSanitarios, useLotes } from "@/features/pecuaria/hooks/use-pecuaria";
import {
  createEventoSanitario,
  createEventoSanitarioLote,
} from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import { emCarencia } from "@/features/pecuaria/lib/derived";

type Sub = "sanidade" | "reproducao" | "producao";
type Escopo = "lote" | "animal";

export function ManejoTab() {
  const [sub, setSub] = useState<Sub>("sanidade");
  return (
    <div className="space-y-4">
      <nav className="flex gap-1 rounded-xl border border-border bg-card/95 p-1">
        {(
          [
            { id: "sanidade", label: "Sanidade" },
            { id: "reproducao", label: "Reprodução" },
            { id: "producao", label: "Produção" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={cn(
              "inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium transition",
              sub === t.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {sub === "sanidade" && <Sanidade />}
      {sub === "reproducao" && <ReproducaoPanel />}
      {sub === "producao" && <ProducaoPanel />}
    </div>
  );
}

function Sanidade() {
  const qc = useQueryClient();
  const lotesQ = useLotes();
  const animaisQ = useAnimais();
  const eventosQ = useEventosSanitarios();

  const lotes = useMemo(() => lotesQ.data ?? [], [lotesQ.data]);
  const animais = useMemo(() => animaisQ.data ?? [], [animaisQ.data]);

  const [escopo, setEscopo] = useState<Escopo>("lote");
  const [alvoId, setAlvoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [produto, setProduto] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [carencia, setCarencia] = useState("0");

  const brincoById = useMemo(
    () => new Map(animais.map((a) => [a.id, a.brinco_visual ?? "—"])),
    [animais],
  );
  const loteById = useMemo(() => new Map(lotes.map((l) => [l.id, l.nome])), [lotes]);

  const reset = () => {
    setAlvoId("");
    setTipo("");
    setProduto("");
    setData(new Date().toISOString().slice(0, 10));
    setCarencia("0");
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (!alvoId) throw new Error("Selecione o alvo (lote ou animal)");
      const dias = Number.parseInt(carencia, 10);
      const base = {
        tipo: tipo.trim() || null,
        produto: produto.trim() || null,
        data,
        carencia_dias: Number.isFinite(dias) ? dias : 0,
      };
      if (escopo === "animal") {
        await createEventoSanitario({ ...base, animal_id: alvoId, lote_id: null });
        return 1;
      }
      // Lote inteiro: um evento por animal, para a carência seguir o animal
      // mesmo que ele mude de lote depois.
      const doLote = animais.filter((a) => a.lote_id === alvoId && a.status === "ativo");
      return createEventoSanitarioLote(
        alvoId,
        doLote.map((a) => a.id),
        base,
      );
    },
    onSuccess: (n) => {
      toast.success(
        n > 1 ? `Protocolo aplicado a ${n} animais do lote` : "Evento sanitário registrado",
      );
      void qc.invalidateQueries({ queryKey: pecKeys.all });
      reset();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao registrar"),
  });

  const eventos = eventosQ.data ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RichTabPanel
        title="Registrar protocolo"
        description="Individual ou para o lote inteiro. A carência bloqueia abate/venda automaticamente."
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Escopo</Label>
              <Select
                value={escopo}
                onValueChange={(v) => {
                  setEscopo(v as Escopo);
                  setAlvoId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lote">Lote inteiro</SelectItem>
                  <SelectItem value="animal">Animal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={escopo === "animal" ? "san-animal" : undefined}>
                {escopo === "lote" ? "Lote" : "Animal"}
              </Label>
              {escopo === "lote" ? (
                <Select value={alvoId} onValueChange={setAlvoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha o lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {lotes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                // Rebanho grande não cabe numa lista suspensa: digita-se o brinco.
                <BuscaAnimal id="san-animal" animais={animais} value={alvoId} onChange={setAlvoId} />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="san-tipo">Tipo</Label>
              <Input
                id="san-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Vacina, vermífugo..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="san-produto">Produto</Label>
              <Input
                id="san-produto"
                value={produto}
                onChange={(e) => setProduto(e.target.value)}
                placeholder="Ex.: Ivermectina"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="san-data">Data</Label>
              <Input
                id="san-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="san-carencia">Carência (dias)</Label>
              <Input
                id="san-carencia"
                inputMode="numeric"
                value={carencia}
                onChange={(e) => setCarencia(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="w-full">
            {mut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Syringe className="h-4 w-4" />
            )}
            Registrar
          </Button>
        </div>
      </RichTabPanel>

      <RichTabPanel
        title="Protocolos recentes"
        description="Últimos eventos sanitários e liberação"
      >
        {eventos.length ? (
          <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto text-sm">
            {eventos.map((s) => {
              const alvo = s.animal_id
                ? `Brinco ${brincoById.get(s.animal_id) ?? "—"}`
                : s.lote_id
                  ? `Lote ${loteById.get(s.lote_id) ?? "—"}`
                  : "—";
              const bloqueado = emCarencia(s.libera_em);
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {[s.tipo, s.produto].filter(Boolean).join(" — ") || "Evento"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {alvo} · {s.data}
                    </div>
                  </div>
                  {s.libera_em ? (
                    bloqueado ? (
                      <Tag tone="danger">carência até {s.libera_em}</Tag>
                    ) : (
                      <Tag tone="success">liberado</Tag>
                    )
                  ) : (
                    <Tag tone="neutral">sem carência</Tag>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Sem protocolos registrados" icon={Syringe} />
        )}
      </RichTabPanel>
    </div>
  );
}
