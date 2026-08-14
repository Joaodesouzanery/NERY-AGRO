import { localToday } from "@/lib/date-local";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Check, CloudOff, RefreshCw, SkipForward, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DemoBadge } from "@/components/demo-badge";
import {
  useAnimais,
  useCarencia,
  useConfig,
  useLotes,
  usePesagens,
  carenciaByAnimal,
  groupPesagensByAnimal,
} from "@/features/pecuaria/hooks/use-pecuaria";
import { createPesagem } from "@/features/pecuaria/api/pecuaria-data";
import { pecKeys } from "@/features/pecuaria/api/query-keys";
import {
  classifyQueueFor,
  countQueueFor,
  enqueuePesagem,
  listOrphans,
  listQueueFor,
  purgeOrphans,
  removeFromQueue,
  type QueuedPesagem,
} from "@/features/pecuaria/offline/pesagem-queue";
import { useQueueOwner } from "@/lib/offline-owner";
import { emCarencia, gmdEntre, ultimoPeso } from "@/features/pecuaria/lib/derived";

type SessaoItem = {
  brinco: string;
  peso: number | null;
  gmd: number | null;
  tipo: "pesagem" | "refugo";
};

export function ModoCurral() {
  const qc = useQueryClient();
  const lotesQ = useLotes();
  const animaisQ = useAnimais();
  const pesagensQ = usePesagens();
  const carenciaQ = useCarencia();
  const configQ = useConfig();

  const lotes = lotesQ.data ?? [];
  const animais = useMemo(() => animaisQ.data ?? [], [animaisQ.data]);

  const [loteId, setLoteId] = useState<string | null>(null);
  const [brinco, setBrinco] = useState("");
  const [peso, setPeso] = useState("");
  const [sessao, setSessao] = useState<SessaoItem[]>([]);
  const [pendentes, setPendentes] = useState(0);
  // Booleano, não contagem: dizer "3 pendentes de outra conta" já informa a esta
  // empresa quantos animais a outra pesou.
  const [temDeOutraConta, setTemDeOutraConta] = useState(false);
  const [orfaos, setOrfaos] = useState(0);
  // "Descartar" só aparece depois do download: descartar sem exportar é a perda.
  const [orfaosExportados, setOrfaosExportados] = useState(false);
  const [online, setOnline] = useState(true);
  const inicioRef = useRef<number>(Date.now());
  const brincoRef = useRef<HTMLInputElement>(null);

  // Peso já registrado nesta sessão (sobrepõe o cache p/ GMD ao vivo).
  const [pesoSessao, setPesoSessao] = useState<Map<string, { peso: number; data: string }>>(
    new Map(),
  );

  // Dono da captura. Sem sessão resolvida não há dono — e sem dono nada é
  // enfileirado nem sincronizado (ver src/lib/offline-owner.ts).
  const owner = useQueueOwner();

  const pesagensMap = useMemo(() => groupPesagensByAnimal(pesagensQ.data ?? []), [pesagensQ.data]);
  const carenciaMap = useMemo(() => carenciaByAnimal(carenciaQ.data ?? []), [carenciaQ.data]);

  const animaisDoLote = useMemo(
    () => (loteId ? animais.filter((a) => a.lote_id === loteId) : []),
    [animais, loteId],
  );
  const animalByBrinco = useMemo(() => {
    const m = new Map<string, (typeof animais)[number]>();
    for (const a of animaisDoLote) if (a.brinco_visual) m.set(a.brinco_visual.toLowerCase(), a);
    return m;
  }, [animaisDoLote]);

  const hoje = localToday();
  const config = configQ.data;

  // ── Sincronização da fila offline ──────────────────────────────────────
  // O uuid local vira a PK da pesagem: se o mesmo item for enviado duas vezes
  // (dois flushes concorrentes, ou um sync que morreu depois do insert), o
  // banco recusa por chave duplicada e nós apenas tiramos da fila. Sem isso a
  // pesagem entra em dobro — nada no schema impede duas pesagens iguais no dia.
  const sincronizando = useRef(false);

  const flush = useCallback(async () => {
    // Sem dono, nada sai daqui. O trigger set_org_id carimba a empresa de QUEM
    // ESTÁ LOGADO no INSERT, não a de quem pesou no curral — sincronizar sem
    // conferir o dono grava a pesagem de uma empresa dentro de outra.
    if (!owner) return;
    if (sincronizando.current) return; // evita dois flushes simultâneos
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    sincronizando.current = true;
    try {
      const fila = await listQueueFor(owner);
      for (const item of fila) {
        try {
          // `item.org_id` como 2º argumento é a trava REAL: o filtro acima é
          // do cliente, mas a policy `with check` do banco rejeita item de
          // outra empresa em vez de deixar o trigger carimbá-lo aqui.
          await createPesagem(
            {
              id: item.id,
              animal_id: item.animal_id,
              data: item.data,
              peso_kg: item.peso_kg,
              origem: item.origem,
            },
            item.org_id,
          );
          await removeFromQueue(item.id);
        } catch (erro) {
          const msg = erro instanceof Error ? erro.message : "";
          // 23505 = unique_violation: já foi gravada numa tentativa anterior.
          if (msg.includes("duplicate key") || msg.includes("23505")) {
            await removeFromQueue(item.id);
            continue;
          }
          // 42501 / RLS: a empresa da sessão não bate com a do item. Não é
          // falha de rede — retentar em laço só repete a recusa. O item FICA na
          // fila, retido, esperando o dono certo entrar.
          if (msg.includes("42501") || msg.toLowerCase().includes("row-level security")) {
            break;
          }
          break; // rede caiu de novo — tenta no próximo gatilho
        }
      }
      const { meus, deOutros, orfaos: semDono } = await classifyQueueFor(owner);
      setPendentes(meus.length);
      setTemDeOutraConta(deOutros > 0);
      setOrfaos(semDono.length);
      void qc.invalidateQueries({ queryKey: pecKeys.all });
    } finally {
      sincronizando.current = false;
    }
  }, [qc, owner]);

  useEffect(() => {
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    if (owner) {
      void classifyQueueFor(owner).then(({ meus, deOutros, orfaos: semDono }) => {
        setPendentes(meus.length);
        setTemDeOutraConta(deOutros > 0);
        setOrfaos(semDono.length);
      });
    }
    const onOnline = () => {
      setOnline(true);
      void flush();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    void flush();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // `owner` na lista: trocar de usuário ou de empresa re-deriva o dono e
    // recomeça com o subconjunto certo — sem apagar nada de ninguém.
  }, [flush, owner]);

  const animalAtual = animalByBrinco.get(brinco.trim().toLowerCase()) ?? null;
  const pesoAnterior = useMemo(() => {
    if (!animalAtual) return null;
    const sess = pesoSessao.get(animalAtual.id);
    if (sess) return sess.peso;
    return ultimoPeso(pesagensMap.get(animalAtual.id) ?? []);
  }, [animalAtual, pesoSessao, pesagensMap]);

  const dataAnterior = useMemo(() => {
    if (!animalAtual) return null;
    const sess = pesoSessao.get(animalAtual.id);
    if (sess) return sess.data;
    const arr = pesagensMap.get(animalAtual.id) ?? [];
    return arr.length ? arr[arr.length - 1].data : null;
  }, [animalAtual, pesoSessao, pesagensMap]);

  const pesoNum = Number(peso.replace(",", "."));
  const gmdAoVivo =
    animalAtual && pesoAnterior !== null && dataAnterior && Number.isFinite(pesoNum) && pesoNum > 0
      ? gmdEntre(pesoAnterior, dataAnterior, pesoNum, hoje)
      : null;

  const carencia = animalAtual ? emCarencia(carenciaMap.get(animalAtual.id) ?? null) : false;

  // Sugestão de apartação (banner).
  const sugestao = useMemo(() => {
    if (!animalAtual || !config) return null;
    if (carencia)
      return { tone: "danger" as const, texto: "Em carência — bloqueado para abate/venda" };
    const { pesoDestinoKg } = config.apartacao;
    if (pesoDestinoKg && Number.isFinite(pesoNum) && pesoNum >= pesoDestinoKg) {
      return { tone: "warning" as const, texto: `Peso ≥ ${pesoDestinoKg} kg — sugerir apartar` };
    }
    return null;
  }, [animalAtual, config, carencia, pesoNum]);

  // ── Órfãos: exportar antes de descartar ────────────────────────────────
  const exportarOrfaos = async () => {
    const itens = await listOrphans();
    if (!itens.length) return;
    const linhas = [
      ["brinco", "animal_id", "data", "peso_kg", "origem", "capturado_em"].join(","),
      ...itens.map((i) =>
        [i.brinco ?? "", i.animal_id, i.data, i.peso_kg, i.origem, i.created_at].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([linhas], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "pesagens-sem-conta.csv";
    a.click();
    URL.revokeObjectURL(url);
    setOrfaosExportados(true);
  };

  const descartarOrfaos = async () => {
    const n = await purgeOrphans();
    setOrfaos(0);
    setOrfaosExportados(false);
    toast.success(`${n} ${n === 1 ? "registro descartado" : "registros descartados"}.`);
  };

  const advance = () => {
    setBrinco("");
    setPeso("");
    setTimeout(() => brincoRef.current?.focus(), 0);
  };

  const confirmar = async () => {
    if (!animalAtual) {
      toast.error("Brinco não encontrado no lote");
      return;
    }
    if (!Number.isFinite(pesoNum) || pesoNum <= 0) {
      toast.error("Informe um peso válido");
      return;
    }
    if (!owner) {
      toast.error("Sessão não identificada — entre novamente para registrar.");
      return;
    }
    const item: QueuedPesagem = {
      id: crypto.randomUUID(),
      // Carimbo na CAPTURA: é o que impede a pesagem de acabar na empresa de
      // quem sincronizar depois.
      org_id: owner.orgId,
      user_id: owner.userId,
      animal_id: animalAtual.id,
      brinco: animalAtual.brinco_visual ?? undefined,
      data: hoje,
      peso_kg: pesoNum,
      origem: "manual",
      created_at: new Date().toISOString(),
    };
    await enqueuePesagem(item);
    setPesoSessao((prev) => new Map(prev).set(animalAtual.id, { peso: pesoNum, data: hoje }));
    setSessao((prev) => [
      { brinco: animalAtual.brinco_visual ?? "—", peso: pesoNum, gmd: gmdAoVivo, tipo: "pesagem" },
      ...prev,
    ]);
    setPendentes(await countQueueFor(owner));
    void flush();
    advance();
  };

  const refugo = () => {
    setSessao((prev) => [
      { brinco: brinco.trim() || "—", peso: null, gmd: null, tipo: "refugo" },
      ...prev,
    ]);
    advance();
  };

  const ritmo = useMemo(() => {
    const min = (Date.now() - inicioRef.current) / 60000;
    const confirmadas = sessao.filter((s) => s.tipo === "pesagem").length;
    return min > 0.1 ? confirmadas / min : 0;
  }, [sessao]);

  const fmtGmd = (v: number | null) =>
    v === null ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg/dia`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-50">
      {/* Barra superior */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold tracking-tight">⚡ Modo Curral</span>
          <DemoBadge />
          {loteId && (
            <span className="text-sm text-zinc-400">
              {lotes.find((l) => l.id === loteId)?.nome ?? ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
              pendentes > 0
                ? "bg-amber-500/20 text-amber-300"
                : "bg-emerald-500/20 text-emerald-300",
            )}
            title="Registros aguardando sincronização"
          >
            {online ? <RefreshCw className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
            {pendentes > 0 ? `${pendentes} aguardando sync` : "tudo sincronizado"}
          </span>
          <Link
            to="/pecuaria"
            search={{ tab: "visao-geral" }}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium hover:bg-zinc-700"
          >
            Sair
          </Link>
        </div>
      </header>

      {/* Pendências que NÃO são desta conta. A fila não é apagada no logout —
          ela espera o dono voltar (ver src/lib/offline-owner.ts). Mensagem sem
          número e sem nome: quantas pesagens a outra empresa fez já é
          informação dela. */}
      {temDeOutraConta && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          Há registros pendentes de outra sessão. Entre com a conta que os criou para sincronizar.
        </div>
      )}

      {/* Itens capturados antes de a fila passar a guardar o dono. Não dá para
          saber de quem são: sincronizar seria gravar na empresa errada e
          descartar seria a perda que este bloco existe para impedir. Exportar
          devolve o dado para uma pessoa decidir. */}
      {orfaos > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
          <span>
            {orfaos} {orfaos === 1 ? "registro antigo" : "registros antigos"} sem identificação de
            conta — não serão sincronizados.
          </span>
          <button
            type="button"
            onClick={() => void exportarOrfaos()}
            className="rounded-md bg-zinc-700 px-2.5 py-1 text-xs font-medium hover:bg-zinc-600"
          >
            Baixar CSV
          </button>
          {orfaosExportados && (
            <button
              type="button"
              onClick={() => void descartarOrfaos()}
              className="rounded-md border border-zinc-600 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
            >
              Descartar
            </button>
          )}
        </div>
      )}

      {!loteId ? (
        // ── Setup: escolher o lote ──
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4">
            <h2 className="text-center text-xl font-semibold">Escolha o lote da sessão</h2>
            {lotes.length ? (
              <div className="grid gap-2">
                {lotes
                  .filter((l) => !l.encerrado_em)
                  .map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setLoteId(l.id);
                        inicioRef.current = Date.now();
                        setTimeout(() => brincoRef.current?.focus(), 0);
                      }}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-left text-lg font-medium hover:border-primary"
                    >
                      {l.nome}
                    </button>
                  ))}
              </div>
            ) : (
              <p className="text-center text-zinc-400">
                Nenhum lote ativo. Crie um lote antes de iniciar a sessão.
              </p>
            )}
          </div>
        </div>
      ) : (
        // ── Sessão de pesagem ──
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col items-center justify-center gap-6 p-6">
            <div className="w-full max-w-lg space-y-5">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Brinco</label>
                <input
                  ref={brincoRef}
                  value={brinco}
                  onChange={(e) => setBrinco(e.target.value)}
                  placeholder="Digite o brinco"
                  inputMode="numeric"
                  className="h-16 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-3xl font-semibold outline-none focus:border-primary"
                />
              </div>

              {brinco.trim() && !animalAtual && (
                <div className="rounded-lg bg-red-500/15 px-4 py-2 text-red-300">
                  Brinco não encontrado neste lote.
                </div>
              )}

              {animalAtual && (
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-xl bg-zinc-900 p-4">
                    <div className="text-xs text-zinc-400">Peso anterior</div>
                    <div className="text-3xl font-bold tabular-nums">
                      {pesoAnterior !== null ? `${pesoAnterior}` : "—"}
                    </div>
                    <div className="text-xs text-zinc-500">kg</div>
                  </div>
                  <div className="rounded-xl bg-zinc-900 p-4">
                    <div className="text-xs text-zinc-400">GMD ao vivo</div>
                    <div className="text-3xl font-bold tabular-nums">{fmtGmd(gmdAoVivo)}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm text-zinc-400">Peso atual (kg)</label>
                <input
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  onKeyDown={(e) => e.key === "Enter" && void confirmar()}
                  className="h-16 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-3xl font-semibold outline-none focus:border-primary"
                />
              </div>

              {sugestao && (
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium",
                    sugestao.tone === "danger"
                      ? "bg-red-500/15 text-red-300"
                      : "bg-amber-500/15 text-amber-300",
                  )}
                >
                  {sugestao.texto}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => void confirmar()}
                  className="flex h-16 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xl font-semibold hover:bg-emerald-500"
                >
                  <Check className="h-6 w-6" /> Confirmar
                </button>
                <button
                  onClick={advance}
                  className="flex h-16 items-center justify-center gap-2 rounded-xl bg-zinc-800 text-xl font-semibold hover:bg-zinc-700"
                >
                  <SkipForward className="h-6 w-6" /> Pular
                </button>
                <button
                  onClick={refugo}
                  className="flex h-14 items-center justify-center gap-2 rounded-xl bg-zinc-800 text-lg font-medium hover:bg-zinc-700"
                >
                  <X className="h-5 w-5" /> Refugo
                </button>
                <button
                  onClick={() => setLoteId(null)}
                  className="flex h-14 items-center justify-center gap-2 rounded-xl bg-zinc-800 text-lg font-medium hover:bg-zinc-700"
                >
                  <ArrowRight className="h-5 w-5" /> Trocar lote
                </button>
              </div>
            </div>
          </div>

          {/* Painel lateral da sessão */}
          <aside className="hidden flex-col border-l border-zinc-800 bg-zinc-900/50 lg:flex">
            <div className="grid grid-cols-2 gap-2 p-4">
              <div className="rounded-lg bg-zinc-900 p-3 text-center">
                <div className="text-xs text-zinc-400">Pesados</div>
                <div className="text-2xl font-bold tabular-nums">
                  {sessao.filter((s) => s.tipo === "pesagem").length}
                </div>
              </div>
              <div className="rounded-lg bg-zinc-900 p-3 text-center">
                <div className="text-xs text-zinc-400">Ritmo</div>
                <div className="text-2xl font-bold tabular-nums">
                  {ritmo.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                </div>
                <div className="text-xs text-zinc-500">animais/min</div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <ul className="space-y-1.5 text-sm">
                {sessao.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2"
                  >
                    <span className="font-medium">{s.brinco}</span>
                    {s.tipo === "refugo" ? (
                      <span className="text-zinc-500">refugo</span>
                    ) : (
                      <span className="tabular-nums text-zinc-300">
                        {s.peso} kg · {fmtGmd(s.gmd)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
