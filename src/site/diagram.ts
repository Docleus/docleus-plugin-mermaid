import { parseMermaidAttrs } from "../shared/index.ts";
import { mermaidElementId, renderMermaid } from "../shared/render-mermaid.ts";

/**
 * Island module of `mermaid.diagram`: the site runtime calls it with the
 * block's `data-island` element and the props its renderer returned. The
 * server-rendered source stays until the SVG is ready, and stays as the
 * fallback when mermaid reports an error, which is shown below it.
 */
export function mount(element: HTMLElement, props: unknown): () => void {
  const { source } = parseMermaidAttrs(props);
  const id = mermaidElementId(`site-${element.dataset.block ?? "diagram"}`);
  let isMounted = true;
  void renderMermaid(id, source).then((outcome) => {
    if (!isMounted) return;
    if (outcome.svg !== undefined) {
      const figure = document.createElement("figure");
      figure.className = "mermaid-svg";
      // mermaid sanitizes the SVG it returns (securityLevel "strict").
      figure.innerHTML = outcome.svg;
      element.replaceChildren(figure);
      return;
    }
    const error = document.createElement("p");
    error.className = "mermaid-error";
    error.textContent = outcome.error;
    element.append(error);
  });
  return () => {
    isMounted = false;
  };
}
