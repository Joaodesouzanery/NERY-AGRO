import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Leaf,
  QrCode,
  Sprout,
  Truck,
  Wallet,
} from "lucide-react";

const GREEN = "#2e9e44";

const navLinks = [
  { label: "INÍCIO", href: "#inicio" },
  { label: "MÓDULOS", href: "#modulos" },
  { label: "RESULTADOS", href: "#resultados" },
  { label: "SOBRE", href: "#sobre" },
];

const stats = [
  { kicker: "JÁ MONITORAMOS MAIS DE", value: "120", unit: "mil ha", desc: "De área agrícola e pecuária acompanhadas em tempo real pela plataforma." },
  { kicker: "JÁ PROCESSAMOS MAIS DE", value: "850", unit: "mil registros", desc: "Entre campo, pecuária, logística, financeiro e sustentabilidade." },
  { kicker: "TEMOS MAIS DE", value: "9", unit: "módulos", desc: "Integrados em uma única torre de controle operacional." },
];

const modules = [
  { title: "Campo", desc: "Calendário, insumos, pragas, solo, irrigação e diário de campo em um só lugar.", icon: Sprout },
  { title: "Pecuária", desc: "Lotes, QR Code, vacinação, reprodução e produção diária rastreados ponta a ponta.", icon: QrCode },
  { title: "Financeiro & COGS", desc: "Custos, fluxo de caixa e ponto de equilíbrio conectados à operação real.", icon: Wallet },
  { title: "Logística", desc: "Cargas, rotas, frota e bases monitoradas no mapa em tempo real.", icon: Truck },
  { title: "Sustentabilidade", desc: "Certificação orgânica, carbono, resíduos e APP acompanhados por indicadores.", icon: Leaf },
  { title: "Inteligência", desc: "KPIs, alertas e relatórios cruzando dados de todos os módulos automaticamente.", icon: BarChart3 },
];

const pillars = [
  { title: "Dados em tempo real", desc: "Cada lançamento no campo, na pecuária ou na logística atualiza instantaneamente os KPIs da operação inteira." },
  { title: "Tudo conectado", desc: "Uma única ontologia de dados liga produção, vendas, financeiro e sustentabilidade — sem planilhas soltas." },
  { title: "Decisão mais rápida", desc: "Alertas e indicadores cruzados ajudam o produtor a agir antes que o problema vire prejuízo." },
];

export function LandingPage() {
  return (
    <div className="bg-white text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-6 shadow-[0_1px_8px_rgba(15,23,42,0.05)] sm:px-10">
        <a href="#inicio" className="flex items-baseline gap-1 text-xl font-extrabold tracking-tight text-slate-900">
          NERY<span style={{ color: GREEN }}>.</span>
        </a>
        <nav className="hidden items-center gap-7 text-xs font-semibold tracking-[0.12em] text-slate-700 md:flex">
          {navLinks.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-slate-950">
              {item.label}
            </a>
          ))}
        </nav>
        <Link
          to="/torre-de-controle"
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-bold tracking-[0.1em] text-slate-900 transition hover:bg-slate-50"
          style={{ borderColor: GREEN }}
        >
          ACESSAR PLATAFORMA
        </Link>
      </header>

      <main className="pt-16">
        <section id="inicio" className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white px-6 py-20 sm:px-10 sm:py-28">
          <div
            className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full opacity-10 blur-3xl"
            style={{ background: GREEN }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GREEN }}>
              Gestão agro em tempo real
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Do campo ao financeiro, toda a sua operação em uma única plataforma.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-slate-600">
              Conecte campo, pecuária, logística, financeiro e sustentabilidade em tempo real — com KPIs, alertas
              e mapas que ajudam a decidir mais rápido e a reduzir perdas.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/torre-de-controle"
                className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-bold tracking-[0.08em] text-white shadow-[0_8px_20px_rgba(46,158,68,0.35)] transition hover:opacity-90"
                style={{ backgroundColor: GREEN }}
              >
                ACESSAR PLATAFORMA
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id="resultados" className="bg-white px-6 py-16 sm:px-10">
          <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.kicker}>
                <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: GREEN }}>
                  {stat.kicker}
                </p>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="text-6xl font-extrabold text-slate-950">{stat.value}</span>
                  <span className="text-xl font-bold text-slate-700">{stat.unit}</span>
                </p>
                <p className="mt-3 text-sm text-slate-500">{stat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="modulos" className="bg-slate-50 px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: GREEN }}>
              Módulos
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Uma plataforma, todos os módulos da operação agro.
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod) => (
                <div key={mod.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "rgba(46,158,68,0.12)", color: GREEN }}
                  >
                    <mod.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-950">{mod.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="sobre" className="bg-white px-6 py-20 sm:px-10">
          <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
            {pillars.map((pillar) => (
              <div key={pillar.title}>
                <span className="block h-1 w-10" style={{ backgroundColor: GREEN }} />
                <h3 className="mt-4 text-lg font-bold text-slate-950">{pillar.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#3a3a3a] px-6 py-0 sm:px-0">
          <div className="mx-auto grid max-w-6xl sm:grid-cols-2">
            <div className="flex flex-col justify-center gap-5 px-6 py-16 sm:px-10">
              <h2 className="text-2xl font-extrabold leading-snug sm:text-3xl" style={{ color: GREEN }}>
                Gestão completa,
                <br />
                do plantio à entrega.
              </h2>
              <p className="text-sm text-slate-200">
                Acompanhe sua fazenda com dados conectados em tempo real e tome decisões mais rápidas, com menos
                perdas e mais eficiência.
              </p>
              <div>
                <Link
                  to="/torre-de-controle"
                  className="inline-flex items-center gap-2 rounded-md border border-white px-5 py-2.5 text-xs font-bold tracking-[0.1em] text-white transition hover:bg-white/10"
                >
                  ACESSAR PLATAFORMA
                </Link>
              </div>
            </div>
            <div
              className="min-h-[260px] w-full"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(46,158,68,0.85), rgba(15,23,42,0.9))",
              }}
            />
          </div>
        </section>

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
