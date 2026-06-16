import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Leaf, QrCode, Sprout, Truck, Wallet } from "lucide-react";

const GREEN = "#2bb24a";

// Fotos de stock (Unsplash) com tema agro.
const HERO_IMG =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2400&q=80";
const CTA_IMG =
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1600&q=80";

const navLinks = [
  { label: "INÍCIO", href: "#inicio" },
  { label: "MÓDULOS", href: "#modulos" },
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

          <div className="relative mx-auto w-full max-w-5xl px-6 text-center sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: GREEN }}>
              Gestão agro em tempo real
            </p>
            <h1 className="font-heading mx-auto mt-5 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
              Gestão <span style={{ color: GREEN }}>inteligente</span> do campo ao financeiro
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-200 sm:text-lg">
              Conecte campo, pecuária, logística, financeiro e sustentabilidade em uma única
              plataforma — com KPIs, alertas e mapas que ajudam a decidir mais rápido e a reduzir
              perdas.
            </p>
            <div className="mt-9 flex justify-center">
              <Link
                to="/torre-de-controle"
                className="inline-flex items-center gap-2 rounded-md px-7 py-3.5 text-sm font-bold tracking-[0.08em] text-white shadow-[0_10px_30px_rgba(43,178,74,0.4)] transition hover:opacity-90"
                style={{ backgroundColor: GREEN }}
              >
                ACESSAR PLATAFORMA
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-12 flex justify-center gap-2">
              <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: GREEN }} />
              <span className="h-1.5 w-2.5 rounded-full bg-white/40" />
              <span className="h-1.5 w-2.5 rounded-full bg-white/40" />
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
                  className="inline-flex items-center gap-2 rounded-md border border-white px-6 py-3 text-xs font-bold tracking-[0.1em] text-white transition hover:bg-white/10"
                >
                  ACESSAR PLATAFORMA
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
