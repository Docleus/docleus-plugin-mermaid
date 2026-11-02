// Browser only: imported by the editor and site entries, never re-exported
// from `shared/index.ts`, so server code cannot pull mermaid in (the
// dependency-cruiser config enforces this).

/** What rendering a diagram produced: an SVG, or the error mermaid reported. */
export type MermaidOutcome =
  | { readonly svg: string; readonly error?: undefined }
  | { readonly error: string; readonly svg?: undefined };

/** A string safe to use as an element id: mermaid also uses it in CSS selectors. */
export function mermaidElementId(seed: string): string {
  return `mermaid-${seed.replaceAll(/[^\w-]/g, "_")}`;
}

function messageOf(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.trim() || "The diagram could not be rendered.";
}

/**
 * Renders `source` to an SVG with mermaid, which is loaded on first use from
 * a chunk of the calling build. `id` names the temporary element mermaid
 * draws in; see {@link mermaidElementId}. Never rejects.
 */
export async function renderMermaid(
  id: string,
  source: string,
): Promise<MermaidOutcome> {
  if (source.trim() === "") return { error: "The diagram is empty." };
  try {
    const { default: mermaid } = await import("mermaid");
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      // mermaid 12 defaults to the ELK layout, whose elkjs is stubbed out
      // (EPL-2.0), so diagrams use dagre unless they ask for ELK.
      layout: "dagre",
      // The host's UI font; SVG text cannot read the host's CSS variables.
      fontFamily:
        '-apple-system, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    });
    const { svg } = await mermaid.render(id, source);
    return { svg };
  } catch (error) {
    return { error: messageOf(error) };
  }
}
