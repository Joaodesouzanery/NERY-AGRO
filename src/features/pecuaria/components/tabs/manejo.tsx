import { localToday } from "@/lib/date-local";
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
import { AlertRow } from "@/components/alert-row";
import { KpiCard } from "@/components/kpi-card";
import { Segmented } from "@/components/segmented";
import { StatusPill } from "@/components/status-pill";
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
      <Segmented
        aria-label="Tipo de manejo"
        value={sub}
        onChange={setSub}
        options={[
          { value: "sanidade", label: "Sanidade" },
          { value: "reproducao", label: "Reprodução" },
          { value: "producao", label: "Produção" },
        ]}
      />

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
  const [data, setData] = useState(localToday());
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
    setData(localToday());
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

  // KPIs derivados das carências reais dos eventos (libera_em).
  const hoje = new Date();
  const diasAte = (iso: string) =>
    Math.round((new Date(`${iso}T12:00:00`).getTime() - hoje.getTime()) / (24 * 60 * 60 * 1000));
  const emCarenciaAtiva = eventos.filter((e) => emCarencia(e.libera_em));
  const liberamSemana = emCarenciaAtiva.filter(
    (e) => e.libera_em && diasAte(e.libera_em) <= 7,
  ).length;
  const protocolos30 = eventos.filter((e) => e.data && diasAte(e.data) >= -30).length;

  // Agenda: carências ativas primeiro (mais próximas de liberar no topo),
  // depois o histórico recente.
  const agenda = [...eventos].sort((a, b) => {
    const aAtiva = emCarencia(a.libera_em) ? 0 : 1;
    const bAtiva = emCarencia(b.libera_em) ? 0 : 1;
    if (aAtiva !== bAtiva) return aAtiva - bAtiva;
    if (aAtiva === 0) return (a.libera_em ?? "").localeCompare(b.libera_em ?? "");
    return (b.data ?? "").localeCompare(a.data ?? "");
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard
          label="Carências ativas"
          value={emCarenciaAtiva.length}
          state={emCarenciaAtiva.length > 0 ? "destructive" : undefined}
        />
        <KpiCard label="Liberam em 7 dias" value={liberamSemana} />
        <KpiCard label="Protocolos (30 dias)" value={protocolos30} />
      </div>

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
                  <BuscaAnimal
                    id="san-animal"
                    animais={animais}
                    value={alvoId}
                    onChange={setAlvoId}
                  />
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
          title="Agenda de manejo"
          description="carências ativas primeiro, depois o histórico"
        >
          {agenda.length ? (
            <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
              {agenda.map((s) => {
                const alvo = s.animal_id
                  ? `Brinco ${brincoById.get(s.animal_id) ?? "—"}`
                  : s.lote_id
                    ? `Lote ${loteById.get(s.lote_id) ?? "—"}`
                    : "—";
                const bloqueado = emCarencia(s.libera_em);
                return (
                  <AlertRow
                    key={s.id}
                    tone={bloqueado ? "warning" : "info"}
                    title={[s.tipo, s.produto].filter(Boolean).join(" — ") || "Evento sanitário"}
                    support={`${alvo} · ${s.data}`}
                    aside={
                      s.libera_em ? (
                        bloqueado ? (
                          <StatusPill tone="destructive">carência até {s.libera_em}</StatusPill>
                        ) : (
                          <StatusPill tone="success">liberado</StatusPill>
                        )
                      ) : (
                        <StatusPill tone="muted">sem carência</StatusPill>
                      )
                    }
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState title="Sem protocolos registrados" icon={Syringe} />
          )}
        </RichTabPanel>
      </div>
    </div>
  );
}
