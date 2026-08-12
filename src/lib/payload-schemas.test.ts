import { describe, expect, it } from "vitest";
import { CAMPOS_OBRIGATORIOS, ehObrigatorio, validatePayload } from "@/lib/payload-schemas";

// Antes disto, NADA era obrigatório em lugar nenhum do produto: não havia
// `required` no tipo, não havia <form>, e a coluna é `jsonb not null default
// '{}'` — ou seja, `{}` é payload válido. Salvar tudo em branco gravava o
// registro e mostrava "Registro adicionado." em verde.

describe("CAMPOS_OBRIGATORIOS", () => {
  it("é a fonte única — o schema exige exatamente o que a lista declara", () => {
    // Se as duas discordarem, o asterisco do formulário aponta um campo e o
    // Salvar reprova outro.
    for (const [module, campos] of Object.entries(CAMPOS_OBRIGATORIOS)) {
      for (const campo of campos) {
        const semOCampo = validatePayload(module, {});
        expect(semOCampo.ok, `${module}: nada é exigido, mas ${campo} está na lista`).toBe(false);
      }
    }
  });

  it("fica curta de propósito — cadastrar incompleto é o fluxo real", () => {
    // A base existe antes de alguém ir até lá pegar a coordenada; o veículo é
    // cadastrado quando chega, não quando a documentação fica pronta.
    expect(CAMPOS_OBRIGATORIOS.frota).toEqual(["placa"]);
    expect(CAMPOS_OBRIGATORIOS.bases).toEqual(["nome"]);
  });

  it("ehObrigatorio responde por campo e não inventa módulo", () => {
    expect(ehObrigatorio("frota", "placa")).toBe(true);
    expect(ehObrigatorio("frota", "modelo")).toBe(false);
    expect(ehObrigatorio("inexistente", "placa")).toBe(false);
  });
});

describe("validatePayload", () => {
  it("módulo sem schema passa — a cobertura é incremental", () => {
    expect(validatePayload("cestas", {}).ok).toBe(true);
  });

  it("recusa o campo obrigatório vazio, em português", () => {
    const r = validatePayload("frota", { placa: "  ", modelo: "Scania" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.field).toBe("placa");
      expect(r.error).toContain("obrigatório");
    }
  });

  it("recusa a CHAVE AUSENTE, não só a vazia", () => {
    // O formulário de remessa monta o payload só com o que foi preenchido.
    // Sem o preprocess, o zod responderia "Required" — em inglês, e sem dizer
    // que o campo é obrigatório.
    const r = validatePayload("bases", { cidade: "Cristalina/GO" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.field).toBe("nome");
      expect(r.error).toContain("obrigatório");
      expect(r.error).not.toContain("Required");
    }
  });

  it("usa o rótulo da tela na mensagem, não a chave crua", () => {
    const r = validatePayload("frota", {}, { placa: "Placa do veículo" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Placa do veículo");
  });

  it("aceita número com vírgula e recusa texto em campo numérico", () => {
    expect(validatePayload("frota", { placa: "ABC-1D23", consumo_km_l: "2,5" }).ok).toBe(true);
    const r = validatePayload("frota", { placa: "ABC-1D23", km_atual: "muito" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("número");
  });

  it("preserva campo que o schema não conhece", () => {
    // `.passthrough()` é o que garante que campo novo — ou chave legada vinda
    // de importação antiga — não seja descartado no caminho.
    expect(validatePayload("bases", { nome: "Matriz", campo_de_2024: "x" }).ok).toBe(true);
  });

  it("campo obrigatório preenchido passa mesmo com o resto em branco", () => {
    // É o pedido literal: poder cadastrar sem ter todas as informações.
    expect(validatePayload("frota", { placa: "ABC-1D23" }).ok).toBe(true);
    expect(validatePayload("bases", { nome: "CD Brasília" }).ok).toBe(true);
  });
});
