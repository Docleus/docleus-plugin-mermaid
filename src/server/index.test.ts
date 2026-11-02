import type { BlockNode, RenderContext } from "@docleus/sdk";
import { describe, expect, it } from "vitest";
import { MERMAID_TYPE } from "../shared/index.ts";
import { renderDiagram } from "./index.ts";

const context: RenderContext = {
  children: () => ({ html: "", islands: [] }),
  anchor: (text) => text,
};

const diagram = (attrs: Record<string, unknown>, id = "b1"): BlockNode => ({
  id,
  type: MERMAID_TYPE,
  v: 1,
  attrs,
});

describe("renderDiagram", () => {
  it("renders the source as the fallback inside an island element", () => {
    const source = "flowchart LR\n  A --> B";
    expect(renderDiagram(diagram({ source }), context)).toEqual({
      html: '<div class="mermaid-diagram" data-island="mermaid.diagram" data-block="b1"><pre class="mermaid-source"><code class="language-mermaid">flowchart LR\n  A --&gt; B</code></pre></div>',
      islands: [{ blockId: "b1", type: MERMAID_TYPE, props: { source } }],
    });
  });

  it("matches the render snapshot", () => {
    const source = 'sequenceDiagram\n  Alice->>Bob: Hi <there> & "you"';
    expect(renderDiagram(diagram({ source }), context).html).toMatchSnapshot();
  });

  it.each([{}, { source: 1 }, { source: null }])(
    "renders an empty source for attrs %j",
    (attrs) => {
      const result = renderDiagram(diagram(attrs), context);
      expect(result.html).toContain('<code class="language-mermaid"></code>');
      expect(result.islands).toEqual([
        { blockId: "b1", type: MERMAID_TYPE, props: { source: "" } },
      ]);
    },
  );

  it("escapes the source and the block id", () => {
    const result = renderDiagram(
      diagram({ source: "</code><script>x</script>" }, '"><script>'),
      context,
    );
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain(
      "&lt;/code&gt;&lt;script&gt;x&lt;/script&gt;",
    );
    expect(result.html).toContain('data-block="&quot;&gt;&lt;script&gt;"');
  });
});
