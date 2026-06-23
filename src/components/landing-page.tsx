import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  FileText,
  Leaf,
  MapPinned,
  QrCode,
  Radio,
  ShieldCheck,
  Sprout,
  Truck,
  Users,
  Wallet,
  WifiOff,
} from "lucide-react";

const GREEN = "#2bb24a";

// Fotos de stock (Unsplash) com tema agro.
const HERO_IMG =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2400&q=80";
const CTA_IMG =
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1600&q=80";

const navLinks = [
  { label: "INÍCIO", href: "#inicio" },
  { label: "MÓDULOS", href: "#modulos" },
  { label: "CAPACIDADES", href: "#capacidades" },
  { label: "RESULTADOS", href: "#resultados" },
  { label: "SOBRE", href: "#sobre" },
];

const stats = [
  {
    kicker: "JÁ MONITORAMOS MAIS DE",
    value: "120",
    unit: "mil ha",
    desc: "De área agrícola e pecuária acompanhadas em tempo real pela plataforma.",
  },
  {
    kicker: "JÁ PROCESSAMOS MAIS DE",
    value: "850",
    unit: "mil registros",
    desc: "Entre campo, pecuária, logística, financeiro e sustentabilidade.",
  },
  {
    kicker: "TUDO INTEGRADO EM",
    value: "9",
    unit: "módulos",
    desc: "Conectados em uma única torre de controle operacional.",
  },
];

const modules = [
  {
    title: "Campo",
    desc: "Calendário, insumos, pragas, solo, irrigação e diário de campo em um só lugar.",
    icon: Sprout,
  },
  {
    title: "Pecuária",
    desc: "Lotes, QR Code, vacinação, reprodução e produção diária rastreados ponta a ponta.",
    icon: QrCode,
  },
  {
    title: "Financeiro & COGS",
    desc: "Custos, fluxo de caixa e ponto de equilíbrio conectados à operação real.",
    icon: Wallet,
  },
  {
    title: "Logística",
    desc: "Cargas, rotas, frota e bases monitoradas no mapa em tempo real.",
    icon: Truck,
  },
  {
    title: "Sustentabilidade",
    desc: "Certificação orgânica, carbono, resíduos e APP acompanhados por indicadores.",
    icon: Leaf,
  },
  {
    title: "Inteligência",
    desc: "KPIs, alertas e relatórios cruzando dados de todos os módulos automaticamente.",
    icon: BarChart3,
  },
];

// Capacidades transversais (o que a plataforma faz de diferente).
const capabilities = [
  {
    icon: Radio,
    title: "Tempo real",
    desc: "Lançou no campo, na pecuária ou na logística e os KPIs da operação inteira atualizam na hora.",
  },
  {
    icon: QrCode,
    title: "Rastreabilidade por QR",
    desc: "Lotes e animais com QR Code escaneável — origem e cadeia de custódia ponta a ponta.",
  },
  {
    icon: MapPinned,
    title: "Mapa operacional",
    desc: "Cargas, talhões, bases e APPs georreferenciados num mapa único e interativo.",
  },
  {
    icon: Wallet,
    title: "Custo real (COGS)",
    desc: "Custo por produto, etapa e rota calculado a partir dos lançamentos reais.",
  },
  {
    icon: FileText,
    title: "Fichas em PDF",
    desc: "Ficha individual do animal gerada e versionada em PDF, pronta para auditoria.",
  },
  {
    icon: Boxes,
    title: "Importar / Exportar",
    desc: "Suba planilhas (CSV/Excel) e exporte qualquer módulo para análise externa.",
  },
  {
    icon: ShieldCheck,
    title: "Certificação orgânica",
    desc: "Checklist de conformidade, caderno de campo e validade de selos sob controle.",
  },
  {
    icon: WifiOff,
    title: "Offline + nuvem",
    desc: "Diário de campo funciona sem internet e sincroniza; tudo com backup na nuvem.",
  },
];

// Catálogo completo — tudo que a plataforma controla, por área.
const controlAreas = [
  {
    icon: Sprout,
    title: "Campo & Produção",
    items: [
      "Áreas e talhões com GPS",
      "Calendário de plantio/colheita",
      "Insumos e custo por hectare",
      "Pragas, doenças e tratamentos",
      "Solo, irrigação e clima",
      "Maquinário e diário de campo",
      "Estimativa de safra",
    ],
  },
  {
    icon: Wallet,
    title: "Financeiro & Comercial",
    items: [
      "Fluxo de caixa",
      "Custo por unidade",
      "Inadimplência e cobrança",
      "Estoque de acabados",
      "Ponto de equilíbrio",
      "Compras e crédito rural",
      "Tabela de preços dinâmica",
    ],
  },
  {
    icon: Truck,
    title: "Logística & Distribuição",
    items: [
      "Cargas e tracking",
      "Roteirização de entregas",
      "Fretes e custo de transporte",
      "Frota, rotas e bases",
      "Embalagens e estoque",
      "Cestas/assinaturas (CSA)",
      "Checklist de expedição",
    ],
  },
  {
    icon: QrCode,
    title: "Pecuária",
    items: [
      "Ficha individual por animal",
      "QR Code no brinco",
      "Vacinação e calendário sanitário",
      "Ciclo reprodutivo",
      "Produção diária (leite/ovos)",
      "Curva de peso",
      "Gestão de pastagens",
    ],
  },
  {
    icon: Leaf,
    title: "Sustentabilidade",
    items: [
      "Certificação orgânica",
      "Caderno de agroecologia",
      "Controle de resíduos",
      "Monitoramento de APP",
      "Pegada de carbono",
    ],
  },
  {
    icon: Users,
    title: "Equipe & Inteligência",
    items: [
      "Vendas diretas e clientes",
      "Mão de obra e diárias",
      "Lista de tarefas",
      "Lucratividade por cultura",
      "Relatório de perdas",
      "Alertas e KPIs cruzados",
    ],
  },
];

