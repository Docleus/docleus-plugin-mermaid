import { vi } from "vitest";

/** Sources the stubbed mermaid rejects, as mermaid does for invalid text. */
export const INVALID_SOURCE = "flowchart ???";

/** A stand-in for mermaid's default export: SVG for valid sources, an error otherwise. */
export const mermaidStub = {
  initialize: vi.fn(),
  render: vi.fn(async (id: string, source: string) => {
    if (source === INVALID_SOURCE) {
      throw new Error("Parse error on line 1: unexpected '???'");
    }
    return { svg: `<svg id="${id}" data-source="${source.length}"></svg>` };
  }),
};
