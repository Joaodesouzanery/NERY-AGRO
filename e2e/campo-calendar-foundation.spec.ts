import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("nery-demo-mode", "true"));
});

test.describe("Campo Calendar foundation", () => {
  test.describe.configure({ mode: "serial" });

  test("opens the calendar route in demo mode", async ({ page }) => {
    const response = await page.goto("/campo/calendario");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Calendário de Campo" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Fazenda Santa Helena")).toBeVisible();
    await expect(page.getByText("Rio Verde/GO")).toBeVisible();
    await expect(page.getByText("2025/2026").first()).toBeVisible();
    await expect(page.getByRole("main").getByText("DEMO", { exact: true })).toBeVisible();
  });

  test("navigates from Campo to the dedicated calendar", async ({ page }) => {
    await page.goto("/campo");
    await page.getByRole("link", { name: "Calendário" }).first().click();
    await expect(page).toHaveURL(/\/campo\/calendario/);
    await expect(page.getByRole("heading", { name: "Calendário de Campo" })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("link", { name: "Voltar para Campo" }).click();
    await expect(page).toHaveURL(/\/campo$/);
  });

  test("preserves the selected tab and filters on refresh", async ({ page }) => {
    await page.goto(
      "/campo/calendario?tab=tasks&view=agenda&date=2026-03-25&fieldId=talhao-demo-01&seasonId=2025%2F2026&status=Planejada&responsible=Marcos%20Lima&eventType=Plantio&priority=Alta",
    );
    await expect(page.getByRole("button", { name: "Tarefas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByLabel("Filtro Talhão")).toHaveValue("talhao-demo-01");
    await expect(page.getByLabel("Filtro Status")).toHaveValue("Planejada");
    await page.reload();
    await expect(page).toHaveURL(/tab=tasks/);
    await expect(page.getByLabel("Filtro Responsável")).toHaveValue("Marcos Lima");
    await expect(page.getByLabel("Filtro Tipo")).toHaveValue("Plantio");
    await expect(page.getByLabel("Filtro Prioridade")).toHaveValue("Alta");
  });

  test("filters the overview, clears context and opens Talhão 360", async ({ page }) => {
    await page.goto("/campo/calendario?date=2026-06-23");
    await expect(page.getByText("Tarefas de hoje").locator("..").getByText("1", { exact: true })).toBeVisible();
    await expect(page.getByText("Compras pendentes").locator("..").getByText("3", { exact: true })).toBeVisible();
    await expect(page.getByText("R$ 92.500,00", { exact: true })).toBeVisible();

    await page.getByLabel("Filtro Talhão").selectOption("talhao-demo-03");
    await expect(page).toHaveURL(/fieldId=talhao-demo-03/);
    await page.reload();
    await expect(page.getByLabel("Filtro Talhão")).toHaveValue("talhao-demo-03");

    await page.getByRole("link", { name: /Abrir Talhão 360/ }).click();
    await expect(page).toHaveURL(/\/campo\/talhoes\/talhao-demo-03/);

    await page.goto("/campo/calendario?date=2026-06-23&fieldId=talhao-demo-03&status=Planejada");
    await page.getByRole("button", { name: "Limpar filtros" }).click();
    await expect(page).not.toHaveURL(/fieldId=/);
    await expect(page.getByText("Toda a fazenda ativa")).toBeVisible();
  });

  test("runs the complete task CRUD flow in demo mode", async ({ page }) => {
    await page.goto("/campo/calendario?tab=tasks&date=2026-06-23");
    await page.getByRole("button", { name: "Nova tarefa" }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Título").fill("Teste CRUD calendário");
    await dialog.getByLabel("Descrição").fill("Fluxo automatizado");
    await dialog.getByLabel("Tipo").fill("Vistoria");
    await dialog.getByLabel("Início").fill("2026-06-24");
    await dialog.getByLabel("Talhão").selectOption("talhao-demo-03");
    await dialog.getByLabel("Ciclo").selectOption("cycle-soja-2025");
    await dialog.getByLabel("Custo estimado").fill("1250");
    await dialog.getByRole("button", { name: "Salvar tarefa" }).click();
    await expect(page.getByText("Tarefa criada.")).toBeVisible();

    let row = page
      .getByRole("row")
      .filter({ has: page.getByText("Teste CRUD calendário", { exact: true }) });
    await expect(row).toBeVisible();
    await expect(row.getByRole("combobox", { name: /Responsável de/ })).toHaveValue("");

    await row.getByRole("button", { name: /Ações de Teste CRUD calendário/ }).click();
    await page.getByRole("menuitem", { name: "Editar" }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Título").fill("Teste CRUD calendário editado");
    await dialog.getByRole("button", { name: "Salvar tarefa" }).click();
    await expect(page.getByText("Tarefa atualizada.")).toBeVisible();

    row = page
      .getByRole("row")
      .filter({ has: page.getByText("Teste CRUD calendário editado", { exact: true }) });
    await row.getByRole("button", { name: /Ações de Teste CRUD calendário editado/ }).click();
    await page.getByRole("menuitem", { name: "Duplicar" }).click();
    await expect(page.getByText("Tarefa duplicada.")).toBeVisible();
    const copyRow = page
      .getByRole("row")
      .filter({ has: page.getByText("Teste CRUD calendário editado (cópia)", { exact: true }) });
    await expect(copyRow).toBeVisible();

    await row
      .getByRole("button", { name: "Ações de Teste CRUD calendário editado", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Concluir" }).click();
    await expect(row.getByRole("combobox", { name: /Status de/ })).toHaveValue("completed");

    await row
      .getByRole("button", { name: "Ações de Teste CRUD calendário editado", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Reabrir" }).click();
    await expect(row.getByRole("combobox", { name: /Status de/ })).toHaveValue("pending");

    await copyRow
      .getByRole("button", { name: /Ações de Teste CRUD calendário editado \(cópia\)/ })
      .click();
    await page.getByRole("menuitem", { name: "Excluir" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Excluir", exact: true }).click();
    await expect(page.getByText("Tarefa excluída.")).toBeVisible();
    await expect(copyRow).toHaveCount(0);
  });

  test("navigates month, week and agenda while preserving the reference date", async ({
    page,
  }) => {
    await page.goto("/campo/calendario?tab=calendar&view=month&date=2026-06-23");
    await expect(page.getByRole("button", { name: "Mês" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByText("junho de 2026", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Próximo período" }).click();
    await expect(page).toHaveURL(/date=2026-07-23/);
    await page.getByRole("button", { name: "Período anterior" }).click();
    await expect(page).toHaveURL(/date=2026-06-23/);

    await page.getByRole("button", { name: "Semana" }).click();
    await expect(page).toHaveURL(/view=week/);
    await expect(page.getByRole("button", { name: "Semana" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: "Agenda" }).click();
    await expect(page).toHaveURL(/view=agenda/);
    await expect(page.getByText("Previsão climática").first()).toBeVisible();
  });

  test("renders multi-day events and opens event editing", async ({ page }) => {
    await page.goto("/campo/calendario?tab=calendar&view=agenda&date=2026-06-23");
    const harvest = page.getByRole("button", {
      name: "Abrir evento Colheita prevista do Talhão 03",
    });
    await expect(harvest.first()).toBeVisible();
    await expect(harvest.first().getByText("Múltiplos dias")).toBeVisible();
    await harvest.first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Editar tarefa" })).toBeVisible();
    await expect(dialog.getByLabel("Título")).toHaveValue(
      "Colheita prevista do Talhão 03",
    );
  });

  test("starts a new event with the selected calendar date", async ({ page }) => {
    await page.goto("/campo/calendario?tab=calendar&view=month&date=2026-06-23");
    await page
      .getByRole("button", { name: "Adicionar evento em 28/06/2026" })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Nova tarefa" })).toBeVisible();
    await expect(dialog.getByLabel("Início")).toHaveValue("2026-06-28");
  });

  test("keeps global filters active in calendar views", async ({ page }) => {
    await page.goto("/campo/calendario?tab=calendar&view=agenda&date=2026-06-23");
    await page.getByLabel("Filtro Talhão").selectOption("talhao-demo-03");
    await expect(page).toHaveURL(/fieldId=talhao-demo-03/);
    await expect(
      page.getByRole("button", { name: "Abrir evento Colheita prevista do Talhão 03" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Abrir evento Contratar serviço de aplicação" }),
    ).toHaveCount(0);
  });

  for (const route of [
    "/",
    "/torre-de-controle",
    "/logistica",
    "/financeiro",
    "/campo",
    "/campo/talhoes",
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