const steps = [
  {
    n: "01",
    title: "Cadastre",
    desc: "Registre campo, rebanho, vendas e custos — pelo computador ou celular, com import de planilha.",
  },
  {
    n: "02",
    title: "Conecte",
    desc: "Os dados se ligam automaticamente: um lançamento alimenta financeiro, COGS, mapa e relatórios.",
  },
  {
    n: "03",
    title: "Visualize",
    desc: "Dashboards, gráficos e o mapa operacional mostram tudo em tempo real numa torre de controle.",
  },
  {
    n: "04",
    title: "Decida",
    desc: "Alertas de SLA, vacinação, validade e margem ajudam a agir antes do prejuízo.",
  },
];

const cases = [
  {
    category: "AGRICULTURA",
    title: "Lavoura monitorada do plantio à colheita",
    img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    category: "PECUÁRIA",
    title: "Rebanho rastreado por lote e QR Code",
    img: "https://images.unsplash.com/photo-1605280263929-1c42c62ef169?auto=format&fit=crop&w=1200&q=80",
  },
  {
    category: "LOGÍSTICA",
    title: "Frota e cargas acompanhadas no mapa",
    img: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80",
  },
];

const pillars = [
  {
    title: "Dados em tempo real",
    desc: "Cada lançamento no campo, na pecuária ou na logística atualiza instantaneamente os KPIs da operação inteira.",
  },
  {
    title: "Tudo conectado",
    desc: "Uma única ontologia de dados liga produção, vendas, financeiro e sustentabilidade — sem planilhas soltas.",
  },
  {
    title: "Decisão mais rápida",
    desc: "Alertas e indicadores cruzados ajudam o produtor a agir antes que o problema vire prejuízo.",
  },
];

