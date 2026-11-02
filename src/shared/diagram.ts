import { z } from "@docleus/sdk";

export const PLUGIN_NAME = "@docleus/plugin-mermaid";

/** A Mermaid diagram; `attrs.source` holds the diagram text. */
export const MERMAID_TYPE = "mermaid.diagram";
export const MERMAID_VERSION = 1;

/** The fenced code info string the codec reads. */
export const MERMAID_LANG = "mermaid";

/**
 * The syntax claim of the codec and the manifest: fenced code with the
 * `mermaid` info string, a part of the `code` syntax another codec may own.
 */
export const MERMAID_SYNTAX = `code:${MERMAID_LANG}`;

/** The attrs of a diagram block, and the props of its island. */
export interface MermaidAttrs {
  readonly source: string;
}

const mermaidAttrsSchema = z.object({ source: z.string().catch("") }).catch({
  source: "",
});

/** Reads `source` from block attrs or island props; anything but a string becomes "". */
export function parseMermaidAttrs(value: unknown): MermaidAttrs {
  return mermaidAttrsSchema.parse(value);
}
