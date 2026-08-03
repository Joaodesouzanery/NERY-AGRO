import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Factory, MapPin, Save, Scale } from "lucide-react";
import { toast } from "sonner";
import {
  type Beneficiamento,
  type FazendaCoord,
  loadAppSettings,
  REMESSA_TOLERANCIAS_PADRAO,
  type RemessaTolerancias,
  saveBeneficiamento,
  saveCarbonPrice,
  saveFazendaCoords,
  saveRemessaTolerancias,
} from "@/lib/app-settings";
import { CARBON_PRICE_BRL_PER_T } from "@/lib/carbon-emissions-metrics";
import { fazendaCoord } from "@/lib/remessa-metrics";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

function normKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function useAppSettingsQuery() {
  const { demoMode } = useDemoMode();
  const query = useQuery({
    queryKey: ["app-settings"],
    queryFn: loadAppSettings,
    enabled: !demoMode && isSupabaseConfigured,
    staleTime: 60_000,
  });
  return { ...query, demoMode };
}

/** Preço de referência do carbono (R$/tCO₂e) usado no COGS — premissa editável. */
export function CarbonPriceSetting() {
  const queryClient = useQueryClient();
  const { data, demoMode } = useAppSettingsQuery();
  const current = data?.carbonPriceBrlPerT ?? CARBON_PRICE_BRL_PER_T;
  const [value, setValue] = useState<string | null>(null);
  const shown = value ?? String(current);

  const mutation = useMutation({
    mutationFn: (price: number) => saveCarbonPrice(price),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      await invalidateConnectedQueries(queryClient);
      toast.success("Preço do carbono atualizado — reflete no COGS.");
      setValue(null);
    },
    onError: (e) => toast.error((e as Error).message || "Não foi possível salvar."),
  });

  const salvar = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para salvar configurações.");
    const price = Number(shown.replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) return toast.error("Informe um preço válido.");
    mutation.mutate(price);
  };

  return (
    <div className="rounded-lg border border-border bg-background/60 p-4">
      <h4 className="text-sm font-semibold">Preço de referência do carbono</h4>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Usado no COGS para valorar a pegada (R$ por tonelada de CO₂e). Ajuste conforme seu mercado.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-xs text-muted-foreground">
          R$ / tCO₂e
          <input
            type="number"
            step="any"
            value={shown}
            onChange={(e) => setValue(e.target.value)}
            className="h-9 w-32 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <button
          type="button"
          onClick={salvar}
          disabled={mutation.isPending}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Salvar
        </button>
        <span className="text-xs text-muted-foreground">Padrão: R$ {CARBON_PRICE_BRL_PER_T}/t</span>
      </div>
    </div>
  );
}

/**
 * Tolerâncias da conferência de remessa. Quanto de quebra é "normal" varia por
 * cultura e distância — quem sabe é a empresa, não o código.
 */
