import { useMemo, useState } from "react";
import { useMutacaoReal } from "@/hooks/use-mutacao-real";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Search, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/kpi-card";
import { StatusPill } from "@/components/status-pill";
import { CadastroFaixaModal } from "@/features/pecuaria/components/cadastro-faixa-modal";
import { AnimalFicha } from "@/features/pecuaria/components/animal-ficha";
import {
  useAnimais,
  useCarencia,
  useEventosSanitarios,
  useGmd,
  useLotes,
  usePesagens,
  carenciaByAnimal,
  gmdByAnimal,
  groupPesagensByAnimal,
} from "@/features/pecuaria/hooks/use-pecuaria";
import { ImportRecordsButton } from "@/components/import-records-button";
import type { ImportField } from "@/lib/import-parsing";
import { createAnimaisBatch, updateAnimaisBatch } from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import { emCarencia, idadeMeses, ultimoPeso } from "@/features/pecuaria/lib/derived";
import {
  STATUS_ANIMAL,
  STATUS_LABEL,
  type PecAnimal,
  type StatusAnimal,
} from "@/features/pecuaria/types/domain";

const ALL = "todos";
const NONE = "__none__";

// Colunas aceitas na importação de planilha (o mapeador casa por alias/nome).
const IMPORT_FIELDS: ImportField[] = [
  { key: "brinco_visual", label: "Brinco" },
  { key: "sisbov", label: "SISBOV" },
  { key: "categoria", label: "Categoria" },
  { key: "raca", label: "Raça" },
  { key: "sexo", label: "Sexo" },
  { key: "nascimento", label: "Nascimento", type: "date" },
];

/** "Fêmea"/"F" → femea; "Macho"/"M" → macho; resto → null (o CHECK do banco recusa lixo). */
function normalizarSexo(valor: string | undefined): "macho" | "femea" | null {
  const v = (valor ?? "").trim().toLowerCase();
  if (!v) return null;
  if (v.startsWith("f")) return "femea";
  if (v.startsWith("m")) return "macho";
  return null;
}

