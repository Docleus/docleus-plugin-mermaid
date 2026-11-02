import { definePlugin, escapeHtml, type BlockRenderer } from "@docleus/sdk";
import {
  MERMAID_LANG,
  MERMAID_TYPE,
  MERMAID_VERSION,
  PLUGIN_NAME,
  createMermaidCodec,
  parseMermaidAttrs,
} from "../shared/index.ts";

/**
 * Renders a diagram as its escaped source inside its island element, the
 * fallback without JavaScript. The site runtime mounts `dist/site/diagram.js`
 * on it, which replaces the source with the rendered SVG.
 */
export const renderDiagram: BlockRenderer = (node) => {
  const { source } = parseMermaidAttrs(node.attrs);
  return {
    html: `<div class="mermaid-diagram" data-island="${escapeHtml(node.type)}" data-block="${escapeHtml(node.id)}"><pre class="mermaid-source"><code class="language-${MERMAID_LANG}">${escapeHtml(source)}</code></pre></div>`,
    islands: [{ blockId: node.id, type: node.type, props: { source } }],
  };
};

/**
 * Registers the diagram block type, its Markdown codec and its renderer.
 * Everything registered through `ctx` is undone when the plugin unloads.
 */
export const plugin = definePlugin({
  name: PLUGIN_NAME,
  inject: ["blocks", "markdown", "render"],
  apply(ctx) {
    ctx.blocks.register(MERMAID_TYPE, { version: MERMAID_VERSION });
    ctx.markdown.register(createMermaidCodec());
    ctx.render.registerBlock(MERMAID_TYPE, renderDiagram);
  },
});
