import { describe, expect, it } from "vitest";
import type { OperationRecord } from "@/lib/supabase-operations";
import {
  matchRemessaCandidates,
  resumoCandidato,
  SCORE_FORTE,
  SCORE_MINIMO,
} from "@/lib/remessa-match";

function rec(id: string, payload: Record<string, string>): OperationRecord {
  return { id, area: "logistica", module: "remessa", payload };
}

// Caso real do cliente (08/07/2026): Lorival fez DUAS viagens no mesmo dia, com
// os romaneios 9425 e 9426. A mensagem de texto do apontador não traz o nº do
// romaneio — só a foto traz.
const viagem9426 = rec("v1", {
  data: "2026-07-08",
  placa: "NFN-6I47",
  fazenda: "Sato",
  talhao: "03",
  romaneio_num: "9426",
  ordem_producao: "TL03 PV51 SATO CEB",
  qtd_caixas: "881",
  peso_liquido: "19178",
  hora_saida: "09:22",
});
const viagem9425 = rec("v2", {
  data: "2026-07-08",
  placa: "NFN-6I47",
  fazenda: "Sato",
  talhao: "03",
  romaneio_num: "9425",
  qtd_caixas: "876",
  peso_liquido: "19368",
  hora_saida: "13:45",
});
const base = [viagem9426, viagem9425];

describe("matchRemessaCandidates — o nº do romaneio é a chave mais forte", () => {
  it("o ticket da balança encontra a carga certa pelo romaneio", () => {
    const doTicket = {
      data: "2026-07-08",
      placa: "NFN-6I47",
      romaneio_num: "9426",
      peso_liquido: "19178",
    };
    const [primeiro] = matchRemessaCandidates(doTicket, base);
    expect(primeiro.id).toBe("v1");
    expect(primeiro.score).toBeGreaterThanOrEqual(SCORE_FORTE);
    expect(primeiro.motivos.join(" ")).toContain("nº de romaneio");
  });
});

describe("matchRemessaCandidates — duas viagens do mesmo caminhão no mesmo dia", () => {
  // Sem o desempate por horário, as duas empatariam em placa+data e o sistema
  // conciliaria a carga errada.
  const doTexto = {
    data: "2026-07-08",
    placa: "NFN-6I47",
    fazenda: "Sato",
    talhao: "03",
    qtd_caixas: "881",
    peso_liquido: "19178",
    hora_saida: "09:30",
  };
  const achados = matchRemessaCandidates(doTexto, base);

  it("escolhe a viagem da manhã, não a da tarde", () => {
    expect(achados[0].id).toBe("v1");
  });
  it("a viagem da tarde fica com score menor", () => {
    const tarde = achados.find((c) => c.id === "v2");
    expect(tarde ? tarde.score : 0).toBeLessThan(achados[0].score);
  });
  it("avisa que os horários distantes podem ser outra viagem", () => {
    const tarde = achados.find((c) => c.id === "v2");
    if (tarde) expect(tarde.motivos.join(" ")).toContain("outra viagem");
  });
});

describe("matchRemessaCandidates — não inventa parentesco", () => {
  it("carga de outro dia não entra (pré-filtro de ±3 dias)", () => {
    const outroDia = { data: "2026-08-20", placa: "NFN-6I47", qtd_caixas: "881" };
    expect(matchRemessaCandidates(outroDia, base)).toEqual([]);
  });
  it("outra placa e outros números não atingem o mínimo", () => {
    const outra = {
      data: "2026-07-08",
      placa: "ZZZ-9Z99",
      fazenda: "Nascente",
      qtd_caixas: "120",
      peso_liquido: "2400",
    };
    expect(matchRemessaCandidates(outra, base)).toEqual([]);
  });
  it("só a data igual não basta para sugerir conciliação", () => {
    const magra = { data: "2026-07-08" };
    expect(matchRemessaCandidates(magra, base).every((c) => c.score >= SCORE_MINIMO)).toBe(true);
    expect(matchRemessaCandidates(magra, base)).toEqual([]);
  });
});

describe("resumoCandidato", () => {
  it("descreve a carga em uma linha", () => {
    expect(resumoCandidato(viagem9426.payload)).toBe(
      "NFN-6I47 · 2026-07-08 · romaneio 9426 · 881 cx · Sato",
    );
  });
  it("não quebra com payload vazio", () => {
    expect(resumoCandidato({})).toBe("carga sem identificação");
  });
});
