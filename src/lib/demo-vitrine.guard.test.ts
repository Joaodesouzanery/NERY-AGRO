import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultPeriod } from "@/components/period-picker";
import { demoLogisticaRecords } from "@/lib/demo/logistica";
import { filtrarRegistros } from "@/lib/filtro-registros";
import { buildLogisticaOverview } from "@/lib/overview/logistica";

// Teste-guarda: a vitrine DEMO tem que ENCHER a tela.
//
// Esta rodada começou com um relato de que três gráficos apareciam vazios em
// modo DEMO. A leitura do código dizia que não deveriam — as chaves batiam com
// as abas e o builder tinha teste —, e não foi possível reproduzir. O problema
// desse desfecho é que nada no produto garantia o fato: era palavra contra
// leitura.
//
// Este arquivo troca isso por uma checagem. Se algum dia um gráfico de destaque
// ficar sem dado na vitrine, ou uma aba sumir por causa do período padrão, o
// teste falha nomeando qual.
//
// LIMITE, declarado de propósito: isto prova o DADO e o BUILDER. Não prova a
// entrega em runtime — que a flag chegue à tela é assunto de
// `demo-cache.guard.test.ts` e do provider.

/** Vitrines já migradas para `src/lib/demo/`, com builder de visão geral. */
const VITRINES = [
  {
    moduleId: "logistica",
    registros: () => demoLogisticaRecords(),
    build: (r: ReturnType<typeof demoLogisticaRecords>) => buildLogisticaOverview(r, true),
  },
];

/**
 * Módulos cuja vitrine ainda mora dentro da rota. Cada linha é dívida
 * declarada, não permissão permanente — allowlist que encolhe é allowlist viva.
 */
const AINDA_NA_ROTA: Record<string, string> = {
  "src/routes/campo.tsx": "demoRecords das 18 abas de Campo",
  "src/routes/inteligencia.tsx": "demoByModule das 4 abas",
  "src/routes/equipe-vendas.tsx": "demoByModule das 3 abas",
  "src/routes/otimizacao-cogs.tsx": "demoByModule das 6 abas",
  "src/routes/sustentabilidade.tsx": "demoByModule das 5 abas",
};

function arquivos(dir: string): string[] {
  const saida: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho));
    else if (/\.tsx?$/.test(nome) && !/\.test\.tsx?$/.test(nome)) saida.push(caminho);
  }
  return saida;
}

describe("guarda: a vitrine DEMO enche a tela", () => {
  it("todo gráfico de destaque tem dado em DEMO", () => {
    // É a checagem que faltava quando os três gráficos foram reportados vazios.
    for (const v of VITRINES) {
      const spec = v.build(v.registros());
      const destaques = spec.charts.filter((c) => c.featured);
      expect(destaques.length, `${v.moduleId}: nenhum gráfico de destaque`).toBeGreaterThan(0);
      for (const c of destaques) {
        expect(
          c.data.length,
          `${v.moduleId}/${c.id} ("${c.title}") aparece VAZIO na vitrine`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("nenhum gráfico da grade fica vazio na vitrine", () => {
    // Card vazio na visão geral diz 'Cadastre registros em "X"' — instrução
    // impossível em DEMO, onde ninguém cadastra nada.
    for (const v of VITRINES) {
      const vazios = v
        .build(v.registros())
        .charts.filter((c) => !c.featured && c.data.length === 0)
        .map((c) => c.id);
      expect(vazios, `${v.moduleId}: gráficos sem dado na vitrine`).toEqual([]);
    }
  });

  it("nenhuma aba some com o período padrão da tela", () => {
    for (const v of VITRINES) {
      for (const [aba, lista] of Object.entries(v.registros())) {
        if (!lista.length) continue;
        expect(
          filtrarRegistros(lista, { periodo: defaultPeriod() }).length,
          `${v.moduleId}/${aba}: a vitrine some quando a tela aplica "${defaultPeriod().label}"`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("todo registro da vitrine tem data — senão o teste acima passa por omissão", () => {
    // `dentroDoPeriodo` deixa passar registro cuja data não dá para ler.
    for (const v of VITRINES) {
      for (const [aba, lista] of Object.entries(v.registros())) {
        for (const r of lista) {
          expect(r.created_at, `${v.moduleId}/${aba}: ${r.id} sem created_at`).toBeTruthy();
        }
      }
    }
  });

  it("dado de exemplo mora em src/lib/demo/, não dentro da rota", () => {
    const fora: string[] = [];
    for (const caminho of [...arquivos("src/routes"), ...arquivos("src/components")]) {
      if (caminho in AINDA_NA_ROTA) continue;
      const texto = readFileSync(caminho, "utf8");
      if (/const demo\w*(: [^=]+)?\s*=\s*[[{]/.test(texto)) fora.push(caminho);
    }
    expect(
      fora,
      "Vitrine dentro de componente/rota: não dá para testá-la sem montar a árvore " +
        "inteira, e ela acaba divergindo da vitrine dos outros módulos. Mova para " +
        "src/lib/demo/ — ou declare a dívida em AINDA_NA_ROTA, com o motivo.",
    ).toEqual([]);
  });
});
