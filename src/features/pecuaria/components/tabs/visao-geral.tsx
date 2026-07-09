import { useMemo } from "react";
import { AlertTriangle, Layers, QrCode, Syringe, TrendingUp } from "lucide-react";
import { RichTabKpis, RichTabPanel, RichBarList } from "@/components/rich-tab";
import { EmptyState } from "@/components/empty-state";
import { useAnimais, useCarencia, useGmd, useLotes } from "@/features/pecuaria/hooks/use-pecuaria";
import { FASE_LABEL, type Fase } from "@/features/pecuaria/types/domain";
import { diasEntre } from "@/features/pecuaria/lib/derived";
import { Tag } from "@/features/pecuaria/components/tag";

export function VisaoGeralTab() {
  const lotesQ = useLotes();
  const animaisQ = useAnimais();
  const gmdQ = useGmd();
  const carenciaQ = useCarencia();

  const lotes = useMemo(() => lotesQ.data ?? [], [lotesQ.data]);
  const animais = useMemo(() => animaisQ.data ?? [], [animaisQ.data]);
  const gmd = useMemo(() => gmdQ.data ?? [], [gmdQ.data]);
  const carencia = useMemo(() => carenciaQ.data ?? [], [carenciaQ.data]);

  const hoje = new Date().toISOString().slice(0, 10);

  const cabecasAtivas = animais.filter((a) => a.status === "ativo").length;
  const lotesAtivos = lotes.filter((l) => !l.encerrado_em).length;

  const gmdMedioRebanho = useMemo(() => {
    const valores = gmd.map((g) => g.gmd_medio).filter((v): v is number => v !== null);
    if (!valores.length) return null;
    return valores.reduce((s, v) => s + v, 0) / valores.length;
  }, [gmd]);

  const emCarencia = carencia.length;

  // Rebanho por fase (conta animais ativos pela fase do lote).
  const porFase = useMemo(() => {
    const loteFase = new Map<string, Fase | null>();
    for (const l of lotes) loteFase.set(l.id, (l.fase as Fase | null) ?? null);
    const counts = new Map<string, number>();
    for (const a of animais) {
      if (a.status !== "ativo") continue;
      const fase = a.lote_id ? loteFase.get(a.lote_id) : null;
      const label = fase ? FASE_LABEL[fase] : "Sem fase";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [animais, lotes]);

  // Carências vencendo em ≤ 7 dias.
  const vencendo = useMemo(() => {
    const brinco = new Map<string, string>();
    for (const a of animais) brinco.set(a.id, a.brinco_visual ?? "—");
    return carencia
      .map((c) => ({
        animalId: c.animal_id ?? "",
        liberaEm: c.libera_em ?? "",
        dias: c.libera_em ? (diasEntre(hoje, c.libera_em) ?? 0) : 0,
      }))
      .filter((c) => c.dias >= 0 && c.dias <= 7)
      .sort((a, b) => a.dias - b.dias)
      .map((c) => ({ ...c, brinco: brinco.get(c.animalId) ?? "—" }));
  }, [carencia, animais, hoje]);

  const fmtGmd = (v: number | null) =>
    v === null ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg/dia`;

  return (
    <>
      <RichTabKpis
        kpis={[
          { label: "Cabeças ativas", value: cabecasAtivas.toLocaleString("pt-BR"), icon: QrCode },
          { label: "Lotes ativos", value: lotesAtivos.toLocaleString("pt-BR"), icon: Layers },
          { label: "GMD médio do rebanho", value: fmtGmd(gmdMedioRebanho), icon: TrendingUp },
          {
            label: "Em carência",
            value: emCarencia.toLocaleString("pt-BR"),
            icon: AlertTriangle,
            hint: emCarencia ? "bloqueados p/ abate/venda" : "nenhum bloqueio",
          },
        ]}
      />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <RichTabPanel title="Rebanho por fase" description="Cabeças ativas por fase do lote">
          {porFase.length ? (
            <RichBarList items={porFase} />
          ) : (
            <EmptyState title="Sem animais cadastrados" icon={QrCode} />
          )}
        </RichTabPanel>
        <RichTabPanel
          title="Carências vencendo"
          description="Liberação para abate/venda nos próximos 7 dias"
        >
          {vencendo.length ? (
            <ul className="divide-y divide-border text-sm">
              {vencendo.map((c) => (
                <li key={c.animalId} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex items-center gap-2">
                    <Syringe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Brinco {c.brinco}</span>
                  </span>
                  <Tag tone={c.dias <= 2 ? "danger" : "warning"}>
                    {c.dias === 0 ? "libera hoje" : `libera em ${c.dias}d`}
                  </Tag>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nenhuma carência vencendo"
              description="Nenhum animal com liberação nos próximos 7 dias."
              icon={Syringe}
            />
          )}
        </RichTabPanel>
      </div>
    </>
  );
}
