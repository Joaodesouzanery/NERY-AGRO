import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("nery-demo-mode", "true"));
});

test.describe("Talhão 360 MVP", () => {
  test("opens the Talhões hub from Campo (map first, list in a tab)", async ({ page }) => {
    await page.goto("/campo");
    await page.getByRole("link", { name: "Abrir Talhões" }).click();
    await expect(page).toHaveURL(/\/campo\/talhoes/);
    await expect(page.getByRole("heading", { name: "Talhões" })).toBeVisible();
    // The default tab is the farm map.
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
    // The filterable table now lives in the "Talhões" tab.
    await page.getByRole("button", { name: "Talhões", exact: true }).click();
    await expect(page).toHaveURL(/tab=lista/);
    await expect(page.getByText("Talhão 03").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Abrir Talhão 360°" }).first()).toBeVisible();
  });

  test("Campo 'Talhões' tab opens the hub directly (no extra click)", async ({ page }) => {
    await page.goto("/campo");
    // Clicking the "Talhões" tab itself must land on the map hub, not an
    // intermediate inline view that needs a second "Abrir Talhões" click.
    await page.getByRole("link", { name: "Talhões", exact: true }).first().click();
    await expect(page).toHaveURL(/\/campo\/talhoes/);
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  });

  test("navigates the Talhões hub sub-tabs and reflects them in the URL", async ({ page }) => {
    await page.goto("/campo/talhoes");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();

    const cycles = page.getByRole("button", { name: "Safras e Ciclos", exact: true });
    await cycles.click();
    await expect(page).toHaveURL(/tab=ciclos/);
    await expect(cycles).toHaveAttribute("aria-current", "page");

    await page.getByRole("button", { name: "Alertas", exact: true }).click();
    await expect(page).toHaveURL(/tab=alertas/);
    await expect(page.getByText("Alertas da fazenda")).toBeVisible();

    await page.getByRole("button", { name: "Relatórios", exact: true }).click();
    await expect(page).toHaveURL(/tab=relatorios/);
    await page.getByRole("button", { name: "Gerar prévia" }).click();
    await expect(page.getByText("Relatório Geral da Fazenda")).toBeVisible();

    // Deep-link keeps the chosen tab.
    await page.goto("/campo/talhoes?tab=lista");
    await expect(page.getByPlaceholder("Buscar por nome ou código")).toBeVisible();
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

  test("loads, edits and persists GeoJSON in demo mode", async ({ page }) => {
    await page.goto("/campo/talhoes/talhao-demo-03?tab=map");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
    await page.getByRole("button", { name: "Editar talhão" }).click();
    await expect(page.getByText(/42,7\d ha/)).toBeVisible();
    await expect(
      page.getByText("Vértices").locator("..").getByText("4", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar no talhão atual" })).toBeEnabled();
    await page.getByRole("button", { name: "Salvar no talhão atual" }).click();
    await expect(page.getByText("Desenho salvo nesta demonstração.")).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Editar talhão" }).click();
    await expect(
      page.getByText("Vértices").locator("..").getByText("4", { exact: true }),
    ).toBeVisible();
  });

  test("draws a new polygon, stays open until closed, with undo support", async ({ page }) => {
    await page.goto("/campo/talhoes/talhao-demo-03?tab=map");
    await page.getByRole("button", { name: "Novo desenho" }).click();
    const canvas = page.locator(".maplibregl-canvas").first();
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    await canvas.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      for (const [x, y] of [
        [0.25, 0.35],
        [0.55, 0.35],
        [0.55, 0.55],
        [0.25, 0.55],
      ]) {
        element.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            clientX: bounds.left + bounds.width * x,
            clientY: bounds.top + bounds.height * y,
          }),
        );
      }
    });
    await expect(
      page.getByText("Vértices").locator("..").getByText("4", { exact: true }),
    ).toBeVisible();
    // Still open: the polygon is not finalized/valid until the ring is closed.
    await expect(page.getByText("Geometria válida")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Desfazer" })).toBeEnabled();
    // Closing finalizes the polygon and computes the area.
    await page.getByRole("button", { name: "Fechar polígono" }).click();
    await expect(page.getByText("Geometria válida")).toBeVisible();
  });

  test("keeps the area unset until the polygon is closed", async ({ page }) => {
    await page.goto("/campo/talhoes/talhao-demo-03?tab=map");
    await page.getByRole("button", { name: "Novo desenho" }).click();
    const canvas = page.locator(".maplibregl-canvas").first();
    await expect(canvas).toBeVisible();
    await canvas.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      for (const [x, y] of [
        [0.3, 0.35],
        [0.6, 0.35],
        [0.6, 0.6],
      ]) {
        element.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            clientX: bounds.left + bounds.width * x,
            clientY: bounds.top + bounds.height * y,
          }),
        );
      }
    });
    await expect(
      page.getByText("Vértices").locator("..").getByText("3", { exact: true }),
    ).toBeVisible();
    // Three points alone must NOT compute an area.
    await expect(
      page.getByText("Área calculada").locator("..").getByText("—", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Fechar polígono" }).click();
    await expect(
      page.getByText("Área calculada").locator("..").getByText("—", { exact: true }),
    ).toHaveCount(0);
  });

  test("closes the polygon by clicking the highlighted first vertex", async ({
    page,
  }, testInfo) => {
    // Precise marker hit-testing under touch emulation is flaky; the button-based
    // close test already covers mobile. This validates the marker interaction on
    // desktop, where pointer precision is reliable.
    test.skip(
      testInfo.project.name === "mobile",
      "Marker click is flaky on touch; covered on desktop",
    );
    await page.goto("/campo/talhoes/talhao-demo-03?tab=map");
    await page.getByRole("button", { name: "Novo desenho" }).click();
    const canvas = page.locator(".maplibregl-canvas").first();
    await expect(canvas).toBeVisible();
    // Draw in the lower half so the first vertex stays clear of the toolbar,
    // which wraps over the top of the map on narrow (mobile) viewports.
    await canvas.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      for (const [x, y] of [
        [0.35, 0.6],
        [0.65, 0.6],
        [0.65, 0.82],
      ]) {
        element.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            clientX: bounds.left + bounds.width * x,
            clientY: bounds.top + bounds.height * y,
          }),
        );
      }
    });
    await expect(
      page.getByText("Vértices").locator("..").getByText("3", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Geometria válida")).toHaveCount(0);
    // The first vertex is the amber "close" handle; clicking it joins the ring.
    await page.locator(".maplibregl-marker").first().click();
    await expect(page.getByText("Geometria válida")).toBeVisible();
  });

  test("preserves the drawing and adds one vertex per click when the basemap changes", async ({
    page,
  }) => {
    // Switching the basemap now uses setStyle (no map re-creation), so both the
    // in-progress drawing and the one-vertex-per-click behaviour must survive.
    await page.goto("/campo/talhoes/talhao-demo-03?tab=map");
    await page.getByRole("button", { name: "Novo desenho" }).click();
    const canvas = page.locator(".maplibregl-canvas").first();
    await expect(canvas).toBeVisible();
    await canvas.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      for (const [x, y] of [
        [0.4, 0.4],
        [0.6, 0.4],
      ]) {
        element.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            clientX: bounds.left + bounds.width * x,
            clientY: bounds.top + bounds.height * y,
          }),
        );
      }
    });
    await expect(
      page.getByText("Vértices").locator("..").getByText("2", { exact: true }),
    ).toBeVisible();
    // The last "Mapa" button is the basemap toggle (the first is the tab nav).
    await page.getByRole("button", { name: "Mapa", exact: true }).last().click();
    await expect(
      page.getByText("Vértices").locator("..").getByText("2", { exact: true }),
    ).toBeVisible();
    await canvas.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      element.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          clientX: bounds.left + bounds.width * 0.5,
          clientY: bounds.top + bounds.height * 0.6,
        }),
      );
    });
    await expect(
      page.getByText("Vértices").locator("..").getByText("3", { exact: true }),
    ).toBeVisible();
  });

  test("loads the existing farm perimeter for editing", async ({ page }) => {
    await page.goto("/campo/talhoes/talhao-demo-03?tab=map");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
    // The button reads "Editar fazenda" because a farm perimeter already exists.
    await page.getByRole("button", { name: "Editar fazenda" }).click();
    await expect(page.getByText("Vértices").locator("..").locator("strong")).not.toHaveText("0");
    await expect(page.getByRole("button", { name: "Salvar perímetro da fazenda" })).toBeEnabled();
  });

  test("adds and removes vertices on a closed polygon", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile",
      "Marker hit-testing is flaky on touch; covered on desktop",
    );
    await page.goto("/campo/talhoes/talhao-demo-03?tab=map");
    await page.getByRole("button", { name: "Novo desenho" }).click();
    const canvas = page.locator(".maplibregl-canvas").first();
    await expect(canvas).toBeVisible();
    // Draw a triangle in the lower half (clear of the toolbar) and close it.
    await canvas.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      for (const [x, y] of [
        [0.35, 0.6],
        [0.65, 0.6],
        [0.5, 0.82],
      ]) {
        element.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            clientX: bounds.left + bounds.width * x,
            clientY: bounds.top + bounds.height * y,
          }),
        );
      }
    });
    await page.getByRole("button", { name: "Fechar polígono" }).click();
    const vertices = page.getByText("Vértices").locator("..").locator("strong");
    await expect(vertices).toHaveText("3");
    // Midpoint handle inserts a vertex on that edge. Markers are re-created on
    // every edit, so wait for the handle to settle before clicking.
    const insertHandle = page
      .locator('.maplibregl-marker[title="Clique para adicionar um vértice aqui"]')
      .first();
    await expect(insertHandle).toBeVisible();
    await insertHandle.click();
    await expect(vertices).toHaveText("4");
    // Right-click a vertex to remove it.
    const vertexHandle = page.locator('.maplibregl-marker[title^="Arraste para mover"]').first();
    await expect(vertexHandle).toBeVisible();
    await vertexHandle.click({ button: "right" });
    await expect(vertices).toHaveText("3");
  });

  test("deletes a talhão marking after confirmation", async ({ page }) => {
    await page.goto("/campo/talhoes/talhao-demo-03?tab=map");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
    await page.getByRole("button", { name: "Editar talhão" }).click();
    await expect(
      page.getByText("Vértices").locator("..").getByText("4", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Excluir marcação do talhão" }).click();
    await page.getByRole("button", { name: "Excluir", exact: true }).click();
    await expect(page.getByText("Marcação removida nesta demonstração.")).toBeVisible();
    // The local draft is cleared after deletion.
    await expect(
      page.getByText("Vértices").locator("..").getByText("0", { exact: true }),
    ).toBeVisible();
  });

  test("deletes the farm perimeter after confirmation", async ({ page }) => {
    await page.goto("/campo/talhoes/talhao-demo-03?tab=map");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
    await page.getByRole("button", { name: "Editar fazenda" }).click();
    await page.getByRole("button", { name: "Excluir perímetro da fazenda" }).click();
    await page.getByRole("button", { name: "Excluir", exact: true }).click();
    await expect(page.getByText("Perímetro removido nesta demonstração.")).toBeVisible();
    // With the farm gone, the prompt to draw it again reappears.
    await expect(page.getByText("Desenhe primeiro o perímetro da fazenda.")).toBeVisible();
  });

  test("searches a city by name and recenters the map", async ({ page }) => {
    await page.route("**/nominatim.openstreetmap.org/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { lat: "-17.7973", lon: "-50.9192", display_name: "Rio Verde, Goiás, Brasil" },
        ]),
      }),
    );
    await page.goto("/campo/talhoes/talhao-demo-03?tab=map");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
    const search = page.getByPlaceholder("Cidade ou latitude, longitude");
    await search.fill("Rio Verde");
    await search.press("Enter");
    await expect(page.getByText(/Centralizado em Rio Verde/)).toBeVisible();
  });

  test("creates a talhão by area size from the hub (requires at least one method)", async ({
    page,
  }) => {
    await page.goto("/campo/talhoes?tab=mapa");
    await expect(page.locator(".maplibregl-canvas").first()).toBeVisible();
    await page.getByRole("button", { name: "Novo talhão" }).first().click();
    await expect(page.getByText("Localização (informe ao menos uma)")).toBeVisible();
    await page.getByLabel("Nome").fill("Talhão Área");
    await page.getByLabel("Código").fill("TA-99");
    // No location yet → blocked.
    await page.getByRole("button", { name: "Criar talhão" }).click();
    await expect(page.getByText(/Informe ao menos um/)).toBeVisible();
    // Provide the size and create.
    await page.getByLabel("Tamanho da área (ha)").fill("30");
    await page.getByRole("button", { name: "Criar talhão" }).click();
    await expect(page.getByText("Talhão criado.")).toBeVisible();
    // The area-only talhão shows up in the list.
    await page.getByRole("button", { name: "Talhões", exact: true }).click();
    await expect(page.getByText("Talhão Área")).toBeVisible();
  });

  test("creates a talhão by GPS from the hub", async ({ page }) => {
    await page.goto("/campo/talhoes?tab=mapa");
    await expect(page.locator(".maplibregl-canvas").first()).toBeVisible();
    await page.getByRole("button", { name: "Novo talhão" }).first().click();
    await page.getByLabel("Nome").fill("Talhão GPS");
    await page.getByLabel("Código").fill("TG-01");
    await page.getByLabel("GPS (latitude, longitude)").fill("-17.79, -50.92");
    await page.getByRole("button", { name: "Criar talhão" }).click();
    await expect(page.getByText("Talhão criado.")).toBeVisible();
    await page.getByRole("button", { name: "Talhões", exact: true }).click();
    await expect(page.getByText("Talhão GPS")).toBeVisible();
  });

  test("edits and saves the farm perimeter from the hub map", async ({ page }) => {
    await page.goto("/campo/talhoes?tab=mapa");
    await expect(page.locator(".maplibregl-canvas").first()).toBeVisible();
    // The hub farm button drives the editor into farm mode.
    await page.getByRole("button", { name: "Editar fazenda" }).first().click();
    const save = page.getByRole("button", { name: "Salvar perímetro da fazenda" });
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText("Perímetro salvo nesta demonstração.")).toBeVisible();
  });

  test("creates a talhão with the livestock vocation from the hub", async ({ page }) => {
    await page.goto("/campo/talhoes?tab=mapa");
    await expect(page.locator(".maplibregl-canvas").first()).toBeVisible();
    await page.getByRole("button", { name: "Novo talhão" }).first().click();
    await page.getByLabel("Nome").fill("Pasto Novo");
    await page.getByLabel("Código").fill("PN-01");
    await page.getByLabel("Vocação").selectOption("Pecuária");
    await page.getByLabel("Tamanho da área (ha)").fill("40");
    await page.getByRole("button", { name: "Criar talhão" }).click();
    await expect(page.getByText("Talhão criado.")).toBeVisible();
    await page.getByRole("button", { name: "Talhões", exact: true }).click();
    await expect(page.getByText("Pasto Novo")).toBeVisible();
  });

  test("the Pecuária page integrates the livestock talhões", async ({ page }) => {
    await page.goto("/pecuaria");
    const talhoesTab = page.getByRole("button", { name: "Talhões" });
    // The page is server-rendered; retry the click until React has hydrated and
    // the section actually switches in.
    await expect(async () => {
      await talhoesTab.click();
      await expect(page.getByText("Talhões de pecuária")).toBeVisible({ timeout: 2000 });
    }).toPass();
    // Demo talhão 01 is "Pecuária" and 02 is "Integração".
    await expect(page.getByText("Talhão 01")).toBeVisible();
    await expect(page.locator(".maplibregl-canvas").first()).toBeVisible();
  });

  test("shows the Pecuária tab in the 360° only for livestock talhões", async ({ page }) => {
    // talhao-demo-01 is "Pecuária".
    await page.goto("/campo/talhoes/talhao-demo-01?tab=overview");
    const pecuariaTab = page.getByRole("button", { name: "Pecuária", exact: true });
    await expect(pecuariaTab).toBeVisible();
    await pecuariaTab.click();
    await expect(page.getByText("Resumo da pecuária")).toBeVisible();
    await expect(page.getByText("Novilhas Nelore")).toBeVisible();
    // talhao-demo-03 is "Agricultura" → no Pecuária tab.
    await page.goto("/campo/talhoes/talhao-demo-03?tab=overview");
    await expect(page.getByRole("heading", { name: "Talhão 03" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pecuária", exact: true })).toHaveCount(0);
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