export function RebanhoTab() {
  const qc = useQueryClient();
  const animaisQ = useAnimais();
  const lotesQ = useLotes();
  const pesagensQ = usePesagens();
  const gmdQ = useGmd();
  const carenciaQ = useCarencia();
  const sanitariosQ = useEventosSanitarios();

  const animais = useMemo(() => animaisQ.data ?? [], [animaisQ.data]);
  const lotes = useMemo(() => lotesQ.data ?? [], [lotesQ.data]);

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState(ALL);
  const [loteFiltro, setLoteFiltro] = useState(ALL);
  const [statusFiltro, setStatusFiltro] = useState(ALL);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [faixaOpen, setFaixaOpen] = useState(false);
  const [fichaAnimal, setFichaAnimal] = useState<PecAnimal | null>(null);
  const [bulkLote, setBulkLote] = useState(NONE);

  const pesagensMap = useMemo(() => groupPesagensByAnimal(pesagensQ.data ?? []), [pesagensQ.data]);
  const gmdMap = useMemo(() => gmdByAnimal(gmdQ.data ?? []), [gmdQ.data]);
  const carenciaMap = useMemo(() => carenciaByAnimal(carenciaQ.data ?? []), [carenciaQ.data]);
  const loteNome = useMemo(() => new Map(lotes.map((l) => [l.id, l.nome])), [lotes]);
  const brincoById = useMemo(
    () => new Map(animais.map((a) => [a.id, a.brinco_visual ?? "—"])),
    [animais],
  );

  const categorias = useMemo(
    () => [...new Set(animais.map((a) => a.categoria).filter(Boolean))] as string[],
    [animais],
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return animais.filter((a) => {
      if (q && !(a.brinco_visual ?? "").toLowerCase().includes(q)) return false;
      if (categoria !== ALL && a.categoria !== categoria) return false;
      if (loteFiltro !== ALL && (a.lote_id ?? NONE) !== loteFiltro) return false;
      if (statusFiltro !== ALL && a.status !== statusFiltro) return false;
      return true;
    });
  }, [animais, busca, categoria, loteFiltro, statusFiltro]);

  const toggle = (id: string) =>
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulkMut = useMutacaoReal({
    mutationFn: () =>
      updateAnimaisBatch([...selecionados], { lote_id: bulkLote === NONE ? null : bulkLote }),
    onSuccess: () => {
      toast.success(`${selecionados.size} animais movidos de lote`);
      void qc.invalidateQueries({ queryKey: pecKeys.all });
      setSelecionados(new Set());
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha na edição em massa"),
  });

  // Importação de planilha: mapeia as linhas para pec_animal. O brinco é a
  // chave natural — linha sem brinco é ignorada (não há como deduplicar depois).
  const importarAnimais = async (rows: Record<string, string>[]) => {
    const existentes = new Set(
      (animaisQ.data ?? []).map((a) => (a.brinco_visual ?? "").trim()).filter(Boolean),
    );
    const novos = rows
      .map((row) => ({
        brinco_visual: (row.brinco_visual ?? "").trim(),
        sisbov: row.sisbov?.trim() || null,
        categoria: row.categoria?.trim() || null,
        raca: row.raca?.trim() || null,
        sexo: normalizarSexo(row.sexo),
        nascimento: /^\d{4}-\d{2}-\d{2}$/.test(row.nascimento ?? "") ? row.nascimento : null,
      }))
      .filter((a) => a.brinco_visual && !existentes.has(a.brinco_visual));

    if (!novos.length) {
      throw new Error("Nenhum brinco novo na planilha (linhas sem brinco ou já cadastradas).");
    }
    const criados = await createAnimaisBatch(novos);
    void qc.invalidateQueries({ queryKey: pecKeys.all });
    if (criados < rows.length) {
      toast.info(`${rows.length - criados} linha(s) ignorada(s): sem brinco ou já existentes.`);
    }
  };

  // KPIs seguem o filtro atual — o número do topo e a tabela contam a mesma
  // coisa (a carência global do rebanho segue visível na Visão Geral).
  const temFiltro =
    busca.trim() !== "" || categoria !== ALL || loteFiltro !== ALL || statusFiltro !== ALL;
  const kpis = useMemo(() => {
    const ativos = filtrados.filter((a) => a.status === "ativo");
    const media = (valores: number[]) =>
      valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
    const pesos = ativos
      .map((a) => ultimoPeso(pesagensMap.get(a.id) ?? []))
      .filter((v): v is number => v !== null);
    const idades = ativos
      .map((a) => idadeMeses(a.nascimento))
      .filter((v): v is number => v !== null);
    const gmds = ativos
      .map((a) => gmdMap.get(a.id)?.gmd_atual ?? null)
      .filter((v): v is number => v !== null);
    return {
      emCarencia: ativos.filter((a) => emCarencia(carenciaMap.get(a.id) ?? null)).length,
      pesoMedio: media(pesos),
      idadeMedia: media(idades),
      gmdMedio: media(gmds),
    };
  }, [filtrados, pesagensMap, gmdMap, carenciaMap]);

  const fichaPesagens = useMemo(
    () => (fichaAnimal ? (pesagensMap.get(fichaAnimal.id) ?? []) : []),
    [fichaAnimal, pesagensMap],
  );
  const mediaLoteFicha = useMemo(() => {
    if (!fichaAnimal?.lote_id) return null;
    const pesos = animais
      .filter((a) => a.lote_id === fichaAnimal.lote_id)
      .map((a) => ultimoPeso(pesagensMap.get(a.id) ?? []))
      .filter((v): v is number => v !== null);
    if (!pesos.length) return null;
    return pesos.reduce((s, v) => s + v, 0) / pesos.length;
  }, [fichaAnimal, animais, pesagensMap]);

  const suporteFiltro = temFiltro ? "no filtro atual" : undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="Em carência"
          value={kpis.emCarencia}
          state={kpis.emCarencia > 0 ? "warning" : undefined}
          support={suporteFiltro}
        />
        <KpiCard
          label="Peso médio"
          value={kpis.pesoMedio !== null ? Math.round(kpis.pesoMedio) : "—"}
          unit={kpis.pesoMedio !== null ? "kg" : undefined}
          support={suporteFiltro}
        />
        <KpiCard
          label="Idade média"
          value={kpis.idadeMedia !== null ? Math.round(kpis.idadeMedia) : "—"}
          unit={kpis.idadeMedia !== null ? "meses" : undefined}
          support={suporteFiltro}
        />
        <KpiCard
          label="GMD médio"
          value={
            kpis.gmdMedio !== null
              ? kpis.gmdMedio.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
              : "—"
          }
          unit={kpis.gmdMedio !== null ? "kg/dia" : undefined}
          support={suporteFiltro}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-9 min-w-52 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por brinco..."
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </label>
        <FiltroSelect
          value={categoria}
          onChange={setCategoria}
          placeholder="Categoria"
          options={[
            { value: ALL, label: "Todas categorias" },
            ...categorias.map((c) => ({ value: c, label: c })),
          ]}
        />
        <FiltroSelect
          value={loteFiltro}
          onChange={setLoteFiltro}
          placeholder="Lote"
          options={[
            { value: ALL, label: "Todos os lotes" },
            { value: NONE, label: "Sem lote" },
            ...lotes.map((l) => ({ value: l.id, label: l.nome })),
          ]}
        />
        <FiltroSelect
          value={statusFiltro}
          onChange={setStatusFiltro}
          placeholder="Status"
          options={[
            { value: ALL, label: "Todos status" },
            ...STATUS_ANIMAL.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
          ]}
        />
        <Button onClick={() => setFaixaOpen(true)}>
          <Plus className="h-4 w-4" />
          Cadastrar faixa
        </Button>
        <ImportRecordsButton fields={IMPORT_FIELDS} onImport={importarAnimais} />
      </div>

      {selecionados.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{selecionados.size} selecionados</span>
          <span className="text-muted-foreground">— mover para:</span>
          <div className="w-44">
            <FiltroSelect
              value={bulkLote}
              onChange={setBulkLote}
              placeholder="Lote destino"
              options={[
                { value: NONE, label: "Sem lote" },
                ...lotes.map((l) => ({ value: l.id, label: l.nome })),
              ]}
            />
          </div>
          <Button size="sm" onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending}>
            {bulkMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Aplicar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelecionados(new Set())}>
            Limpar
          </Button>
        </div>
      )}

      {filtrados.length ? (
        <>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="h-10 w-10 px-3" />
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">Brinco</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">SISBOV</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">
                    Categoria
                  </th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">Raça</th>
                  <th className="h-10 px-3 text-right font-medium text-muted-foreground">Idade</th>
                  <th className="h-10 px-3 text-right font-medium text-muted-foreground">
                    Últ. peso
                  </th>
                  <th className="h-10 px-3 text-right font-medium text-muted-foreground">GMD</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">Lote</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtrados.map((a) => {
                  const peso = ultimoPeso(pesagensMap.get(a.id) ?? []);
                  const gmd = gmdMap.get(a.id)?.gmd_atual ?? null;
                  const idade = idadeMeses(a.nascimento);
                  const carencia = emCarencia(carenciaMap.get(a.id) ?? null);
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-3 py-2.5">
                        <Checkbox
                          checked={selecionados.has(a.id)}
                          onCheckedChange={() => toggle(a.id)}
                          aria-label={`Selecionar ${a.brinco_visual ?? a.id}`}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => setFichaAnimal(a)}
                          className="font-medium hover:underline"
                        >
                          {a.brinco_visual ?? "—"}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{a.sisbov ?? "—"}</td>
                      <td className="px-3 py-2.5">{a.categoria ?? "—"}</td>
                      <td className="px-3 py-2.5">{a.raca ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {idade !== null ? `${idade} m` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {peso !== null ? `${peso.toLocaleString("pt-BR")} kg` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {gmd !== null
                          ? `${gmd.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {a.lote_id ? (loteNome.get(a.lote_id) ?? "—") : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {carencia ? (
                          <StatusPill tone="destructive">carência</StatusPill>
                        ) : (
                          <StatusPill tone="muted">
                            {STATUS_LABEL[a.status as StatusAnimal] ?? a.status}
                          </StatusPill>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Mostrando {filtrados.length.toLocaleString("pt-BR")} de{" "}
            {animais.length.toLocaleString("pt-BR")} animais
          </p>
        </>
      ) : (
        <EmptyState
          title="Nenhum animal encontrado"
          description="Ajuste os filtros ou cadastre o rebanho pela faixa de brincos."
          icon={Users}
          action={
            <Button onClick={() => setFaixaOpen(true)}>
              <Plus className="h-4 w-4" />
              Cadastrar faixa
            </Button>
          }
        />
      )}

      <CadastroFaixaModal open={faixaOpen} onOpenChange={setFaixaOpen} lotes={lotes} />
      <AnimalFicha
        open={fichaAnimal !== null}
        onOpenChange={(o) => !o && setFichaAnimal(null)}
        animal={fichaAnimal}
        loteNome={fichaAnimal?.lote_id ? (loteNome.get(fichaAnimal.lote_id) ?? null) : null}
        gmd={fichaAnimal ? (gmdMap.get(fichaAnimal.id) ?? null) : null}
        liberaEm={fichaAnimal ? (carenciaMap.get(fichaAnimal.id) ?? null) : null}
        pesagens={fichaPesagens}
        sanitarios={sanitariosQ.data ?? []}
        mediaLote={mediaLoteFicha}
        brincoById={brincoById}
      />
    </div>
  );
}

function FiltroSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-40">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
