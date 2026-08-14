import { describe, expect, it } from "vitest";
import { talhaoMatches } from "./talhao-match";

describe("talhaoMatches (casa apontamento ao talhão)", () => {
  it("casa por igualdade normalizada (acento/caixa)", () => {
    expect(talhaoMatches("Talhão 03", "talhao 03")).toBe(true);
  });
  it("casa por número quando os rótulos diferem", () => {
    expect(talhaoMatches("Talhão 03", "03")).toBe(true);
    expect(talhaoMatches("PV 51", "Pivô 51")).toBe(true);
  });
  it("não casa talhões diferentes", () => {
    expect(talhaoMatches("Talhão 03", "Talhão 07")).toBe(false);
  });
  it("string vazia nunca casa", () => {
    expect(talhaoMatches("", "03")).toBe(false);
    expect(talhaoMatches("03", "")).toBe(false);
  });
});