export function RemessaTolerancasSetting() {
  const queryClient = useQueryClient();
  const { data, demoMode } = useAppSettingsQuery();
  const atual = data?.remessaTolerancias ?? REMESSA_TOLERANCIAS_PADRAO;
  const [draft, setDraft] = useState<Partial<Record<keyof RemessaTolerancias, string>>>({});
  const shown = (campo: keyof RemessaTolerancias) => draft[campo] ?? String(atual[campo]);

  const mutation = useMutation({
    mutationFn: (t: RemessaTolerancias) => saveRemessaTolerancias(t),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      await invalidateConnectedQueries(queryClient);
      toast.success("Tolerâncias atualizadas — refletem nos alertas da Torre.");
      setDraft({});
    },
    onError: (e) => toast.error((e as Error).message || "Não foi possível salvar."),
  });

  const salvar = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para salvar configurações.");
    const parse = (campo: keyof RemessaTolerancias) => Number(shown(campo).replace(",", "."));
    const t: RemessaTolerancias = {
      quebraPct: parse("quebraPct"),
      caixas: parse("caixas"),
      slaPermanenciaMin: parse("slaPermanenciaMin"),
    };
    if (Object.values(t).some((v) => !Number.isFinite(v) || v <= 0)) {
      return toast.error("Informe valores maiores que zero nos três campos.");
    }
    mutation.mutate(t);
  };

  const campos: Array<{ key: keyof RemessaTolerancias; label: string; sufixo: string }> = [
    { key: "quebraPct", label: "Quebra de peso aceita", sufixo: "%" },
    { key: "caixas", label: "Diferença de caixas aceita", sufixo: "cx" },
    { key: "slaPermanenciaMin", label: "Permanência do caminhão", sufixo: "min" },
  ];

  return (
    <div className="rounded-lg border border-border bg-background/60 p-4">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold">
        <Scale className="h-4 w-4" />
        Tolerâncias da conferência
      </h4>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Diferença entre o que saiu da lavoura e o conferido no beneficiamento. Acima disso vira
        alerta na Torre; o dobro vira alerta crítico.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        {campos.map(({ key, label, sufixo }) => (
          <label key={key} className="grid gap-1 text-xs text-muted-foreground">
            {label} ({sufixo})
            <input
              type="number"
              step="any"
              value={shown(key)}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              className="h-9 w-28 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        ))}
        <button
          type="button"
          onClick={salvar}
          disabled={mutation.isPending}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Salvar
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Padrão: {REMESSA_TOLERANCIAS_PADRAO.quebraPct}% · {REMESSA_TOLERANCIAS_PADRAO.caixas} cx ·{" "}
        {REMESSA_TOLERANCIAS_PADRAO.slaPermanenciaMin} min
      </p>
    </div>
  );
}

/**
 * Unidade de beneficiamento da empresa — destino das rotas do mapa.
 *
 * Isto era `BENEFICIAMENTO = { nome: "Fazenda Matrice", ... }` em
 * remessa-metrics.ts: o nome do estabelecimento de UM cliente, chumbado no
 * código e desenhado no mapa de qualquer outro que registrasse uma remessa.
 */
export function BeneficiamentoSetting() {
  const queryClient = useQueryClient();
  const { data, demoMode } = useAppSettingsQuery();
  const atual = data?.beneficiamento;
  const [draft, setDraft] = useState<Partial<Record<keyof Beneficiamento, string>>>({});
  const shown = (campo: keyof Beneficiamento) =>
    draft[campo] ?? (atual ? String(atual[campo]) : "");

  const mutation = useMutation({
    mutationFn: (b: Beneficiamento) => saveBeneficiamento(b),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      await invalidateConnectedQueries(queryClient);
      toast.success("Beneficiamento atualizado — aparece no mapa como destino.");
      setDraft({});
    },
    onError: (e) => toast.error((e as Error).message || "Não foi possível salvar."),
  });

  const salvar = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para salvar configurações.");
    const nome = shown("nome").trim();
    const lat = Number(shown("lat").replace(",", "."));
    const lng = Number(shown("lng").replace(",", "."));
    if (!nome) return toast.error("Informe o nome da unidade.");
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
      return toast.error("Informe latitude e longitude válidas (0,0 cai no oceano).");
    }
    mutation.mutate({ nome, lat, lng });
  };

  return (
    <div className="rounded-lg border border-border bg-background/60 p-4">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold">
        <Factory className="h-4 w-4" />
        Unidade de beneficiamento
      </h4>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Para onde a colheita vai. É o destino das rotas do mapa e o pino de recebimento — sem isto
        configurado, o mapa mostra só as origens.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs text-muted-foreground">
          Nome da unidade
          <input
            value={shown("nome")}
            onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
            placeholder="Ex.: Packing House Sede"
            className="h-9 w-56 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        {(["lat", "lng"] as const).map((campo) => (
          <label key={campo} className="grid gap-1 text-xs text-muted-foreground">
            {campo === "lat" ? "Latitude" : "Longitude"}
            <input
              type="number"
              step="any"
              value={shown(campo)}
              onChange={(e) => setDraft((d) => ({ ...d, [campo]: e.target.value }))}
              className="h-9 w-32 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        ))}
        <button
          type="button"
          onClick={salvar}
          disabled={mutation.isPending}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Salvar
        </button>
      </div>
      {!atual && (
        <p className="mt-2 text-xs text-muted-foreground">
          Ainda não configurado — nenhuma rota de destino é desenhada no mapa.
        </p>
      )}
    </div>
  );
}

