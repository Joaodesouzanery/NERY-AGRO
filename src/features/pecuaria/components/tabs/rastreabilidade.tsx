import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, FileDown, ShieldCheck, Truck } from "lucide-react";
import { RichTabPanel } from "@/components/rich-tab";
import { EmptyState } from "@/components/empty-state";
import { AlertRow } from "@/components/alert-row";
import { BarList } from "@/components/bar-list";
import { KpiCard } from "@/components/kpi-card";
import { SectionLabel } from "@/components/section-label";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { makeReportPdf, downloadPdf } from "@/lib/pdf-utils";
import { DossieAnimal } from "@/features/pecuaria/components/dossie-animal";
import {
  useAnimais,
  useEventosSanitarios,
  useGta,
  usePesagens,
  useConfig,
  groupPesagensByAnimal,
} from "@/features/pecuaria/hooks/use-pecuaria";
import { createGta } from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import {
  DESMATE_VERIFICAVEL,
  PROTOCOLO_DESCRICAO,
  PROTOCOLO_LABEL,
  avaliarConformidade,
  coberturaProtocolo,
  ehAnabolizante,
  riscoEmArrobas,
  type Conformidade,
  type Protocolo,
} from "@/features/pecuaria/lib/conformidade";
import { arrobasCarcaca } from "@/features/pecuaria/lib/custos";
import { idadeMeses, ultimoPeso } from "@/features/pecuaria/lib/derived";
import type { PecAnimal } from "@/features/pecuaria/types/domain";

const PROTOCOLOS: Protocolo[] = ["sisbov", "pnib", "eudr", "boi_china", "estradiol"];

