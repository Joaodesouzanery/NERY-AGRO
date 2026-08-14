import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Teste-guarda do painel que abre ao clicar num pino do mapa.
//
// O defeito que motivou: o painel casava alerta com ponto comparando o MÓDULO,
// então todo ponto de campo recebia TODOS os alertas de campo. Uma das
// cláusulas era `includes("")`, sempre verdadeira — bastava um rótulo vazio
// para os 12 alertas colarem num ponto só. Um painel cheio de alerta que não é
// daquele lugar é pior que um painel vazio: leva a decisão errada.

const PAINEL = readFileSync("src/components/map-entity-panel.tsx", "utf8");
const DADOS = readFileSync("src/lib/connected-agro-data.ts", "utf8");

describe("guarda: o painel do mapa mostra o que é daquele ponto", () => {
  it("alerta é ligado ao ponto por REGISTRO, não por módulo", () => {
    expect(PAINEL).toMatch(/a\.recordId === point\.recordId/);
    // `includes` no casamento é o padrão antigo: comparava strings de módulo e
    // de rótulo, e o `includes("")` casava com tudo.
    const trecho = PAINEL.slice(PAINEL.indexOf("const pointAlerts"), PAINEL.indexOf("const tabs"));
    expect(trecho).not.toMatch(/source\?\.toLowerCase\(\)\.includes/);
  });

  it("o alerta carrega o registro que o originou", () => {
    expect(DADOS).toMatch(/recordId\?: string;/);
    // As três famílias que nascem de um registro precisam preencher.
    expect(DADOS.match(/recordId: item\.id/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it("ponto de carga carrega recordId — senão o alerta dele fica órfão", () => {
    const rede = DADOS.slice(DADOS.indexOf("function buildNetworkMap"));
    expect(rede.slice(0, 2000)).toMatch(/recordId: item\.id/);
  });

  it("DETALHES não expõe identificador interno nem coordenada crua", () => {
    // A aba era um dump de depuração: ID, "Tom", Record ID, Lat, Lng e href em
    // fonte mono. Nada disso é do usuário.
    const detalhes = PAINEL.slice(PAINEL.indexOf('tab === "detalhes"'));
    expect(detalhes).not.toMatch(/\["Record ID"/);
    expect(detalhes).not.toMatch(/\["Tom"/);
    expect(detalhes).not.toMatch(/\["href"/);
  });

  it("navegação usa Link do router, não <a> que recarrega a página", () => {
    expect(PAINEL).toMatch(/from "@tanstack\/react-router"/);
    expect(PAINEL).not.toMatch(/<a\s+href=\{point\.href\}/);
  });

  it("a descrição do alerta aparece — ela existia e era ignorada", () => {
    expect(PAINEL).toMatch(/alert\.description/);
  });

  it("não voltou o gráfico que nunca renderiza", () => {
    // Eram 85 linhas de Recharts sob `if (point.series)`, e NENHUM ponto do
    // repo define `series`. Código morto no caminho mais quente da tela.
    expect(PAINEL).not.toMatch(/AreaChart|ResponsiveContainer/);
  });

  it("o backdrop não cobre a barra de camadas", () => {
    // Cobrindo-a, o primeiro clique numa camada só fechava o painel.
    expect(PAINEL).not.toMatch(/className="absolute inset-0 z-30"/);
  });
});
