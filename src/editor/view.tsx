import type { BlockViewProps } from "@docleus/sdk";
import { useEffect, useId, useState } from "react";
import { parseMermaidAttrs } from "../shared/index.ts";
import {
  mermaidElementId,
  renderMermaid,
  type MermaidOutcome,
} from "../shared/render-mermaid.ts";

/** How long the preview waits after the last edit before it renders. */
export const PREVIEW_DELAY_MS = 300;

/** The rendered `source`, settled `PREVIEW_DELAY_MS` after it last changed. */
function useMermaidPreview(
  id: string,
  source: string,
): MermaidOutcome | undefined {
  const [outcome, setOutcome] = useState<MermaidOutcome>();
  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(() => {
      void renderMermaid(id, source).then((result) => {
        if (isCurrent) setOutcome(result);
      });
    }, PREVIEW_DELAY_MS);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [id, source]);
  return outcome;
}

/**
 * Edits a diagram's source next to a live preview; mermaid errors show
 * inline. Readers see only the diagram.
 */
export function DiagramView(props: BlockViewProps) {
  const { attrs, isEditable, updateAttrs } = props;
  const { source } = parseMermaidAttrs(attrs);
  const id = mermaidElementId(useId());
  const outcome = useMermaidPreview(id, source);
  return (
    <div
      className={`mermaid-block${isEditable ? "" : " is-reading"}`}
      contentEditable={false}
    >
      {isEditable && (
        <textarea
          className="mermaid-block-source"
          aria-label="Mermaid source"
          spellCheck={false}
          rows={Math.max(3, source.split("\n").length)}
          value={source}
          onChange={(event) => updateAttrs({ source: event.target.value })}
        />
      )}
      <figure
        className="mermaid-block-preview"
        aria-label="Diagram preview"
        aria-busy={outcome === undefined}
      >
        {outcome?.svg !== undefined && (
          // mermaid sanitizes the SVG it returns (securityLevel "strict").
          <div
            className="mermaid-block-svg"
            dangerouslySetInnerHTML={{ __html: outcome.svg }}
          />
        )}
        <p className="mermaid-block-error" aria-live="polite">
          {outcome?.error ?? ""}
        </p>
      </figure>
    </div>
  );
}