export function RastreabilidadeTab() {
  const qc = useQueryClient();
  const animaisQ = useAnimais();
  const pesagensQ = usePesagens();
  const sanitariosQ = useEventosSanitarios();
  const gtaQ = useGta();
  const configQ = useConfig();

  const [dossieAnimal, setDossieAnimal] = useState<PecAnimal | null>(null);

  const pesagensMap = useMemo(() => groupPesagensByAnimal(pesagensQ.data ?? []), [pesagensQ.data]);
  const rendimento = configQ.data?.rendimentoCarcacaPct ?? 0.52;

  const animaisComAnabolizante = useMemo(() => {
    const set = new Set<string>();
    for (const e of sanitariosQ.data ?? []) {
      if (e.animal_id && ehAnabolizante(e.produto)) set.add(e.animal_id);
    }
    return set;
  }, [sanitariosQ.data]);

  const avaliacoes = useMemo(() => {
    const animais = (animaisQ.data ?? []).filter(
      (a) => a.status === "ativo" || a.status === "apto_abate",
    );
    return animais.map((animal) => {
      const peso = ultimoPeso(pesagensMap.get(animal.id) ?? []);
      const conformidade = avaliarConformidade(animal, {
        temAnabolizante: animaisComAnabolizante.has(animal.id),
        idadeMesesNoAbate: idadeMeses(animal.nascimento),
      });
      return {
        animal,
        conformidade,
        arrobas: peso ? arrobasCarcaca(peso, rendimento) : 0,
      };
    });
  }, [animaisQ.data, pesagensMap, animaisComAnabolizante, rendimento]);

  const conformidades: Conformidade[] = avaliacoes.map((a) => a.conformidade);
  const riscos = useMemo(() => riscoEmArrobas(avaliacoes), [avaliacoes]);

  const totalPendencias = riscos.reduce((s, r) => s + r.animais, 0);
  const arrobasEmRisco = riscos.reduce((s, r) => s + r.arrobas, 0);
  const gtaSemNfe = (gtaQ.data ?? []).filter((g) => !g.nfe_vinculada?.trim());

  if (!avaliacoes.length) {
    return (
      <RichTabPanel title="Rastreabilidade" description="SISBOV, PNIB, EUDR e dossiê">
        <EmptyState
          title="Nenhum animal ativo"
          description="Cadastre o rebanho para avaliar conformidade."
          icon={ShieldCheck}
        />
      </RichTabPanel>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr]">
        <KpiCard
          hero
          label="@ fora do prêmio"
          value={arrobasEmRisco.toFixed(0)}
          support={`por ${totalPendencias} ${totalPendencias === 1 ? "animal" : "animais"} com pendência de cadastro`}
        />
        <KpiCard label="Avaliados" value={avaliacoes.length.toLocaleString("pt-BR")} />
        <KpiCard
          label="GTA sem NF-e"
          value={gtaSemNfe.length}
          state={gtaSemNfe.length > 0 ? "destructive" : undefined}
        />
      </div>

      {!DESMATE_VERIFICAVEL && (
        <div className="flex items-start gap-2 rounded-md border border-warning/35 bg-warning/10 p-3 text-xs">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            <strong>Desmate não verificado.</strong> O sistema não tem fonte de dado de desmatamento
            pós-2020. O EUDR abaixo mede apenas a <em>rastreabilidade da cadeia</em> (origem
            declarada + CAR). Nenhum animal é reportado como livre de desmate.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <RichTabPanel
          title="Conformidade por protocolo"
          description="cobertura sobre animais avaliáveis"
        >
          <BarList
            items={PROTOCOLOS.map((p) => {
              const c = coberturaProtocolo(conformidades, p);
              const pct = c.pct * 100;
              return {
                label: (
                  <span title={PROTOCOLO_DESCRICAO[p]} className="text-sm font-medium">
                    {PROTOCOLO_LABEL[p]}
                  </span>
                ),
                pct,
                tone:
                  pct >= 90
                    ? ("success" as const)
                    : pct >= 50
                      ? ("warning" as const)
                      : ("destructive" as const),
                colorValue: c.total > 0,
                value: c.total > 0 ? `${Math.round(pct)}%` : "n/a",
              };
            })}
          />
        </RichTabPanel>

        <RichTabPanel title="Pendências" description="ações para recuperar o prêmio">
          {riscos.length ? (
            <div className="flex flex-col gap-2">
              {riscos.map((r) => (
                <AlertRow
                  key={r.protocolo}
                  tone="warning"
                  title={`${r.animais} ${r.animais === 1 ? "animal" : "animais"} fora do ${PROTOCOLO_LABEL[r.protocolo]}`}
                  support={`${PROTOCOLO_DESCRICAO[r.protocolo]} · ${r.arrobas.toFixed(0)} @ em risco`}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma pendência" icon={ShieldCheck} />
          )}
          {gtaSemNfe.length > 0 && (
            <>
              <div className="my-4 h-px bg-border" />
              <SectionLabel className="mb-2.5">GTA sem NF-e vinculada</SectionLabel>
              <div className="flex flex-col gap-2">
                {gtaSemNfe.slice(0, 3).map((g) => (
                  <div key={g.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">GTA {g.numero}</span>
                    <span className="text-xs text-muted-foreground">emitida em {g.data}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </RichTabPanel>
      </div>

      <RichTabPanel
        title="Animais e dossiê"
        description="Clique para ver a cadeia de estabelecimentos (EUDR)"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium">Brinco</th>
                {PROTOCOLOS.map((p) => (
                  <th key={p} className="py-2 text-center font-medium">
                    {PROTOCOLO_LABEL[p]}
                  </th>
                ))}
                <th className="py-2 text-right font-medium">@ carcaça</th>
                <th className="w-20 py-2" />
              </tr>
            </thead>
            <tbody>
              {avaliacoes.map(({ animal, conformidade, arrobas }) => (
                <tr key={animal.id} className="border-b border-border/50">
                  <td className="py-2 font-medium">{animal.brinco_visual ?? "—"}</td>
                  {PROTOCOLOS.map((p) => (
                    <td key={p} className="py-2 text-center">
                      <StatusPonto status={conformidade[p]} />
                    </td>
                  ))}
                  <td className="py-2 text-right tabular-nums">{arrobas.toFixed(1)}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => setDossieAnimal(animal)}
                      className="text-xs font-medium text-primary"
                    >
                      Dossiê
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <StatusPonto status="conforme" /> conforme
          </span>
          <span className="flex items-center gap-1.5">
            <StatusPonto status="pendente" /> pendente
          </span>
          <span className="flex items-center gap-1.5">
            <StatusPonto status="nao_avaliavel" /> não avaliável
          </span>
        </div>
      </RichTabPanel>

      <GtaPanel
        gtas={gtaQ.data ?? []}
        semNfe={gtaSemNfe.length}
        onCriado={() => void qc.invalidateQueries({ queryKey: pecKeys.all })}
      />

      {dossieAnimal && <DossieAnimal animal={dossieAnimal} onClose={() => setDossieAnimal(null)} />}
    </div>
  );
}

function StatusPonto({ status }: { status: "conforme" | "pendente" | "nao_avaliavel" }) {
  return (
    <span
      title={status}
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        status === "conforme" && "bg-success",
        status === "pendente" && "bg-destructive",
        status === "nao_avaliavel" && "bg-muted-foreground/40",
      )}
    />
  );
}

function GtaPanel({
  gtas,
  semNfe,
  onCriado,
}: {
  gtas: Array<{
    id: string;
    numero: string;
    data: string;
    sentido: string;
    contraparte: string | null;
    quantidade: number;
    nfe_vinculada: string | null;
  }>;
  semNfe: number;
  onCriado: () => void;
}) {
  const [numero, setNumero] = useState("");
  const [contraparte, setContraparte] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [nfe, setNfe] = useState("");
  const [sentido, setSentido] = useState("entrada");

  const criar = useMutation({
    mutationFn: () =>
      createGta({
        numero: numero.trim(),
        sentido,
        contraparte: contraparte.trim() || null,
        quantidade: Number(quantidade) || 0,
        nfe_vinculada: nfe.trim() || null,
        data: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => {
      toast.success("GTA registrada.");
      setNumero("");
      setContraparte("");
      setQuantidade("");
      setNfe("");
      onCriado();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportar = () => {
    const doc = makeReportPdf({
      title: "Registro de GTA",
      subtitle: `${gtas.length} movimentações · ${semNfe} sem NF-e vinculada`,
      sections: [
        {
          title: "Movimentações",
          head: ["Número", "Data", "Sentido", "Contraparte", "Qtd.", "NF-e"],
          body: gtas.map((g) => [
            g.numero,
            g.data,
            g.sentido,
            g.contraparte ?? "—",
            g.quantidade,
            g.nfe_vinculada ?? "SEM NF-e",
          ]),
        },
      ],
    });
    downloadPdf(doc, "registro-gta.pdf");
  };

  return (
    <RichTabPanel
      title="Registro de GTA"
      description="Alerta para GTA sem NF-e vinculada (NT 2024.003)"
      action={
        gtas.length ? (
          <Button variant="outline" size="sm" onClick={exportar}>
            <FileDown className="h-4 w-4" />
            Exportar
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-3 sm:grid-cols-5">
        <Campo label="Número da GTA">
          <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
        </Campo>
        <Campo label="Sentido">
          <select
            value={sentido}
            onChange={(e) => setSentido(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </Campo>
        <Campo label="Contraparte">
          <Input value={contraparte} onChange={(e) => setContraparte(e.target.value)} />
        </Campo>
        <Campo label="Quantidade">
          <Input
            type="number"
            min={0}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </Campo>
        <Campo label="NF-e vinculada">
          <Input value={nfe} onChange={(e) => setNfe(e.target.value)} placeholder="opcional" />
        </Campo>
      </div>
      <Button
        className="mt-3"
        disabled={!numero.trim() || criar.isPending}
        onClick={() => criar.mutate()}
      >
        Registrar GTA
      </Button>

      {gtas.length ? (
        <table className="mt-4 w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 text-left font-medium">Número</th>
              <th className="py-2 text-left font-medium">Data</th>
              <th className="py-2 text-left font-medium">Sentido</th>
              <th className="py-2 text-left font-medium">Contraparte</th>
              <th className="py-2 text-right font-medium">Qtd.</th>
              <th className="py-2 text-left font-medium">NF-e</th>
            </tr>
          </thead>
          <tbody>
            {gtas.map((g) => (
              <tr key={g.id} className="border-b border-border/50">
                <td className="py-1.5 font-medium">{g.numero}</td>
                <td className="py-1.5 text-muted-foreground">{g.data}</td>
                <td className="py-1.5">{g.sentido}</td>
                <td className="py-1.5 text-muted-foreground">{g.contraparte ?? "—"}</td>
                <td className="py-1.5 text-right tabular-nums">{g.quantidade}</td>
                <td className="py-1.5">
                  {g.nfe_vinculada ? (
                    g.nfe_vinculada
                  ) : (
                    <StatusPill tone="destructive">sem NF-e</StatusPill>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState className="mt-4" title="Nenhuma GTA registrada" icon={Truck} />
      )}
    </RichTabPanel>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
