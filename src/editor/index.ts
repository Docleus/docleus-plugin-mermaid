import {
  definePlugin,
  type EditorBlockDefinition,
  type EditorSlashItem,
} from "@docleus/sdk";
import {
  MERMAID_LANG,
  MERMAID_TYPE,
  MERMAID_VERSION,
  PLUGIN_NAME,
} from "../shared/index.ts";
import { MERMAID_EDITOR_CSS } from "./styles.ts";
import { DiagramView } from "./view.tsx";

export { DiagramView, PREVIEW_DELAY_MS } from "./view.tsx";

const EXAMPLE_SOURCE = "flowchart LR\n  A --> B";

export const DIAGRAM_BLOCK: EditorBlockDefinition = {
  // An atom: the source lives in attrs.source, so the view edits it.
  type: MERMAID_TYPE,
  version: MERMAID_VERSION,
  content: "atom",
  attrs: { source: "" },
  view: DiagramView,
  shortcuts: [{ pattern: new RegExp(`^\`\`\`${MERMAID_LANG}\\s$`) }],
};

export const DIAGRAM_SLASH_ITEM: EditorSlashItem = {
  id: MERMAID_TYPE,
  label: "Mermaid diagram",
  keywords: ["mermaid", "diagram", "chart", "flowchart"],
  run(editor) {
    editor.insertBlock(MERMAID_TYPE, { source: EXAMPLE_SOURCE });
  },
};

/**
 * Registers the diagram block, its slash menu item and its styles with the
 * editor. Everything is undone when the plugin unloads.
 */
export const plugin = definePlugin({
  name: PLUGIN_NAME,
  inject: ["editor"],
  apply(ctx) {
    ctx.editor.registerBlock(DIAGRAM_BLOCK);
    ctx.editor.registerSlashItem(DIAGRAM_SLASH_ITEM);
    ctx.effect(() => {
      const style = document.createElement("style");
      style.dataset.plugin = PLUGIN_NAME;
      style.textContent = MERMAID_EDITOR_CSS;
      document.head.append(style);
      return () => style.remove();
    }, "mermaid editor styles");
  },
});
