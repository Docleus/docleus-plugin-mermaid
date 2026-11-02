import { readFileSync } from "node:fs";
import {
  ISLAND_SCRIPT_ID,
  parseManifest,
  type BlockNode,
  type Entry,
  type IslandManifest,
  type SitePage,
} from "@docleus/sdk";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MERMAID_TYPE } from "../src/shared/index.ts";
import { loadPlugin, type Instance } from "./instance.ts";

const SOURCE = "flowchart LR\n  A --> B";

function sitePage(body: BlockNode): SitePage {
  const entry: Entry = {
    id: "e1",
    type: "page",
    title: "Diagrams",
    parent: undefined,
    order: 0,
    fields: {},
    body,
  };
  return {
    kind: "page",
    site: { id: "s1", name: "Site", settings: undefined },
    space: { id: "sp1", orgId: "o1", slug: "docs", name: "Docs" },
    revision: "r1",
    entry,
    path: "/",
    title: entry.title,
    nav: [],
    prev: undefined,
    next: undefined,
    url: (path) => `.${path}`,
    asset: (plugin, file) => `./_assets/plugins/${plugin}/${file}`,
  };
}

function islandManifest(html: string): IslandManifest | undefined {
  const match = new RegExp(
    `<script type="application/json" id="${ISLAND_SCRIPT_ID}">(.*?)</script>`,
  ).exec(html);
  return match?.[1] === undefined
    ? undefined
    : (JSON.parse(match[1]) as IslandManifest);
}

const manifest = parseManifest(
  JSON.parse(
    readFileSync(new URL("../docleus.plugin.json", import.meta.url), "utf8"),
  ),
);
const ISLAND_URL = `./_assets/plugins/docleus-plugin-mermaid@${manifest.version}/diagram.js`;

describe("published pages", () => {
  let instance: Instance;

  beforeEach(async () => {
    instance = await loadPlugin();
  });

  afterEach(async () => {
    await instance.dispose();
  });

  it("render a Markdown diagram as an island with its source as the fallback", () => {
    const { body } = instance.root.markdown.parse(
      `Intro\n\n\`\`\`mermaid\n${SOURCE}\n\`\`\`\n`,
    );
    const diagram = body.content?.[1];
    expect(diagram?.type).toBe(MERMAID_TYPE);
    const { html, islands } = instance.root.render.renderPage(sitePage(body), {
      islandUrl: (type) => (type === MERMAID_TYPE ? ISLAND_URL : undefined),
    });
    expect(html).toContain(
      `data-island="mermaid.diagram" data-block="${diagram?.id ?? ""}"><pre class="mermaid-source"><code class="language-mermaid">flowchart LR\n  A --&gt; B</code></pre></div>`,
    );
    expect(islands.map((island) => island.type)).toEqual([MERMAID_TYPE]);
    expect(islandManifest(html)).toEqual({
      modules: { [MERMAID_TYPE]: ISLAND_URL },
      props: { [diagram?.id ?? ""]: { source: SOURCE } },
    });
  });

  it("export diagrams as mermaid fences", () => {
    const { body } = instance.root.markdown.parse(
      `\`\`\`mermaid\n${SOURCE}\n\`\`\`\n`,
    );
    expect(instance.root.markdown.serialize({ body })).toBe(
      `\`\`\`mermaid\n${SOURCE}\n\`\`\`\n`,
    );
  });

  it("render diagrams as placeholders once the plugin unloads", async () => {
    const body: BlockNode = {
      id: "doc",
      type: "doc",
      v: 1,
      attrs: {},
      content: [
        { id: "d1", type: MERMAID_TYPE, v: 1, attrs: { source: SOURCE } },
      ],
    };
    await instance.unloadPlugin();
    const { html, islands } = instance.root.render.renderPage(sitePage(body));
    expect(html).toContain('<div data-unknown-block="mermaid.diagram"></div>');
    expect(islands).toEqual([]);
  });
});
