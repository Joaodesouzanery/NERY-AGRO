import { describe, expect, it } from "vitest";
import {
  belongsTo,
  classifyQueue,
  isOrphan,
  ownerKey,
  sameOwner,
  selectForOwner,
} from "@/lib/offline-owner";

// A regra de isolamento é testada aqui, pura, sem subir IndexedDB nem
// localStorage — mesmo critério dos outros 47 arquivos de teste do repo. O que
// importa provar é a DECISÃO (o que sincroniza, o que fica retido, o que é
// órfão), não a mecânica de storage do navegador.

const A = { orgId: "org-a", userId: "user-1" };
const B = { orgId: "org-b", userId: "user-2" };
/** Mesmo usuário, empresa diferente: o caso do super-admin que troca de empresa. */
const A_OUTRA_EMPRESA = { orgId: "org-b", userId: "user-1" };

const item = (org: string | undefined, user: string | undefined, id = "i") => ({
  id,
  org_id: org,
  user_id: user,
  peso_kg: 420,
});

describe("ownerKey / sameOwner", () => {
  it("identidade é o par empresa+usuário", () => {
    expect(ownerKey(A)).toBe("org-a:user-1");
    expect(sameOwner(A, { ...A })).toBe(true);
    expect(sameOwner(A, B)).toBe(false);
  });

  it("mesmo usuário em empresa diferente NÃO é o mesmo dono", () => {
    // Super-admin da Nery Agro enfileira vendo a Empresa A e troca para a B no
    // seletor do topo. Sem esta distinção, o flush gravaria em B.
    expect(sameOwner(A, A_OUTRA_EMPRESA)).toBe(false);
  });
});

describe("isOrphan", () => {
  it("item sem carimbo é órfão", () => {
    expect(isOrphan(item(undefined, undefined))).toBe(true);
    expect(isOrphan(item("org-a", undefined))).toBe(true);
    expect(isOrphan(item(undefined, "user-1"))).toBe(true);
    expect(isOrphan(item("org-a", "user-1"))).toBe(false);
  });
});

describe("selectForOwner — o que o flush pode sincronizar", () => {
  it("só o que é do dono atual", () => {
    const fila = [item("org-a", "user-1", "1"), item("org-b", "user-2", "2")];
    expect(selectForOwner(fila, A).map((i) => i.id)).toEqual(["1"]);
    expect(selectForOwner(fila, B).map((i) => i.id)).toEqual(["2"]);
  });

  it("órfão NUNCA sincroniza — nem para quem está logado", () => {
    // É o ponto do desenho: atribuir o órfão ao usuário atual é justamente o
    // bug que estamos corrigindo, só que na direção contrária.
    expect(selectForOwner([item(undefined, undefined)], A)).toEqual([]);
  });

  it("o cenário do tablet compartilhado", () => {
    // A pesa 200 animais sem sinal e sai. B (outra empresa) entra e abre o Modo
    // Curral: o flush dispara no mount. Antes, as 200 pesagens entravam na
    // empresa de B — A perdia o dado e B recebia dado de A.
    const daEmpresaA = Array.from({ length: 200 }, (_, i) => item("org-a", "user-1", `p${i}`));
    expect(selectForOwner(daEmpresaA, B)).toEqual([]);
    // E continuam intactas esperando A voltar — não foram apagadas.
    expect(selectForOwner(daEmpresaA, A)).toHaveLength(200);
  });
});

describe("classifyQueue — o que a tela mostra", () => {
  it("separa meus, de outros (contagem) e órfãos", () => {
    const fila = [
      item("org-a", "user-1", "1"),
      item("org-a", "user-1", "2"),
      item("org-b", "user-2", "3"),
      item(undefined, undefined, "4"),
    ];
    const r = classifyQueue(fila, A);
    expect(r.meus.map((i) => i.id)).toEqual(["1", "2"]);
    expect(r.deOutros).toBe(1);
    expect(r.orfaos.map((i) => i.id)).toEqual(["4"]);
  });

  it("`deOutros` é número, não lista — a UI não pode expor o que é do vizinho", () => {
    // Quantas pesagens a outra empresa fez já é informação dela. A tela diz
    // apenas que existem registros de outra sessão.
    const r = classifyQueue([item("org-b", "user-2")], A);
    expect(typeof r.deOutros).toBe("number");
    expect(r.meus).toEqual([]);
  });

  it("fila vazia não quebra", () => {
    expect(classifyQueue([], A)).toEqual({ meus: [], deOutros: 0, orfaos: [] });
  });
});

describe("belongsTo", () => {
  it("exige empresa E usuário", () => {
    expect(belongsTo(item("org-a", "user-1"), A)).toBe(true);
    expect(belongsTo(item("org-a", "user-9"), A)).toBe(false);
    expect(belongsTo(item("org-z", "user-1"), A)).toBe(false);
  });
});
