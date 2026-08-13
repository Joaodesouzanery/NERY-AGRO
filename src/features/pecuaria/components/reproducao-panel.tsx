import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Baby, Heart, Syringe, TestTube } from "lucide-react";
import { RichTabKpis, RichTabPanel, RichBarList } from "@/components/rich-tab";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollapsibleSection } from "@/components/collapsible-section";
import { Campo } from "@/features/pecuaria/components/campo";
import { Tag } from "@/features/pecuaria/components/tag";
import {
  useAnimais,
  useEstoqueSemen,
  useEventosReprodutivos,
} from "@/features/pecuaria/hooks/use-pecuaria";
import {
  createEstoqueSemen,
  createEventoReprodutivo,
  registrarInseminacao,
} from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import {
  PROTOCOLO_IATF_PADRAO,
  dgPendente,
  iepMedioDias,
  nascimentosPorMes,
  previsoesParto,
  taxaPrenhez,
  type EventoRepro,
} from "@/features/pecuaria/lib/reproducao";

const hoje = () => new Date().toISOString().slice(0, 10);

export function ReproducaoPanel() {
  const qc = useQueryClient();
  const animaisQ = useAnimais();
  const eventosQ = useEventosReprodutivos();
  const semenQ = useEstoqueSemen();

  const femeas = useMemo(
    () => (animaisQ.data ?? []).filter((a) => a.sexo === "femea" && a.status === "ativo"),
    [animaisQ.data],
  );
  const eventos: EventoRepro[] = useMemo(
    () =>
      (eventosQ.data ?? []).map((e) => ({
        animal_id: e.animal_id,
        tipo: e.tipo,
        resultado: e.resultado,
        data: e.data,
      })),
    [eventosQ.data],
  );

  const prenhez = taxaPrenhez(eventos);
  const pendentes = dgPendente(eventos);
  const previsoes = previsoesParto(eventos);
  const iep = iepMedioDias(eventos);
  const curva = nascimentosPorMes(previsoes);

  const brincoDe = (id: string) =>
    (animaisQ.data ?? []).find((a) => a.id === id)?.brinco_visual ?? "—";

  const invalidar = () => void qc.invalidateQueries({ queryKey: pecKeys.all });

  // ── Inseminação (IATF) ──
  const [animalId, setAnimalId] = useState("");
  const [estoqueId, setEstoqueId] = useState("");
  const [dataIa, setDataIa] = useState(hoje());

  const inseminar = useMutation({
    mutationFn: async () => {
      const partida = (semenQ.data ?? []).find((s) => s.id === estoqueId);
      if (!partida) throw new Error("Selecione a partida de sêmen.");
      await registrarInseminacao({
        animalId,
        data: dataIa,
        protocolo: "IATF D0–D11",
        estoqueId,
        semenTouro: partida.touro,
      });
    },
    onSuccess: () => {
      toast.success("Inseminação registrada. Uma dose baixada do estoque.");
      setAnimalId("");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── DG em lote ──
  const dgEmLote = useMutation({
    mutationFn: async ({ ids, resultado }: { ids: string[]; resultado: string }) => {
      for (const id of ids) {
        await createEventoReprodutivo({
          animal_id: id,
          tipo: "dg",
          resultado,
          data: hoje(),
        });
      }
    },
    onSuccess: (_d, v) => {
      toast.success(`DG ${v.resultado} registrado para ${v.ids.length} animais.`);
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Nova partida de sêmen ──
  const [touro, setTouro] = useState("");
  const [partidaNome, setPartidaNome] = useState("");
  const [doses, setDoses] = useState("");

  const novaPartida = useMutation({
    mutationFn: () =>
      createEstoqueSemen({
        touro: touro.trim(),
        partida: partidaNome.trim() || null,
        doses: Number(doses) || 0,
      }),
    onSuccess: () => {
      toast.success("Partida cadastrada.");
      setTouro("");
      setPartidaNome("");
      setDoses("");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dosesTotais = (semenQ.data ?? []).reduce((s, p) => s + p.doses, 0);

  return (
    <div className="space-y-4">
      <RichTabKpis
        kpis={[
          {
            label: "Taxa de prenhez",
            value: prenhez !== null ? `${(prenhez * 100).toFixed(0)}%` : "—",
            icon: Heart,
            hint: prenhez === null ? "sem DG registrado" : undefined,
          },
          { label: "DG pendente", value: pendentes.length, icon: TestTube },
          {
            label: "IEP médio",
            value: iep !== null ? `${Math.round(iep)} d` : "—",
            hint: iep === null ? "precisa de 2 partos" : undefined,
          },
          { label: "Doses em estoque", value: dosesTotais, icon: Syringe },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel
          title="Diagnóstico de gestação pendente"
          description="Coberturas sem DG posterior"
          action={
            pendentes.length > 0 ? (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={dgEmLote.isPending}
                  onClick={() => dgEmLote.mutate({ ids: pendentes, resultado: "positivo" })}
                >
                  Todas positivas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={dgEmLote.isPending}
                  onClick={() => dgEmLote.mutate({ ids: pendentes, resultado: "negativo" })}
                >
                  Todas negativas
                </Button>
              </div>
            ) : undefined
          }
        >
          {pendentes.length ? (
            <ul className="space-y-1 text-sm">
              {pendentes.map((id) => (
                <li
                  key={id}
                  className="flex items-center justify-between border-b border-border/50 py-1"
                >
                  <span className="font-medium">{brincoDe(id)}</span>
                  <Tag tone="warning">DG pendente</Tag>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhum DG pendente" icon={TestTube} />
          )}
        </RichTabPanel>

        <RichTabPanel
          title="Curva de nascimentos projetada"
          description="Previsão de parto = cobertura + 285 dias"
        >
          {curva.length ? (
            <RichBarList items={curva.map((c) => ({ label: c.mes, value: c.total }))} />
          ) : (
            <EmptyState title="Sem gestação confirmada" icon={Baby} />
          )}
        </RichTabPanel>
      </div>

      {previsoes.length > 0 && (
        <RichTabPanel
          title="Previsão de parto"
          description={`${previsoes.length} gestações confirmadas`}
        >
          <ul className="space-y-1 text-sm">
            {previsoes
              .sort((a, b) => a.previsto.localeCompare(b.previsto))
              .map((p) => (
                <li
                  key={p.animal_id}
                  className="flex items-center justify-between border-b border-border/50 py-1"
                >
                  <span className="font-medium">{brincoDe(p.animal_id)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {new Date(`${p.previsto}T00:00:00Z`).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
          </ul>
        </RichTabPanel>
      )}

      <CollapsibleSection title="Registrar inseminação (IATF)">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Baixa automática do estoque de sêmen.</p>
            <Campo label="Fêmea">
              <select
                value={animalId}
                onChange={(e) => setAnimalId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
              >
                <option value="">Selecione…</option>
                {femeas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.brinco_visual ?? a.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Partida de sêmen">
              <select
                value={estoqueId}
                onChange={(e) => setEstoqueId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
              >
                <option value="">Selecione…</option>
                {(semenQ.data ?? [])
                  .filter((s) => s.doses > 0)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.touro} {s.partida ? `· ${s.partida}` : ""} ({s.doses} doses)
                    </option>
                  ))}
              </select>
            </Campo>
            <Campo label="Data">
              <Input type="date" value={dataIa} onChange={(e) => setDataIa(e.target.value)} />
            </Campo>
            <Button
              className="w-full"
              disabled={!animalId || !estoqueId || inseminar.isPending}
              onClick={() => inseminar.mutate()}
            >
              {inseminar.isPending ? "Registrando…" : "Registrar inseminação"}
            </Button>
            {!femeas.length && (
              <p className="text-xs text-muted-foreground">
                Nenhuma fêmea ativa cadastrada. Informe o sexo dos animais no Rebanho.
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Protocolo IATF — padrão D0–D11, editável pelo gestor
            </p>
            <ol className="space-y-2">
              {PROTOCOLO_IATF_PADRAO.map((p) => (
                <li key={p.dia} className="flex gap-3 text-sm">
                  <Tag tone="primary">D{p.dia}</Tag>
                  <span className="text-muted-foreground">{p.acao}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Estoque de sêmen">
        <p className="mb-3 text-xs text-muted-foreground">Doses por touro e partida.</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <Campo label="Touro">
            <Input
              value={touro}
              onChange={(e) => setTouro(e.target.value)}
              placeholder="Touro G5"
            />
          </Campo>
          <Campo label="Partida">
            <Input
              value={partidaNome}
              onChange={(e) => setPartidaNome(e.target.value)}
              placeholder="P-2026"
            />
          </Campo>
          <Campo label="Doses">
            <Input
              type="number"
              min={0}
              value={doses}
              onChange={(e) => setDoses(e.target.value)}
              placeholder="20"
            />
          </Campo>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!touro.trim() || !doses || novaPartida.isPending}
              onClick={() => novaPartida.mutate()}
            >
              Adicionar
            </Button>
          </div>
        </div>

        {semenQ.data?.length ? (
          <table className="mt-4 w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium">Touro</th>
                <th className="py-2 text-left font-medium">Partida</th>
                <th className="py-2 text-right font-medium">Doses</th>
              </tr>
            </thead>
            <tbody>
              {semenQ.data.map((s) => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="py-1.5 font-medium">{s.touro}</td>
                  <td className="py-1.5 text-muted-foreground">{s.partida ?? "—"}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {s.doses === 0 ? <Tag tone="danger">esgotado</Tag> : s.doses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState className="mt-4" title="Estoque vazio" icon={Syringe} />
        )}
      </CollapsibleSection>
    </div>
  );
}
