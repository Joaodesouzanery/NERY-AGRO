// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AuthContext, type AuthContextValue } from "@/lib/auth-context";
import { OrgSwitcherBar } from "@/components/org-switcher-bar";

// Regressão: a barra "Administrador global" só pode aparecer para super-admin.
function renderWith(partial: Partial<AuthContextValue>) {
  const value: AuthContextValue = {
    user: null,
    session: null,
    orgId: null,
    role: null,
    isPlatformAdmin: false,
    orgs: [],
    loading: false,
    setActiveOrg: async () => {},
    signOut: async () => {},
    ...partial,
  };
  return render(
    <AuthContext.Provider value={value}>
      <OrgSwitcherBar />
    </AuthContext.Provider>,
  );
}

afterEach(cleanup);

describe("OrgSwitcherBar — restrita ao admin global", () => {
  it("NÃO renderiza nada para cliente (não-admin)", () => {
    const { container } = renderWith({ isPlatformAdmin: false });
    expect(container.innerHTML).toBe("");
    expect(screen.queryByText("Administrador global")).toBeNull();
  });

  it("renderiza para admin global, com o seletor de empresas", () => {
    renderWith({
      isPlatformAdmin: true,
      orgs: [{ id: "o1", nome: "Empresa X" }],
      orgId: "o1",
    });
    expect(screen.queryByText("Administrador global")).not.toBeNull();
    expect(screen.queryByText("Empresa X")).not.toBeNull();
  });
});
