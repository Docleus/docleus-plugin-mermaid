/** Editor styles for diagram blocks; injected while the plugin is loaded. */
export const MERMAID_EDITOR_CSS = `
.mermaid-block {
  display: flex; flex-direction: column; gap: 8px; margin: 14px 0; padding: 8px 12px 12px;
  border: 1px solid var(--hair, #e6e6e3); border-radius: var(--r, 3px); background: var(--rail, #f5f5f4);
}
.mermaid-block-source {
  width: 100%; box-sizing: border-box; padding: 4px 0; border: 0; resize: vertical;
  background: transparent; color: var(--ink, #111);
  font: 13px/1.55 var(--f-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
}
.mermaid-block-source:focus { outline: none; }
.mermaid-block-preview {
  margin: 0; padding: 12px; border: 1px solid var(--hair, #e6e6e3); border-radius: 2px;
  background: var(--paper, #fff); overflow-x: auto;
}
.mermaid-block-svg svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
.mermaid-block-error {
  margin: 0; padding-left: 10px; border-left: 2px solid var(--ink, #111);
  color: var(--ink, #111); font: var(--t-mono, 12px/18px ui-monospace, monospace); white-space: pre-wrap;
}
.mermaid-block-error:empty { display: none; }
.mermaid-block.is-reading { padding: 0; border: 0; background: none; }
.mermaid-block.is-reading .mermaid-block-preview { border-color: var(--hair, #e6e6e3); }
`;
