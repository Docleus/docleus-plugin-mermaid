import type { BlockNode, MarkdownCodec } from "@docleus/sdk";
import {
  MERMAID_LANG,
  MERMAID_SYNTAX,
  MERMAID_TYPE,
  MERMAID_VERSION,
  PLUGIN_NAME,
  parseMermaidAttrs,
} from "./diagram.ts";

/**
 * Reads fenced code with the `mermaid` info string as a diagram block and
 * writes a diagram back as such a fence. Other fences are left to the codec
 * that owns `code`, and so is a `mermaid` fence with a meta string after the
 * info string, which a diagram has no attr to keep.
 */
export function createMermaidCodec(): MarkdownCodec {
  return {
    name: PLUGIN_NAME,
    claims: [MERMAID_SYNTAX],
    blockTypes: [MERMAID_TYPE],
    toBlock(node, context): BlockNode | undefined {
      if (node.type !== "code" || node.lang !== MERMAID_LANG || node.meta) {
        return undefined;
      }
      return {
        id: context.newId(),
        type: MERMAID_TYPE,
        v: MERMAID_VERSION,
        attrs: { source: node.value },
      };
    },
    fromBlock(block) {
      return {
        type: "code",
        lang: MERMAID_LANG,
        meta: null,
        value: parseMermaidAttrs(block.attrs).source,
      };
    },
  };
}
