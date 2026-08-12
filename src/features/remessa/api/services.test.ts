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
    // A regra em si vive em @/lib/upload-guard (era duplicada e divergente);
    // o que importa aqui é que o SERVIÇO a chame, não a tela.
    const upload = FONTE.slice(FONTE.indexOf("export async function uploadRemessaPhoto"));
    expect(upload).toMatch(/assertImagemValida\(input\.file\)/);
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

  it("editar a legenda NÃO apaga a miniatura", () => {
    // `updateFieldRecord` substitui o jsonb inteiro, não faz merge. Remontar o
    // payload sem `thumb_path` fazia a miniatura virar lixo permanente no
    // bucket (o delete só remove o que está em thumbPath, agora vazio) e a
    // galeria voltar a servir o original de 8 MB. Trocar uma legenda desfazia,
    // em silêncio, a otimização que o teste acima protege.
    const legenda = FONTE.slice(FONTE.indexOf("updateRemessaPhotoLegenda"));
    expect(legenda.slice(0, 700)).toMatch(/thumb_path: photo\.thumbPath/);
  });

  it("o modo DEMO é barrado ANTES de o arquivo subir", () => {
    // O upload ia para o Storage real e só então o insert lançava — o arquivo
    // ficava lá. As telas bloqueiam antes, mas proteção só na UI é justamente o
    // que o teste de validação acima diz não bastar.
    const upload = FONTE.slice(
      FONTE.indexOf("export async function uploadRemessaPhoto"),
      FONTE.indexOf("storage.from(BUCKET).upload"),
    );
    expect(upload).toMatch(/assertNotDemo\(\)/);
  });

  it("falha no registro remove o arquivo que já subiu", () => {
    // Sem compensar, o arquivo fica no bucket sem NENHUMA linha apontando para
    // ele: invisível na interface e impossível de remover.
    const upload = FONTE.slice(
      FONTE.indexOf("export async function uploadRemessaPhoto"),
      FONTE.indexOf("export async function getRemessaPhotoUrl"),
    );
    expect(upload).toMatch(/catch \(erro\)/);
    expect(upload).toMatch(/\.remove\(\[base, thumbPath\]/);
  });

  it("apagar a carga leva as fotos junto", () => {
    // As fotos não têm FK para a carga (o vínculo é `payload.ref_id` no jsonb),
    // então o banco não cascateia: o arquivo ficava no bucket para sempre e a
    // linha virava fantasma na galeria geral, apontando para carga inexistente.
    expect(FONTE).toMatch(/export async function deleteRemessaComFotos/);
    const cascade = FONTE.slice(FONTE.indexOf("export async function deleteRemessaComFotos"));
    expect(cascade).toMatch(/deleteRemessaPhoto/);
    expect(cascade).toMatch(/deleteOperationRecord/);
  });

  it("a regra de upload vive num lugar só", () => {
    // Havia duas cópias divergentes: a Remessa validava no serviço, o RDC só na
    // tela, e as duas sanitizavam o nome com regex diferentes.
    const rdc = readFileSync("src/features/rdc/api/services.ts", "utf8");
    for (const fonte of [FONTE, rdc]) {
      expect(fonte).toMatch(/assertImagemValida/);
      expect(fonte).toMatch(/nomeSeguroDeArquivo/);
    }
  });

  it("falha ao assinar vira tile 'não carregou', não sumiço", () => {
    // Sumir do grid faria o usuário achar que a foto nunca foi anexada.
    expect(GALERIA).toMatch(/catch\(\(\) => ""\)/);
  });
});