/** Editor das coordenadas reais das fazendas (mapa origem→beneficiamento). */
export function FazendaCoordsSetting({ fazendas }: { fazendas: string[] }) {
  const queryClient = useQueryClient();
  const { data, demoMode } = useAppSettingsQuery();
  const overrides = useMemo(() => data?.fazendaCoords ?? {}, [data]);

  // lista única de fazendas (das remessas) + as que já têm override salvo
  const nomes = useMemo(() => {
    const set = new Map<string, string>();
    for (const f of fazendas) if (f.trim()) set.set(normKey(f), f.trim());
    for (const k of Object.keys(overrides)) if (!set.has(k)) set.set(k, k);
    return [...set.entries()].map(([key, label]) => ({ key, label }));
  }, [fazendas, overrides]);

  const [draft, setDraft] = useState<Record<string, { lat: string; lng: string }>>({});
  const valueFor = (key: string, label: string) => {
    if (draft[key]) return draft[key];
    const current = overrides[key] ?? fazendaCoord(label) ?? { lat: 0, lng: 0 };
    return {
      lat: current.lat ? String(current.lat) : "",
      lng: current.lng ? String(current.lng) : "",
    };
  };
  const setField = (key: string, field: "lat" | "lng", label: string, v: string) =>
    setDraft((d) => ({ ...d, [key]: { ...valueFor(key, label), [field]: v } }));

  const mutation = useMutation({
    mutationFn: (coords: Record<string, FazendaCoord>) => saveFazendaCoords(coords),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      await invalidateConnectedQueries(queryClient);
      toast.success("Coordenadas das fazendas atualizadas — refletem no mapa.");
      setDraft({});
    },
    onError: (e) => toast.error((e as Error).message || "Não foi possível salvar."),
  });

  const salvar = () => {
    if (demoMode) return toast.info("Desligue o modo DEMO para salvar configurações.");
    const merged: Record<string, FazendaCoord> = { ...overrides };
    for (const { key, label } of nomes) {
      const v = valueFor(key, label);
      const lat = Number(String(v.lat).replace(",", "."));
      const lng = Number(String(v.lng).replace(",", "."));
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
        merged[key] = { lat, lng };
      }
    }
    mutation.mutate(merged);
  };

  if (nomes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Registre remessas para listar as fazendas e ajustar suas coordenadas.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        Coordenadas reais das fazendas (origem→beneficiamento). Vazio usa o aproximado padrão.
      </p>
      <div className="space-y-2">
        {nomes.map(({ key, label }) => {
          const v = valueFor(key, label);
          return (
            <div key={key} className="flex flex-wrap items-end gap-2">
              <span className="min-w-28 text-sm">{label}</span>
              <label className="grid gap-1 text-[10px] text-muted-foreground">
                Latitude
                <input
                  type="number"
                  step="any"
                  value={v.lat}
                  placeholder="-16.7"
                  onChange={(e) => setField(key, "lat", label, e.target.value)}
                  className="h-8 w-28 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="grid gap-1 text-[10px] text-muted-foreground">
                Longitude
                <input
                  type="number"
                  step="any"
                  value={v.lng}
                  placeholder="-47.6"
                  onChange={(e) => setField(key, "lng", label, e.target.value)}
                  className="h-8 w-28 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={salvar}
        disabled={mutation.isPending}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        Salvar coordenadas
      </button>
    </div>
  );
}
