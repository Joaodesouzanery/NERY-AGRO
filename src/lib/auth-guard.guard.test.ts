import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Teste-guarda da porta de entrada do app.
//
// Entrar exige DUAS coisas: sessão válida E vínculo com uma empresa.
//
// Só a sessão não bastava. `handle_new_user` (supabase/schema.sql) só cria o
// vínculo em `organization_members` quando existe convite casando pelo e-mail;
// quem se cadastra sem convite fica órfão. A RLS faz o seu papel — todas as
// policies comparam `org_id = current_org_id()`, que devolve NULL, então a
// pessoa não vê dado nenhum. Mas ela entrava no produto inteiro: sidebar,
// menus, todas as telas, vazias e sem explicação.
//
// A RLS protege o DADO. Esta guarda protege a PORTA. As duas precisam existir.

const ler = (caminho: string) => readFileSync(caminho, "utf8");

describe("guarda: entrar exige sessão E empresa", () => {
  it("RequireAuth checa o vínculo com a empresa, não só a sessão", () => {
    const root = ler("src/routes/__root.tsx");
    const corpo = root.slice(root.indexOf("function RequireAuth"));
    expect(corpo).toMatch(/orgId/);
    expect(
      corpo,
      "RequireAuth precisa barrar quem não tem empresa (ou não é platform admin) — " +
        "senão conta sem convite entra no shell do app.",
    ).toMatch(/!orgId\s*&&\s*!isPlatformAdmin/);
  });

  it("a checagem acontece no RENDER, não só num efeito", () => {
    // Efeito roda DEPOIS do paint: se a barreira fosse só o `useEffect` do
    // redirect, o conteúdo protegido pintaria por um frame antes de sumir.
    const root = ler("src/routes/__root.tsx");
    const corpo = root.slice(root.indexOf("function RequireAuth"));
    expect(corpo).toMatch(/if\s*\(loading\s*\|\|\s*!session/);
  });

  it("espera o vínculo resolver antes de decidir", () => {
    // Sem `orgLoading`, a tela de "conta sem empresa" pisca em TODO login: a
    // sessão vem do localStorage (rápido) e a empresa vem de uma consulta.
    const root = ler("src/routes/__root.tsx");
    expect(root.slice(root.indexOf("function RequireAuth"))).toMatch(/orgLoading/);
    expect(ler("src/components/auth-provider.tsx")).toMatch(/setOrgLoading\(false\)/);
  });

  it("o provider não trava em Carregando se a sessão falhar", () => {
    // `getSession()` sem `.catch` deixava `loading` em true para sempre.
    const provider = ler("src/components/auth-provider.tsx");
    const trecho = provider.slice(provider.indexOf("getSession()"));
    expect(trecho.slice(0, 600)).toMatch(/\.catch\(/);
  });

  it("toda rota nova é protegida por padrão", () => {
    // PUBLIC_PATHS é allowlist: rota que não estiver nela cai no RequireAuth.
    // Este teste existe para que ABRIR uma rota seja uma decisão consciente —
    // acrescentar aqui obriga a justificar.
    // /redefinir-senha saiu: não há recuperação por e-mail (quem administra
    // cadastra a senha no painel), e a rota era pública sem nenhuma tela levando
    // a ela.
    const PUBLICAS_ESPERADAS = ["/", "/login"];
    const root = ler("src/routes/__root.tsx");
    const lista = root.match(/const PUBLIC_PATHS = new Set\(\[([^\]]*)\]\)/)?.[1] ?? "";
    const encontradas = [...lista.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(
      encontradas.sort(),
      "PUBLIC_PATHS mudou. Rota pública é rota SEM login: confirme que é isso mesmo " +
        "e atualize a lista deste teste.",
    ).toEqual(PUBLICAS_ESPERADAS.sort());
  });

  it("existem rotas protegidas de verdade (o teste não passa por engano)", () => {
    const rotas = readdirSync("src/routes").filter((f) => /\.tsx$/.test(f));
    expect(rotas.length).toBeGreaterThan(10);
  });

  it("a tela de conta sem empresa oferece saída, e não redireciona para o login", () => {
    // Redirecionar para /login criaria laço: quem chega ali TEM sessão, e o
    // login manda de volta para dentro assim que detecta sessão.
    const tela = ler("src/components/sem-empresa.tsx");
    expect(tela).toMatch(/signOut/);
    expect(tela).not.toMatch(/navigate\(\{\s*to:\s*"\/login"/);
  });

  it("o login não joga o usuário para dentro em silêncio", () => {
    // Era a causa do "cliquei em Acessar plataforma e entrei sem autenticar":
    // sessão salva + redirect automático. Agora a tela diz que há sessão e
    // oferece trocar de conta.
    const login = ler("src/routes/login.tsx");
    expect(login).not.toMatch(/if\s*\(!loading\s*&&\s*session\)\s*void navigate/);
    expect(login).toMatch(/já está conectado/i);
  });
});