function PlatformPreview() {
  const kpis = [
    { label: "OTIF", value: "92%", tone: GREEN },
    { label: "Vendas", value: "R$ 108k", tone: "#e2e8f0" },
    { label: "Cargas", value: "24", tone: "#60a5fa" },
    { label: "Alertas", value: "3", tone: "#f59e0b" },
  ];
  const bars = [38, 64, 52, 80, 47, 70, 58];
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-slate-800/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 truncate text-[11px] text-slate-400">
          nery-agro · Torre de Controle
        </span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg border border-white/10 bg-slate-800/50 p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">{k.label}</div>
              <div className="mt-1 text-xl font-bold" style={{ color: k.tone }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-white/10 bg-slate-800/40 p-4">
          <div className="mb-3 text-[11px] text-slate-400">Volume por módulo</div>
          <div className="flex h-28 items-end gap-2">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${h}%`,
                  backgroundColor: i === 3 ? GREEN : "rgba(43,178,74,0.35)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="bg-white text-slate-900">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/70 px-6 backdrop-blur sm:px-10">
        <a href="#inicio" className="font-heading text-2xl font-bold tracking-tight text-white">
          NER<span style={{ color: GREEN }}>Y</span>
        </a>
        <nav className="hidden items-center gap-8 text-xs font-semibold tracking-[0.14em] text-slate-200 md:flex">
          {navLinks.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>
        <Link
          to="/torre-de-controle"
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-bold tracking-[0.1em] text-white transition hover:bg-white/10"
          style={{ borderColor: GREEN }}
        >
          ACESSAR PLATAFORMA
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section id="inicio" className="relative flex min-h-[92vh] items-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_IMG})` }}
          />
          <div className="absolute inset-0 bg-slate-950/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80" />

          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 sm:px-10 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: GREEN }}>
                Gestão agro em tempo real
              </p>
              <h1 className="font-heading mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
                Gestão <span style={{ color: GREEN }}>inteligente</span> do campo ao financeiro
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base text-slate-200 sm:text-lg lg:mx-0">
                Conecte campo, pecuária, logística, financeiro e sustentabilidade em uma única
                plataforma — com KPIs, alertas e mapas que ajudam a decidir mais rápido e a reduzir
                perdas.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link
                  to="/torre-de-controle"
                  className="inline-flex items-center gap-2 rounded-md px-7 py-3.5 text-sm font-bold tracking-[0.08em] text-white shadow-[0_10px_30px_rgba(43,178,74,0.4)] transition hover:opacity-90"
                  style={{ backgroundColor: GREEN }}
                >
                  ACESSAR PLATAFORMA
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#capacidades"
                  className="inline-flex items-center gap-2 rounded-md border border-white/30 px-7 py-3.5 text-sm font-bold tracking-[0.08em] text-white transition hover:bg-white/10"
                >
                  VER CAPACIDADES
                </a>
              </div>
            </div>
            <div className="hidden lg:block">
              <PlatformPreview />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section id="resultados" className="bg-white px-6 py-20 sm:px-10">
          <div className="mx-auto grid max-w-5xl gap-12 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.kicker}>
                <p
                  className="text-xs font-bold uppercase tracking-[0.16em]"
                  style={{ color: GREEN }}
                >
                  {stat.kicker}
                </p>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="font-heading text-6xl font-bold text-slate-950">
                    {stat.value}
                  </span>
                  <span className="text-xl font-bold text-slate-600">{stat.unit}</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{stat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Módulos */}
        <section id="modulos" className="bg-slate-50 px-6 py-24 sm:px-10">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GREEN }}>
              Módulos
            </p>
            <h2 className="font-heading mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Uma plataforma, todos os módulos da operação agro.
            </h2>
            <div className="mt-12 grid gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod) => (
                <div
                  key={mod.title}
                  className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "rgba(43,178,74,0.12)", color: GREEN }}
                  >
                    <mod.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading mt-5 text-lg font-bold text-slate-950">
                    {mod.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capacidades transversais */}
        <section id="capacidades" className="bg-white px-6 py-24 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GREEN }}>
                Capacidades
              </p>
              <h2 className="font-heading mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                O que torna a operação realmente sob controle.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "rgba(43,178,74,0.12)", color: GREEN }}
                  >
                    <cap.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-950">{cap.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tudo que controla (catálogo por área) */}
        <section className="bg-slate-50 px-6 py-24 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GREEN }}>
                Controle completo
              </p>
              <h2 className="font-heading mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Tudo que você gerencia em um só lugar.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {controlAreas.map((area) => (
                <div
                  key={area.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "rgba(43,178,74,0.12)", color: GREEN }}
                    >
                      <area.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-slate-950">{area.title}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {area.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: GREEN }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="bg-white px-6 py-24 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GREEN }}>
                Como funciona
              </p>
              <h2 className="font-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Do lançamento à decisão, em quatro passos.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <div key={step.n} className="relative">
                  <span className="font-heading text-5xl font-bold text-slate-200">{step.n}</span>
                  <span className="mt-2 block h-1 w-10" style={{ backgroundColor: GREEN }} />
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Casos / Resultados com fotos */}
        <section className="bg-[#2e2e2e] px-6 py-24 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GREEN }}>
                Na prática
              </p>
              <h2 className="font-heading mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Toda a operação, do plantio à entrega.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                Da lavoura ao rebanho e à logística, cada elo da cadeia é registrado, conectado e
                visível em tempo real.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {cases.map((item) => (
                <div key={item.title} className="group relative h-72 overflow-hidden rounded-xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.img})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.16em]"
                      style={{ color: GREEN }}
                    >
                      {item.category}
                    </p>
                    <p className="mt-2 inline-block rounded bg-slate-950/60 px-2.5 py-1.5 text-sm font-semibold text-white backdrop-blur">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pilares */}
        <section id="sobre" className="bg-white px-6 py-24 sm:px-10">
          <div className="mx-auto grid max-w-5xl gap-12 sm:grid-cols-3">
            {pillars.map((pillar) => (
              <div key={pillar.title}>
                <span className="block h-1 w-12" style={{ backgroundColor: GREEN }} />
                <h3 className="font-heading mt-5 text-xl font-bold text-slate-950">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA escuro com foto */}
        <section className="bg-[#2e2e2e]">
          <div className="mx-auto grid max-w-6xl items-stretch sm:grid-cols-2">
            <div className="flex flex-col justify-center gap-5 px-6 py-20 sm:px-10">
              <h2
                className="font-heading text-3xl font-bold leading-tight sm:text-4xl"
                style={{ color: GREEN }}
              >
                Gestão completa,
                <br />
                do plantio à entrega.
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-slate-200">
                Acompanhe sua fazenda com dados conectados em tempo real e tome decisões mais
                rápidas, com menos perdas e mais eficiência.
              </p>
              <div>
                <Link
                  to="/torre-de-controle"
                  className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-xs font-bold tracking-[0.1em] text-white transition hover:opacity-90"
                  style={{ backgroundColor: GREEN }}
                >
                  ACESSAR PLATAFORMA
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div
              className="min-h-[320px] w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${CTA_IMG})` }}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white px-6 py-8 sm:px-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
            <p>Copyright © {new Date().getFullYear()} Nery Agro. Todos os direitos reservados.</p>
            <Link to="/torre-de-controle" className="font-semibold" style={{ color: GREEN }}>
              Acessar plataforma →
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
