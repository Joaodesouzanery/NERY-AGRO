import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// O fluxo de foto do romaneio não tinha NENHUM teste — e é o que prova a carga
// quando o romaneio de papel é o único registro. Testar upload de verdade
// exigiria subir Storage; o que dá para travar por leitura de fonte são as
// decisões que, desfeitas, quebram o fluxo em silêncio.

const FONTE = readFileSync("src/features/remessa/api/services.ts", "utf8");
const GALERIA = readFileSync("src/features/remessa/components/remessa-photo-gallery.tsx", "utf8");

describe("foto da remessa — isolamento por empresa", () => {
  it("o caminho começa pelo org_id", () => {
    // O 1º segmento do path é o que a policy do Storage valida
    // (`(storage.foldername(name))[1] = current_org_id()`). Mudar a ordem aqui
    // faz o upload de uma empresa cair na pasta de outra — ou simplesmente ser
    // recusado, o que é melhor, mas nenhum dos dois é aceitável.
    expect(FONTE).toMatch(/\$\{input\.orgId\}\/remessa\//);
  });

  it("valida tipo e tamanho no SERVIÇO, não só na UI", () => {
    // `accept="image/*"` no input é dica visual; qualquer chamador novo
    // nasceria sem proteção se a validação vivesse só na tela.
    const upload = FONTE.slice(FONTE.indexOf("export async function uploadRemessaPhoto"));
    expect(upload).toMatch(/startsWith\("image\//);
    expect(upload).toMatch(/MAX_PHOTO_BYTES/);
  });
});

describe("foto da remessa — desempenho e ligação com a carga", () => {
  it("filtra por carga NO SERVIDOR", () => {
    // Antes, abrir a ficha de uma remessa baixava a lista de fotos da empresa
    // inteira e filtrava no cliente.
    const lista = FONTE.slice(FONTE.indexOf("export async function listRemessaPhotos"));
    expect(lista).toMatch(/payloadEq/);
    expect(lista).toMatch(/chave: "ref_id"/);
  });

  it("grava a miniatura e a galeria prefere ela", () => {
    // O tile tem ~150px e recebia o original de até 8 MB.
    expect(FONTE).toMatch(/compressImage\(input\.file, \{ maxDim: 320/);
    expect(FONTE).toMatch(/thumb_path/);
    expect(GALERIA).toMatch(/p\.thumbUrl \|\| p\.url/);
  });

  it("apagar a foto leva a miniatura junto", () => {
    // Senão o thumb fica órfão no bucket, invisível e sem quem o remova.
    const del = FONTE.slice(FONTE.indexOf("export async function deleteRemessaPhoto"));
    expect(del).toMatch(/thumbPath/);
  });

  it("falha ao assinar vira tile 'não carregou', não sumiço", () => {
    // Sumir do grid faria o usuário achar que a foto nunca foi anexada.
    expect(GALERIA).toMatch(/catch\(\(\) => ""\)/);
  });
});
