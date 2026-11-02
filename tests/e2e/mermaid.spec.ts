import { expect, test, type Page } from "@playwright/test";
import {
  editorBody,
  insertFromSlashMenu,
  newPage,
  openNewSpace,
  publishSpace,
  save,
} from "./helpers.ts";

const FLOWCHART = "flowchart LR\n  Write --> Publish";
const ELK_FLOWCHART = `---\nconfig:\n  layout: elk\n---\n${FLOWCHART}`;

function source(page: Page) {
  return page.getByRole("textbox", { name: "Mermaid source" });
}

function preview(page: Page) {
  return page.getByRole("figure", { name: "Diagram preview" });
}

async function insertDiagram(page: Page): Promise<void> {
  await insertFromSlashMenu(page, "mermaid", "Mermaid diagram");
  await expect(source(page)).toBeVisible();
}

test("the editor previews a diagram and shows mermaid errors inline", async ({
  page,
}) => {
  await openNewSpace(page);
  await newPage(page);
  await insertDiagram(page);
  await expect(preview(page).locator("svg")).toBeVisible();

  await source(page).fill(FLOWCHART);
  await expect(preview(page).locator("svg")).toContainText("Publish");

  await source(page).fill("flowchart LR\n  A --> ");
  await expect(preview(page).locator(".mermaid-block-error")).not.toBeEmpty();
  await expect(preview(page).locator("svg")).toHaveCount(0);

  await source(page).fill(ELK_FLOWCHART);
  await expect(preview(page).locator(".mermaid-block-error")).toContainText(
    "The ELK layout is not supported",
  );

  await source(page).fill(FLOWCHART);
  await expect(preview(page).locator("svg")).toContainText("Publish");
});

test("typing the mermaid fence starts a diagram, not a code block", async ({
  page,
}) => {
  await openNewSpace(page);
  await newPage(page);
  await editorBody(page).click();
  await page.keyboard.type("```mermaid ");
  await expect(source(page)).toBeVisible();
  await expect(editorBody(page)).not.toContainText("```");
  await expect(
    page.getByRole("textbox", { name: "Code", exact: true }),
  ).toHaveCount(0);
});

test("a published page renders the diagram as SVG over its source", async ({
  page,
}) => {
  const space = await openNewSpace(page);
  await newPage(page);
  await insertDiagram(page);
  await source(page).fill(FLOWCHART);
  await save(page);

  const url = await publishSpace(page, space);

  const response = await page.goto(url);
  expect(response?.status()).toBe(200);
  expect(await response?.text()).toContain(
    '<pre class="mermaid-source"><code class="language-mermaid">flowchart LR',
  );
  const island = page.locator('[data-island="mermaid.diagram"]');
  await expect(island.locator("figure.mermaid-svg svg")).toContainText(
    "Publish",
  );
  await expect(island.locator("pre.mermaid-source")).toHaveCount(0);
});
