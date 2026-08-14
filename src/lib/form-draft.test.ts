// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearDraft, draftHora, loadDraft, saveDraft } from "@/lib/form-draft";

const A = { orgId: "org-a", userId: "user-1" };
const B = { orgId: "org-b", userId: "user-2" };

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("saveDraft / loadDraft", () => {
  it("devolve o que foi salvo, com o horário", () => {
    saveDraft("remessa-colar", A, { text: "CAIXAS 120" });
    const d = loadDraft<{ text: string }>("remessa-colar", A);
    expect(d?.value.text).toBe("CAIXAS 120");
    expect(d?.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("o rascunho de uma empresa NÃO vaza para outra", () => {
    // Mesma razão da fila offline: aparelho compartilhado não pode devolver o
    // que uma empresa digitou para a sessão de outra.
    saveDraft("remessa-colar", A, { text: "romaneio da empresa A" });
    expect(loadDraft("remessa-colar", B)).toBeNull();
    expect(loadDraft<{ text: string }>("remessa-colar", A)?.value.text).toBe(
      "romaneio da empresa A",
    );
  });

  it("formulários diferentes não se misturam", () => {
    saveDraft("remessa-colar", A, { text: "x" });
    expect(loadDraft("rdc-ficha", A)).toBeNull();
  });

  it("o `id` separa rascunhos do mesmo formulário", () => {
    saveDraft("rdc-ficha", A, { resumo: "ficha 1" }, "rdc-1");
    saveDraft("rdc-ficha", A, { resumo: "ficha 2" }, "rdc-2");
    expect(loadDraft<{ resumo: string }>("rdc-ficha", A, "rdc-1")?.value.resumo).toBe("ficha 1");
    expect(loadDraft<{ resumo: string }>("rdc-ficha", A, "rdc-2")?.value.resumo).toBe("ficha 2");
  });

  it("clearDraft remove só o alvo", () => {
    saveDraft("remessa-colar", A, { text: "x" });
    saveDraft("rdc-ficha", A, { resumo: "y" });
    clearDraft("remessa-colar", A);
    expect(loadDraft("remessa-colar", A)).toBeNull();
    expect(loadDraft("rdc-ficha", A)).not.toBeNull();
  });
});

describe("robustez — rascunho nunca pode quebrar o formulário", () => {
  it("localStorage cheio não lança", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    // Aba privada do iOS e disco cheio caem aqui. O rascunho é conveniência
    // sobre o caminho principal, não parte dele.
    expect(() => saveDraft("remessa-colar", A, { text: "x" })).not.toThrow();
  });

  it("conteúdo corrompido devolve null em vez de estourar", () => {
    window.localStorage.setItem("agrotorre-draft:remessa-colar:org-a:user-1", "{quebrado");
    expect(loadDraft("remessa-colar", A)).toBeNull();
  });

  it("rascunho acima do teto é descartado, não estoura a cota", () => {
    // Um romaneio em base64 encheria o localStorage e derrubaria o rascunho de
    // OUTRO formulário junto.
    saveDraft("remessa-colar", A, { text: "x".repeat(300_000) });
    expect(loadDraft("remessa-colar", A)).toBeNull();
  });
});

describe("draftHora", () => {
  it("formata HH:MM em pt-BR", () => {
    expect(draftHora(new Date(2026, 7, 4, 14, 32).toISOString())).toBe("14:32");
  });

  it("data inválida não vira 'Invalid Date' na tela", () => {
    expect(draftHora("xxx")).toBe("");
  });
});
