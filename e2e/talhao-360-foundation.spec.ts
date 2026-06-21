import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("nery-demo-mode", "true"));
});

test.describe("Talhão 360 MVP", () => {
  test("opens Talhões from Campo and lists the shared demo records", async ({ page }) => {
    await page.goto("/campo");
    await page.getByRole("link", { name: "Abrir Talhões" }).click();
    await expect(page).toHaveURL(/\/campo\/talhoes/);
    await expect(page.getByRole("heading", { name: "Talhões" })).toBeVisible();
    await expect(page.getByText("Talhão 03").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Abrir Talhão 360°" }).first()).toBeVisible();
  });

  test("preserves field, season and selected tab on refresh", async ({ page }) => {
    await page.goto(
      "/campo/talhoes/talhao-demo-03?tab=cycles&seasonId=2025%2F2026&cycleId=cycle-soja-2025",
    );
    await expect(page.getByRole("heading", { name: "Talhão 03" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Safras e Ciclos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.reload();
    await expect(page).toHaveURL(/tab=cycles/);
    await expect(page.getByRole("heading", { name: "Safra 2025/2026" })).toBeVisible();
  });

  test("navigates through all seven tabs", async ({ page }) => {
    await page.goto("/campo/talhoes/talhao-demo-03?tab=overview");
    const tabs = page.getByRole("navigation", { name: "Abas do Talhão 360°" });
    for (const name of [
      "Visão Geral",
      "Cadastro",
      "Safras e Ciclos",
      "Mapa",
      "Timeline",
      "Alertas",
      "Relatórios",
    ]) {
      const tab = tabs.getByRole("button", { name, exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-current", "page");
    }
  });

  test("renders the map editor and report preview on mobile", async ({ page }) => {
    await page.goto("/campo/talhoes/talhao-demo-03?tab=map");
    await expect(page.getByRole("button", { name: "Exportar GeoJSON" })).toBeVisible();
    await page.getByRole("button", { name: "Relatórios" }).click();
    await page.getByRole("button", { name: "Gerar prévia" }).click();
    await expect(page.getByText("Relatório Geral do Talhão")).toBeVisible();
  });

  for (const route of [
    "/",
    "/torre-de-controle",
    "/logistica",
    "/financeiro",
    "/campo",
    "/pecuaria",
    "/sustentabilidade",
    "/inteligencia",
    "/otimizacao-cogs",
  ]) {
    test(`keeps existing route ${route} available`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
    });
  }
});
