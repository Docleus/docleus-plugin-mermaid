// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { INVALID_SOURCE, mermaidStub } from "../../tests/mermaid-stub.ts";
import { mount } from "./diagram.ts";

vi.mock("mermaid", () => ({ default: mermaidStub }));

const FALLBACK = '<pre class="mermaid-source"><code>graph TD</code></pre>';

function island(): HTMLElement {
  const element = document.createElement("div");
  element.dataset.island = "mermaid.diagram";
  element.dataset.block = "b1";
  element.innerHTML = FALLBACK;
  document.body.append(element);
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("diagram island", () => {
  it("replaces the source fallback with the rendered SVG", async () => {
    const element = island();
    mount(element, { source: "graph TD" });
    expect(element.innerHTML).toBe(FALLBACK);
    await vi.waitFor(() => {
      expect(element.querySelector("figure.mermaid-svg svg")).not.toBeNull();
    });
    expect(element.querySelector("pre")).toBeNull();
    expect(mermaidStub.render).toHaveBeenCalledWith(
      "mermaid-site-b1",
      "graph TD",
    );
  });

  it("keeps the fallback and shows the error when mermaid fails", async () => {
    const element = island();
    mount(element, { source: INVALID_SOURCE });
    await vi.waitFor(() => {
      expect(element.querySelector(".mermaid-error")).not.toBeNull();
    });
    expect(element.querySelector("pre")).not.toBeNull();
    expect(element.querySelector(".mermaid-error")?.textContent).toBe(
      "Parse error on line 1: unexpected '???'",
    );
  });

  it.each([undefined, null, { source: 1 }])(
    "keeps the fallback for props %j",
    async (props) => {
      const element = island();
      mount(element, props);
      await vi.waitFor(() => {
        expect(element.querySelector(".mermaid-error")?.textContent).toBe(
          "The diagram is empty.",
        );
      });
      expect(mermaidStub.render).not.toHaveBeenCalled();
    },
  );

  it("leaves the element alone after cleanup", async () => {
    const element = island();
    const cleanup = mount(element, { source: "graph TD" });
    cleanup();
    await vi.waitFor(() => {
      expect(mermaidStub.render).toHaveBeenCalled();
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(element.innerHTML).toBe(FALLBACK);
  });
});
