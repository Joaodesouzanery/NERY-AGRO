import { Card, KPI, Pill, Section, type PillTone } from "@/components/fin-ui";
import {
  CashFlowChart,
  BreakEvenChart,
  MiniArea,
  chartColors,
  type ChartDatum,
} from "@/components/charts";
import { ArrowDown, ArrowUp, CheckCircle2, Clock, Plus } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

/* 1. Fluxo de Caixa & Custos */
export function CashflowModule() {
  const data = Array.from({ length: 12 }, (_, i) => ({
    label: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][i],
    entradas: 30000 + Math.round(Math.random() * 20000),
    saidas: 20000 + Math.round(Math.random() * 15000),
  }));
  const cats = [
    { name: "Vendas de Grãos", value: 145000, pct: 58, tone: "success" as const },
    { name: "Vendas de Ovos", value: 62000, pct: 25, tone: "info" as const },
    { name: "Outros", value: 42000, pct: 17, tone: "default" as const },
  ];
  const txs = [
    { d: "27 Jan", desc: "Venda saca de soja", cat: "Vendas", val: "+R$ 18.500", positive: true },
    { d: "26 Jan", desc: "Compra de ração", cat: "Insumos", val: "-R$ 4.200", positive: false },
    {
      d: "25 Jan",
      desc: "Recebimento Cliente A",
      cat: "Vendas",
      val: "+R$ 12.000",
      positive: true,
    },
    {
      d: "24 Jan",
      desc: "Combustível frota",
      cat: "Operacional",
      val: "-R$ 2.350",
      positive: false,
    },
    { d: "23 Jan", desc: "Folha de pagamento", cat: "RH", val: "-R$ 18.900", positive: false },
  ];
  return (
    <Section
      title="Fluxo de Caixa & Custos"
      description="Entradas, saídas, categorização automática e DRE simplificado."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Entradas (mês)" value="R$ 248.300" delta="+12%" hint="vs mês anterior" />
        <KPI
          label="Saídas (mês)"
          value="R$ 162.450"
          delta="-4%"
          positive={false}
          hint="vs mês anterior"
        />
        <KPI label="Saldo Líquido" value="R$ 85.850" delta="+24%" hint="margem 34%" />
        <KPI label="Custo por Dúzia" value="R$ 4,82" delta="-2%" hint="ovos caipira" />
      </div>
      <div className="grid grid-cols-12 gap-5">
        <Card
          title="Entradas vs Saídas"
          subtitle="Comparativo dos últimos 12 meses."
          className="col-span-12 lg:col-span-8"
        >
          <div className="h-72">
            <CashFlowChart data={data} />
          </div>
        </Card>
        <Card
          title="Categorização Automática"
          subtitle="Distribuição de receita."
          className="col-span-12 lg:col-span-4"
        >
          <div className="space-y-4">
            {cats.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="font-medium">R$ {c.value.toLocaleString("pt-BR")}</span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <Card
          title="DRE Simplificado"
          subtitle="Janeiro 2026"
          className="col-span-12 lg:col-span-7"
        >
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Receita Bruta", "R$ 248.300", false],
                ["(-) Impostos sobre venda", "-R$ 18.620", false],
                ["(=) Receita Líquida", "R$ 229.680", true],
                ["(-) Custo dos produtos vendidos", "-R$ 112.400", false],
                ["(=) Lucro Bruto", "R$ 117.280", true],
                ["(-) Despesas operacionais", "-R$ 31.430", false],
                ["(=) EBITDA", "R$ 85.850", true],
              ].map(([k, v, bold]) => (
                <tr key={k as string} className="border-b border-border last:border-0">
                  <td className={`py-2.5 ${bold ? "font-semibold" : "text-muted-foreground"}`}>
                    {k}
                  </td>
                  <td className={`py-2.5 text-right ${bold ? "font-semibold" : ""}`}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card
          title="Últimas Transações"
          subtitle="Atualizado em tempo real"
          className="col-span-12 lg:col-span-5"
        >
          <ul className="divide-y divide-border">
            {txs.map((t, i) => (
              <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                >
                  {t.positive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.desc}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.d} · {t.cat}
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold ${t.positive ? "text-success" : "text-destructive"}`}
                >
                  {t.val}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
}

/* 2. Inadimplência */
export function DefaultsModule() {
  const rows = [
    {
      cli: "Fazenda São Pedro",
      val: "R$ 12.400",
      venc: "28 Jan 2026",
      atraso: 0,
      status: "A vencer",
    },
    {
      cli: "Cooperativa Aurora",
      val: "R$ 8.900",
      venc: "22 Jan 2026",
      atraso: 5,
      status: "Atrasado",
    },
    {
      cli: "Mercado Central",
      val: "R$ 3.200",
      venc: "15 Jan 2026",
      atraso: 12,
      status: "Atrasado",
    },
    {
      cli: "Avícola Boa Vista",
      val: "R$ 21.700",
      venc: "10 Fev 2026",
      atraso: 0,
      status: "A vencer",
    },
    {
      cli: "Distribuidora Norte",
      val: "R$ 5.450",
      venc: "02 Jan 2026",
      atraso: 25,
      status: "Crítico",
    },
  ];
  const toneByStatus: Record<string, PillTone> = {
    "A vencer": "info",
    Atrasado: "warning",
    Crítico: "danger",
  };
  return (
    <Section
      title="Controle de Inadimplência"
      description="Cronograma de vencimentos, alertas configuráveis e régua de cobrança."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total a Receber" value="R$ 184.300" hint="42 títulos abertos" />
        <KPI label="Em Atraso" value="R$ 17.550" delta="3 clientes" positive={false} />
        <KPI label="Vence em 7 dias" value="R$ 38.100" hint="9 títulos" />
        <KPI label="Taxa de Inadimplência" value="3,2%" delta="-0,5pp" hint="vs mês anterior" />
      </div>
      <div className="grid grid-cols-12 gap-5">
        <Card
          title="Cronograma de Vencimentos"
          subtitle="Próximos 30 dias"
          className="col-span-12 lg:col-span-8"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-3 font-medium">Cliente</th>
                  <th className="py-3 font-medium">Valor</th>
                  <th className="py-3 font-medium">Vencimento</th>
                  <th className="py-3 font-medium">Atraso</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.cli} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium">{r.cli}</td>
                    <td className="py-3">{r.val}</td>
                    <td className="py-3 text-muted-foreground">{r.venc}</td>
                    <td className="py-3">{r.atraso > 0 ? `${r.atraso} dias` : "—"}</td>
                    <td className="py-3">
                      <Pill tone={toneByStatus[r.status]}>{r.status}</Pill>
                    </td>
                    <td className="py-3 text-right">
                      <button className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted">
                        Cobrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card
          title="Régua de Cobrança"
          subtitle="Configurável por etapa"
          className="col-span-12 lg:col-span-4"
        >
          <ol className="space-y-4">
            {[
              { d: "D-3", title: "Lembrete amigável", ch: "WhatsApp + E-mail", on: true },
              { d: "D+1", title: "Aviso de atraso", ch: "WhatsApp", on: true },
              { d: "D+7", title: "Cobrança formal", ch: "E-mail + Boleto 2ª via", on: true },
              { d: "D+15", title: "Negativação", ch: "Serasa", on: false },
              { d: "D+30", title: "Protesto", ch: "Cartório", on: false },
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                  {s.d}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {s.title}
                    {s.on ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.ch}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </Section>
  );
}

/* 3. Custos por Unidade */
export function UnitCostsModule() {
  const rows = [
    { prod: "Soja (saca)", custo: "R$ 92,40", venda: "R$ 145,00", margem: "36%", t: "success" },
    { prod: "Milho (saca)", custo: "R$ 48,20", venda: "R$ 72,00", margem: "33%", t: "success" },
    { prod: "Ovos (dúzia)", custo: "R$ 4,82", venda: "R$ 9,90", margem: "51%", t: "success" },
    { prod: "Frango (kg)", custo: "R$ 8,30", venda: "R$ 11,80", margem: "30%", t: "info" },
    { prod: "Trigo (saca)", custo: "R$ 78,10", venda: "R$ 90,00", margem: "13%", t: "warning" },
  ];
  return (
    <Section
      title="Custos por Unidade"
      description="Cálculo automático de custo, margem unitária e comparativo entre produtos."
    >
      <div className="grid grid-cols-12 gap-5">
        <Card title="Custo & Margem" subtitle="Por produto" className="col-span-12 lg:col-span-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-3 font-medium">Produto</th>
                <th className="py-3 font-medium">Custo unitário</th>
                <th className="py-3 font-medium">Preço de venda</th>
                <th className="py-3 font-medium">Margem</th>
                <th className="py-3 font-medium">Tendência</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.prod} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{r.prod}</td>
                  <td className="py-3">{r.custo}</td>
                  <td className="py-3">{r.venda}</td>
                  <td className="py-3">
                    <Pill tone={r.t as PillTone}>{r.margem}</Pill>
                  </td>
                  <td className="py-3 w-32 h-10">
                    <MiniArea
                      data={Array.from({ length: 8 }, () => ({ v: Math.random() * 100 }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card
          title="Comparativo"
          subtitle="Margem por produto"
          className="col-span-12 lg:col-span-4"
        >
          <div className="space-y-4">
            {rows.map((r) => {
              const pct = parseInt(r.margem);
              return (
                <div key={r.prod}>
                  <div className="flex justify-between text-sm">
                    <span>{r.prod}</span>
                    <span className="font-medium">{r.margem}</span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${pct * 2}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Section>
  );
}

/* 4. Estoque */
export function StockModule() {
  const rows = [
    {
      prod: "Soja",
      sku: "GR-001",
      saldo: "1.240 sc",
      reserva: "320 sc",
      val: "08/2026",
      t: "success",
    },
    {
      prod: "Milho",
      sku: "GR-002",
      saldo: "860 sc",
      reserva: "120 sc",
      val: "07/2026",
      t: "success",
    },
    {
      prod: "Ovos caipira",
      sku: "OV-010",
      saldo: "480 dz",
      reserva: "180 dz",
      val: "12/02/2026",
      t: "warning",
    },
    {
      prod: "Frango congelado",
      sku: "FR-020",
      saldo: "320 kg",
      reserva: "90 kg",
      val: "30/03/2026",
      t: "info",
    },
    { prod: "Trigo", sku: "GR-003", saldo: "120 sc", reserva: "0 sc", val: "10/2026", t: "danger" },
  ];
  return (
    <Section
      title="Estoque de Produtos Acabados"
      description="Saldo em tempo real, validade e reservas por pedido."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="SKUs ativos" value="48" hint="prontos para venda" />
        <KPI label="Saldo total" value="R$ 412.300" delta="+R$ 28.4k" hint="valorizado" />
        <KPI label="Reservas" value="710 un." hint="9 pedidos abertos" />
        <KPI label="Vencendo < 30d" value="3 SKUs" delta="Atenção" positive={false} />
      </div>
      <Card title="Saldo por Produto" subtitle="Filtrado por categoria">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="py-3 font-medium">Produto</th>
              <th className="py-3 font-medium">SKU</th>
              <th className="py-3 font-medium">Saldo</th>
              <th className="py-3 font-medium">Reservado</th>
              <th className="py-3 font-medium">Validade</th>
              <th className="py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sku} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{r.prod}</td>
                <td className="py-3 text-muted-foreground">{r.sku}</td>
                <td className="py-3">{r.saldo}</td>
                <td className="py-3">{r.reserva}</td>
                <td className="py-3">{r.val}</td>
                <td className="py-3">
                  <Pill tone={r.t as PillTone}>
                    {r.t === "danger" ? "Estoque baixo" : r.t === "warning" ? "Vencendo" : "OK"}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}

/* 5. Ponto de Equilíbrio */
export function BreakEvenModule() {
  const data = Array.from({ length: 21 }, (_, i) => {
    const qty = i * 50;
    return { qty, receita: qty * 9.9, custo: 1200 + qty * 4.82 };
  });
  return (
    <Section
      title="Ponto de Equilíbrio"
      description="Quanto vender para cobrir custos, com cenários what-if."
    >
      <div className="grid grid-cols-12 gap-5">
        <Card
          title="Ponto de Equilíbrio — Ovos (dúzia)"
          subtitle="Custo fixo R$ 1.200 / variável R$ 4,82"
          className="col-span-12 lg:col-span-8"
        >
          <div className="h-72">
            <BreakEvenChart data={data} point={236} />
          </div>
        </Card>
        <Card title="Simulador What-if" className="col-span-12 lg:col-span-4">
          <div className="space-y-4 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span>Preço de venda</span>
                <span className="font-medium">R$ 9,90</span>
              </div>
              <input
                type="range"
                min={5}
                max={15}
                defaultValue={9.9}
                step={0.1}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Custo variável</span>
                <span className="font-medium">R$ 4,82</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                defaultValue={4.82}
                step={0.1}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Custo fixo</span>
                <span className="font-medium">R$ 1.200</span>
              </div>
              <input
                type="range"
                min={0}
                max={5000}
                defaultValue={1200}
                step={100}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
            <div className="pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground">Equilíbrio em</div>
              <div className="text-2xl font-semibold">236 dúzias</div>
              <div className="text-xs text-success font-medium">Margem de contribuição R$ 5,08</div>
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}

/* 6. Compras */
export function PurchasingModule() {
  const sug = [
    { ins: "Ração inicial", qtd: "2.500 kg", uso: "8d", t: "danger" },
    { ins: "Vacina Newcastle", qtd: "600 doses", uso: "14d", t: "warning" },
    { ins: "Adubo NPK", qtd: "40 sc", uso: "21d", t: "info" },
    { ins: "Maravalha", qtd: "12 m³", uso: "30d", t: "default" as PillTone },
  ];
  const cots = [
    { forn: "Agropecuária Sul", prazo: "3d", preco: "R$ 2,18/kg", best: true },
    { forn: "Insumos Brasil", prazo: "5d", preco: "R$ 2,29/kg", best: false },
    { forn: "Campo Forte", prazo: "2d", preco: "R$ 2,35/kg", best: false },
  ];
  return (
    <Section
      title="Gestão de Compras"
      description="Sugestão automática baseada em necessidade, cotação multi-fornecedor e aprovação por etapas."
    >
      <div className="grid grid-cols-12 gap-5">
        <Card
          title="Sugestão Automática"
          subtitle="Baseado em consumo e estoque mínimo"
          className="col-span-12 lg:col-span-7"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-3 font-medium">Insumo</th>
                <th className="py-3 font-medium">Qtd sugerida</th>
                <th className="py-3 font-medium">Cobertura atual</th>
                <th className="py-3 font-medium">Status</th>
                <th className="py-3 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {sug.map((s) => (
                <tr key={s.ins} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{s.ins}</td>
                  <td className="py-3">{s.qtd}</td>
                  <td className="py-3">{s.uso}</td>
                  <td className="py-3">
                    <Pill tone={s.t as PillTone}>
                      {s.t === "danger" ? "Urgente" : s.t === "warning" ? "Atenção" : "Planejar"}
                    </Pill>
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground">
                      Cotar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card
          title="Cotação — Ração inicial"
          subtitle="Melhor oferta destacada"
          className="col-span-12 lg:col-span-5"
        >
          <ul className="space-y-3">
            {cots.map((c) => (
              <li
                key={c.forn}
                className={`p-3 rounded-xl border ${c.best ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{c.forn}</div>
                    <div className="text-xs text-muted-foreground">Prazo {c.prazo}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{c.preco}</div>
                    {c.best && <Pill tone="success">Melhor preço</Pill>}
                  </div>
                </div>
              </li>
            ))}
            <button className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              Enviar para aprovação
            </button>
          </ul>
        </Card>
      </div>
    </Section>
  );
}

/* 7. Crédito Rural */
export function RuralCreditModule() {
  const rows = [
    {
      ct: "Custeio Soja 2026",
      banco: "Banco do Brasil",
      saldo: "R$ 320.000",
      parcela: "R$ 28.400",
      venc: "15 Fev 2026",
      t: "warning",
    },
    {
      ct: "Investimento Maquinário",
      banco: "Sicredi",
      saldo: "R$ 145.000",
      parcela: "R$ 9.100",
      venc: "20 Mar 2026",
      t: "info",
    },
    {
      ct: "Pronaf",
      banco: "Banco do Nordeste",
      saldo: "R$ 48.000",
      parcela: "R$ 3.200",
      venc: "10 Abr 2026",
      t: "success",
    },
  ];
  return (
    <Section
      title="Crédito Rural"
      description="Acompanhamento de financiamentos, juros, saldo devedor e alertas."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Saldo devedor total" value="R$ 513.000" hint="3 contratos" />
        <KPI label="Próxima parcela" value="R$ 28.400" hint="15 Fev 2026" />
        <KPI label="Juros médios a.a." value="8,75%" delta="-0,3pp" hint="renegociação" />
        <KPI label="Inadimplência" value="0%" hint="100% em dia" />
      </div>
      <Card title="Contratos Ativos">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="py-3 font-medium">Contrato</th>
              <th className="py-3 font-medium">Banco</th>
              <th className="py-3 font-medium">Saldo</th>
              <th className="py-3 font-medium">Próx. parcela</th>
              <th className="py-3 font-medium">Vencimento</th>
              <th className="py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ct} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{r.ct}</td>
                <td className="py-3">{r.banco}</td>
                <td className="py-3">{r.saldo}</td>
                <td className="py-3">{r.parcela}</td>
                <td className="py-3 text-muted-foreground">{r.venc}</td>
                <td className="py-3">
                  <Pill tone={r.t as PillTone}>
                    {r.t === "warning" ? "Vence em breve" : "Em dia"}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}

/* 8. Tabela de Preços */
export function PricingModule() {
  const rows = [
    {
      prod: "Soja (saca)",
      varejo: "R$ 150,00",
      atacado: "R$ 138,00",
      ass: "R$ 132,00",
      promo: "—",
    },
    {
      prod: "Milho (saca)",
      varejo: "R$ 75,00",
      atacado: "R$ 68,00",
      ass: "R$ 65,00",
      promo: "-8% Fev",
    },
    { prod: "Ovos (dúzia)", varejo: "R$ 9,90", atacado: "R$ 8,40", ass: "R$ 7,80", promo: "—" },
    {
      prod: "Frango (kg)",
      varejo: "R$ 12,50",
      atacado: "R$ 10,90",
      ass: "R$ 10,20",
      promo: "Comb. -5%",
    },
  ];
  return (
    <Section
      title="Tabela de Preços Dinâmica"
      description="Varejo, atacado e assinaturas. Regras por canal e promoções por período."
    >
      <Card
        title="Preços por Canal"
        right={
          <button className="text-xs px-3 py-1.5 rounded-md border border-border flex items-center gap-1">
            <Plus className="w-3 h-3" /> Nova regra
          </button>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="py-3 font-medium">Produto</th>
              <th className="py-3 font-medium">Varejo</th>
              <th className="py-3 font-medium">Atacado</th>
              <th className="py-3 font-medium">Assinatura</th>
              <th className="py-3 font-medium">Promoção ativa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.prod} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{r.prod}</td>
                <td className="py-3">{r.varejo}</td>
                <td className="py-3">{r.atacado}</td>
                <td className="py-3">{r.ass}</td>
                <td className="py-3">
                  {r.promo === "—" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <Pill tone="info">{r.promo}</Pill>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="grid grid-cols-3 gap-4">
        <Card title="Descontos por volume" subtitle="Atacado">
          <ul className="text-sm space-y-2">
            <li className="flex justify-between">
              <span>10–49 un</span>
              <span className="font-medium">-3%</span>
            </li>
            <li className="flex justify-between">
              <span>50–199 un</span>
              <span className="font-medium">-7%</span>
            </li>
            <li className="flex justify-between">
              <span>200+ un</span>
              <span className="font-medium">-12%</span>
            </li>
          </ul>
        </Card>
        <Card title="Assinaturas" subtitle="Recorrência">
          <ul className="text-sm space-y-2">
            <li className="flex justify-between">
              <span>Mensal</span>
              <span className="font-medium">-10%</span>
            </li>
            <li className="flex justify-between">
              <span>Trimestral</span>
              <span className="font-medium">-15%</span>
            </li>
            <li className="flex justify-between">
              <span>Anual</span>
              <span className="font-medium">-22%</span>
            </li>
          </ul>
        </Card>
        <Card title="Promoções Ativas" subtitle="2 vigentes">
          <ul className="text-sm space-y-2">
            <li className="flex justify-between">
              <span>Milho -8%</span>
              <span className="text-muted-foreground">até 28/02</span>
            </li>
            <li className="flex justify-between">
              <span>Combo Frango -5%</span>
              <span className="text-muted-foreground">até 15/03</span>
            </li>
          </ul>
        </Card>
      </div>
    </Section>
  );
}

/* 9. Custo por Hectare */
export function HectareModule() {
  const data = Array.from({ length: 6 }, (_, i) => ({
    label: ["Talhão A", "Talhão B", "Talhão C", "Talhão D", "Talhão E", "Talhão F"][i],
    planejado: 3200 + Math.round(Math.random() * 400),
    real: 3000 + Math.round(Math.random() * 700),
  }));
  return (
    <Section
      title="Custo por Hectare"
      description="Real vs planejado, drill-down por talhão e comparativo entre safras."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Custo médio R$/ha"
          value="R$ 3.420"
          delta="+4%"
          positive={false}
          hint="vs planejado"
        />
        <KPI label="Talhões ativos" value="12" hint="2 safras" />
        <KPI label="Safra atual" value="2025/26" hint="83% concluída" />
        <KPI label="Variação vs safra anterior" value="+6,2%" delta="atenção" positive={false} />
      </div>
      <Card title="Real x Planejado por Talhão">
        <div className="h-72">
          <ResponsiveBar data={data} />
        </div>
      </Card>
    </Section>
  );
}

function ResponsiveBar({ data }: { data: ChartDatum[] }) {
  // simple inline bar comparison
  return <ResponsiveBarChart data={data} />;
}

function ResponsiveBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={chartColors.mutedFg}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke={chartColors.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: chartColors.popover,
            border: `1px solid ${chartColors.border}`,
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="planejado" name="Planejado" fill={chartColors.c2} radius={[4, 4, 0, 0]} />
        <Bar dataKey="real" name="Real" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* 10. Orçamento de Safra */
export function HarvestBudgetModule() {
  const curve = Array.from({ length: 12 }, (_, i) => ({
    label: ["Ago", "Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"][i],
    desembolso: [180, 220, 260, 180, 140, 90, 60, 80, 140, 180, 220, 160][i],
  }));
  const cats = [
    { name: "Insumos", val: "R$ 480.000", pct: 48 },
    { name: "Mão de obra", val: "R$ 220.000", pct: 22 },
    { name: "Maquinário", val: "R$ 180.000", pct: 18 },
    { name: "Outros", val: "R$ 120.000", pct: 12 },
  ];
  return (
    <Section
      title="Orçamento de Safra"
      description="Previsão de insumos, mão de obra e maquinário com aprovação por etapa."
    >
      <div className="grid grid-cols-12 gap-5">
        <Card
          title="Curva de Desembolso"
          subtitle="Safra 2025/26 — R$ mil"
          className="col-span-12 lg:col-span-8"
        >
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChartBudget data={curve} />
            </ResponsiveContainer>
          </div>
        </Card>
        <Card
          title="Composição"
          subtitle="Total R$ 1.000.000"
          className="col-span-12 lg:col-span-4"
        >
          <div className="space-y-4">
            {cats.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="font-medium">{c.val}</span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Section>
  );
}

function AreaChartBudget({ data }: { data: ChartDatum[] }) {
  return (
    <AreaChart data={data}>
      <defs>
        <linearGradient id="bg-budget" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.35} />
          <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
      <XAxis
        dataKey="label"
        stroke={chartColors.mutedFg}
        fontSize={11}
        tickLine={false}
        axisLine={false}
      />
      <YAxis stroke={chartColors.mutedFg} fontSize={11} tickLine={false} axisLine={false} />
      <Tooltip
        contentStyle={{
          background: chartColors.popover,
          border: `1px solid ${chartColors.border}`,
          borderRadius: 8,
          fontSize: 12,
        }}
      />
      <Area
        type="monotone"
        dataKey="desembolso"
        stroke={chartColors.primary}
        fill="url(#bg-budget)"
        strokeWidth={2}
      />
    </AreaChart>
  );
}

/* 11. Rentabilidade Field-by-Field */
export function FieldRoiModule() {
  const rows = [
    {
      t: "Talhão A",
      h: "Pioneer P3380",
      receita: "R$ 412.000",
      custo: "R$ 280.000",
      roi: "47%",
      tone: "success",
    },
    {
      t: "Talhão B",
      h: "Dekalb DKB290",
      receita: "R$ 360.000",
      custo: "R$ 268.000",
      roi: "34%",
      tone: "success",
    },
    {
      t: "Talhão C",
      h: "Pioneer P3380",
      receita: "R$ 298.000",
      custo: "R$ 252.000",
      roi: "18%",
      tone: "info",
    },
    {
      t: "Talhão D",
      h: "Syngenta SYN505",
      receita: "R$ 245.000",
      custo: "R$ 240.000",
      roi: "2%",
      tone: "warning",
    },
    {
      t: "Talhão E",
      h: "Dekalb DKB290",
      receita: "R$ 210.000",
      custo: "R$ 230.000",
      roi: "-9%",
      tone: "danger",
    },
  ];
  return (
    <Section
      title="Rentabilidade Field-by-Field"
      description="ROI por talhão, comparativo de híbridos e receita líquida."
    >
      <Card title="Performance por Talhão">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="py-3 font-medium">Talhão</th>
              <th className="py-3 font-medium">Híbrido</th>
              <th className="py-3 font-medium">Receita</th>
              <th className="py-3 font-medium">Custo total</th>
              <th className="py-3 font-medium">ROI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.t} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{r.t}</td>
                <td className="py-3">{r.h}</td>
                <td className="py-3">{r.receita}</td>
                <td className="py-3">{r.custo}</td>
                <td className="py-3">
                  <Pill tone={r.tone as PillTone}>{r.roi}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}

/* 12. Arrendamento */
export function LeaseModule() {
  const rows = [
    { c: "Fazenda Vale Verde", area: "120 ha", rha: "R$ 1.850", venc: "30 Set 2026", reaj: "+6%" },
    { c: "Sítio Boa Vista", area: "85 ha", rha: "R$ 2.100", venc: "15 Out 2026", reaj: "+4%" },
    { c: "Estância Aurora", area: "240 ha", rha: "R$ 1.680", venc: "12 Nov 2026", reaj: "+5%" },
  ];
  return (
    <Section
      title="Controle de Arrendamento"
      description="Custo por área, calendário de vencimentos e histórico de reajustes."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Área arrendada" value="445 ha" hint="3 contratos" />
        <KPI
          label="Custo médio R$/ha"
          value="R$ 1.870"
          delta="+5,2%"
          positive={false}
          hint="reajuste anual"
        />
        <KPI label="Custo total anual" value="R$ 832.150" />
        <KPI label="Próx. vencimento" value="30 Set" hint="Vale Verde" />
      </div>
      <Card title="Contratos">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="py-3 font-medium">Contrato</th>
              <th className="py-3 font-medium">Área</th>
              <th className="py-3 font-medium">R$/ha</th>
              <th className="py-3 font-medium">Vencimento</th>
              <th className="py-3 font-medium">Último reajuste</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.c} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{r.c}</td>
                <td className="py-3">{r.area}</td>
                <td className="py-3">{r.rha}</td>
                <td className="py-3 text-muted-foreground">{r.venc}</td>
                <td className="py-3">
                  <Pill tone="info">{r.reaj}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}

/* 13. Contratos */
export function ContractsModule() {
  const rows = [
    {
      c: "Venda Soja — Cargill",
      tipo: "Venda",
      qtd: "5.000 sc",
      fix: "60%",
      exp: "R$ 142,00",
      t: "info",
    },
    {
      c: "Compra adubo — Yara",
      tipo: "Compra",
      qtd: "2.000 sc",
      fix: "100%",
      exp: "R$ 285,00",
      t: "success",
    },
    {
      c: "Venda Milho — ADM",
      tipo: "Venda",
      qtd: "3.000 sc",
      fix: "30%",
      exp: "R$ 68,00",
      t: "warning",
    },
    { c: "Venda Soja — Bunge", tipo: "Venda", qtd: "2.500 sc", fix: "0%", exp: "—", t: "danger" },
  ];
  return (
    <Section
      title="Gestão de Contratos"
      description="Compra de insumos, venda de grãos e fixações de preço com alertas de exposição."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Posições em aberto" value="12" hint="4 venda · 8 compra" />
        <KPI label="Volume comprometido" value="12.500 sc" hint="soja + milho" />
        <KPI label="Fixação média" value="48%" hint="meta 70%" />
        <KPI label="Exposição cambial" value="US$ 84k" delta="atenção" positive={false} />
      </div>
      <Card
        title="Contratos Ativos"
        right={
          <button className="text-xs px-3 py-1.5 rounded-md border border-border flex items-center gap-1">
            <Plus className="w-3 h-3" /> Novo contrato
          </button>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="py-3 font-medium">Contrato</th>
              <th className="py-3 font-medium">Tipo</th>
              <th className="py-3 font-medium">Quantidade</th>
              <th className="py-3 font-medium">Fixação</th>
              <th className="py-3 font-medium">Preço médio</th>
              <th className="py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.c} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{r.c}</td>
                <td className="py-3">{r.tipo}</td>
                <td className="py-3">{r.qtd}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: r.fix }} />
                    </div>
                    <span className="text-xs">{r.fix}</span>
                  </div>
                </td>
                <td className="py-3">{r.exp}</td>
                <td className="py-3">
                  <Pill tone={r.t as PillTone}>
                    {r.t === "danger"
                      ? "Exposto"
                      : r.t === "warning"
                        ? "Atenção"
                        : r.t === "success"
                          ? "Garantido"
                          : "Em curso"}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}
