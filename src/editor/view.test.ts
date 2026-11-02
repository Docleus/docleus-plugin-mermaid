// @vitest-environment happy-dom
import type { BlockViewProps } from "@docleus/sdk";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { INVALID_SOURCE, mermaidStub } from "../../tests/mermaid-stub.ts";
import { DiagramView, PREVIEW_DELAY_MS } from "./view.tsx";

vi.mock("mermaid", () => ({ default: mermaidStub }));

beforeAll(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

let host: HTMLElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

function props(
  source: unknown,
  updateAttrs: BlockViewProps["updateAttrs"] = () => {},
): BlockViewProps {
  return {
    attrs: { source },
    isEditable: true,
    isSelected: false,
    updateAttrs,
    Content: () => null,
  };
}

async function show(view: BlockViewProps): Promise<void> {
  await act(async () => {
    root.render(createElement(DiagramView, view));
  });
}

/** Lets the debounce run out and the render settle. */
async function settle(ms = PREVIEW_DELAY_MS): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const textarea = () => {
  const found = host.querySelector("textarea");
  if (!found) throw new Error("no textarea");
  return found;
};
const preview = () => host.querySelector(".mermaid-block-svg");
const error = () => host.querySelector(".mermaid-block-error")?.textContent;

describe("diagram view", () => {
  it("edits the source through updateAttrs", async () => {
    const updates: unknown[] = [];
    await show(props("graph TD", (patch) => updates.push(patch)));
    expect(textarea().value).toBe("graph TD");
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      setter?.call(textarea(), "graph LR");
      textarea().dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(updates).toEqual([{ source: "graph LR" }]);
  });

  it("previews the source once it stops changing", async () => {
    await show(props("graph TD"));
    await settle(PREVIEW_DELAY_MS - 1);
    expect(mermaidStub.render).not.toHaveBeenCalled();
    await show(props("graph TD\n  A"));
    await settle(PREVIEW_DELAY_MS - 1);
    expect(mermaidStub.render).not.toHaveBeenCalled();
    await settle(1);
    expect(mermaidStub.render).toHaveBeenCalledTimes(1);
    expect(mermaidStub.render.mock.calls[0]?.[1]).toBe("graph TD\n  A");
    expect(preview()?.querySelector("svg")).not.toBeNull();
    expect(error()).toBe("");
    expect(mermaidStub.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        securityLevel: "strict",
        startOnLoad: false,
        layout: "dagre",
      }),
    );
  });

  it("shows mermaid's error inline instead of a preview", async () => {
    await show(props(INVALID_SOURCE));
    await settle();
    expect(preview()).toBeNull();
    expect(error()).toBe("Parse error on line 1: unexpected '???'");
  });

  it("reports an empty diagram without calling mermaid", async () => {
    await show(props("  \n"));
    await settle();
    expect(mermaidStub.render).not.toHaveBeenCalled();
    expect(error()).toBe("The diagram is empty.");
  });

  it("shows only the diagram when the editor is not editable", async () => {
    await show({ ...props("graph TD"), isEditable: false });
    await settle();
    expect(host.querySelector("textarea")).toBeNull();
    expect(preview()).not.toBeNull();
  });
});
