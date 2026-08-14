import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Teste-guarda do isolamento entre empresas nas filas offline.
//
// O bug: `org_id` é carimbado pelo trigger `set_org_id` no INSERT, não na
// captura. Uma fila sem dono grava na empresa de quem sincronizar depois. Num
// tablet compartilhado, as 200 pesagens do operador da Empresa A entravam na
// Empresa B assim que alguém de B abria o Modo Curral — A perdia o dado e B
// recebia dado de A.
//
// As regras abaixo não são estilo: cada uma trava uma decisão de desenho que,
// desfeita, reabre o vazamento ou troca-o por perda de dado.

const ler = (caminho: string) => readFileSync(caminho, "utf8");

const FILA_PESAGEM = "src/features/pecuaria/offline/pesagem-queue.ts";
const MODO_CURRAL = "src/features/pecuaria/components/modo-curral.tsx";
const FILA_CALENDARIO = "src/features/campo-calendar/lib/offline-queue.ts";

describe("guarda: fila offline não atravessa empresa", () => {
  it("o item da fila declara empresa E usuário, obrigatórios", () => {
    const fonte = ler(FILA_PESAGEM);
    const tipo = fonte.match(/export type QueuedPesagem = \{([\s\S]*?)\n\};/)?.[1] ?? "";
    expect(tipo, "QueuedPesagem não encontrado").not.toBe("");
    // `org_id?:` (opcional) deixaria o typecheck aceitar item sem carimbo — e é
    // exatamente o item sem carimbo que vaza.
    expect(tipo).toMatch(/\borg_id: string;/);
    expect(tipo).toMatch(/\buser_id: string;/);
  });

  it("a fila não expõe leitura sem escopo de dono", () => {
    const fonte = ler(FILA_PESAGEM);
    // `listQueueRaw` existe, mas é interna. Exportá-la convida o próximo flush a
    // sincronizar item alheio.
    expect(fonte).not.toMatch(/export\s+(async\s+)?function\s+listQueueRaw/);
    expect(fonte).not.toMatch(/export\s+(async\s+)?function\s+clearQueue\b/);
    expect(fonte).toMatch(/export async function listQueueFor/);
  });

  it("o flush desiste sem dono, antes de tocar na fila", () => {
    const fonte = ler(MODO_CURRAL);
    const corpo = fonte.slice(
      fonte.indexOf("const flush = useCallback"),
      fonte.indexOf("for (const item"),
    );
    expect(corpo, "trecho do flush não encontrado").not.toBe("");
    expect(
      corpo,
      "A guarda `if (!owner) return` precisa vir ANTES do laço: sem ela o flush " +
        "sincroniza a fila de quem quer que esteja logado.",
    ).toMatch(/if\s*\(!\s*owner\)\s*return/);
  });

  it("a sincronização declara o org_id do item ao gravar", () => {
    // É a trava REAL. O filtro do cliente organiza a tela; quem recusa item de
    // outra empresa é a policy `with check (org_id = current_org_id())`, e ela
    // só entra em ação se o org_id for declarado no insert.
    const fonte = ler(MODO_CURRAL);
    expect(fonte).toMatch(/createPesagem\([\s\S]{0,400}item\.org_id/);
  });

  it("a fila do Calendário particiona a chave por dono", () => {
    const fonte = ler(FILA_CALENDARIO);
    expect(fonte).toMatch(/ownerKey\(/);
    // A chave crua da versão anterior não pode voltar a ser escrita: os itens
    // dela não têm dono conhecido.
    expect(fonte).not.toMatch(/setItem\(\s*STORAGE_KEY_LEGADO/);
  });

  it("NINGUÉM apaga fila no logout ou na troca de empresa", () => {
    // A regra mais importante do arquivo, e a mais contraintuitiva.
    //
    // Limpar a fila no signOut parece a correção óbvia do vazamento — e é a
    // perda que estamos corrigindo: o operador termina a sessão de curral sem
    // sinal e toca "Sair", e as 200 pesagens somem. O isolamento vem do carimbo
    // na captura + filtro no flush; a fila FICA, esperando o dono voltar.
    //
    // Assertion de ausência: ela existe contra quem, mês que vem, "consertar" o
    // vazamento apagando a fila.
    for (const arquivo of ["src/lib/auth.ts", "src/components/auth-provider.tsx"]) {
      const fonte = ler(arquivo);
      expect(
        fonte,
        `${arquivo}: limpar a fila offline no logout/troca de empresa DESTRÓI o ` +
          "trabalho de quem capturou sem sinal. O isolamento é por dono, não por expurgo.",
      ).not.toMatch(/purgeQueue|clearQueue|purgeOrphans|offline-queue|pesagem-queue/);
    }
  });

  it("órfão não é atribuído a quem está logado", () => {
    // Descartar é a perda; atribuir ao usuário atual é o bug original na
    // direção contrária. A única saída honesta é exportar e deixar uma pessoa
    // decidir — por isso "Descartar" só aparece depois do download.
    const fonte = ler(MODO_CURRAL);
    expect(fonte).toMatch(/orfaosExportados/);
    expect(fonte).toMatch(/exportarOrfaos/);
  });
});
