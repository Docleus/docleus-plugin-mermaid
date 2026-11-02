// @vitest-environment happy-dom
import {
  Context,
  trackCaller,
  type EditorHandle,
  type EditorService,
} from "@docleus/sdk";
import { describe, expect, it } from "vitest";
import { MERMAID_TYPE, PLUGIN_NAME } from "../shared/index.ts";
import { DIAGRAM_BLOCK, DIAGRAM_SLASH_ITEM, plugin } from "./index.ts";

/**
 * Records every `register*` call by kind and type (or id). Built without the
 * full `EditorService` type so the fake keeps compiling as methods are added.
 */
function fakeEditorService(owner: Context) {
  const registered = new Set<string>();
  const register = (kind: string) =>
    function (
      this: { readonly ctx: Context },
      item: { readonly type?: string; readonly id?: string },
    ) {
      const key = `${kind}:${item.type ?? item.id ?? ""}`;
      return this.ctx.effect(() => {
        registered.add(key);
        return () => registered.delete(key);
      }, key);
    };
  const methods = {
    registerBlock: register("block"),
    registerInline: register("inline"),
    registerMark: register("mark"),
    registerToolbarItem: register("toolbar"),
    registerSlashItem: register("slash"),
    registerExtension: register("extension"),
    registerCollaboration: register("collaboration"),
  };
  const service = trackCaller(owner, methods as unknown as EditorService);
  return { service, registered };
}

const styles = () =>
  document.head.querySelectorAll(`style[data-plugin="${PLUGIN_NAME}"]`);

describe("editor plugin", () => {
  it("registers the block, slash item and styles until it unloads", async () => {
    const root = new Context();
    const { service, registered } = fakeEditorService(root);
    root.provide("editor", service);
    const fiber = await root.plugin(plugin);
    expect([...registered].toSorted()).toEqual([
      `block:${MERMAID_TYPE}`,
      `slash:${MERMAID_TYPE}`,
    ]);
    expect(styles()).toHaveLength(1);
    await fiber.dispose();
    expect(registered.size).toBe(0);
    expect(styles()).toHaveLength(0);
  });

  it("inserts an example diagram from the slash menu", () => {
    const calls: unknown[][] = [];
    const editor = {
      insertBlock: (...args: unknown[]) => {
        calls.push(args);
        return true;
      },
    } as unknown as EditorHandle;
    DIAGRAM_SLASH_ITEM.run(editor);
    expect(calls).toEqual([
      [MERMAID_TYPE, { source: "flowchart LR\n  A --> B" }],
    ]);
  });

  it("turns a ```mermaid line into a diagram, and no other fence", () => {
    const [shortcut] = DIAGRAM_BLOCK.shortcuts ?? [];
    expect(shortcut?.pattern.test("```mermaid ")).toBe(true);
    for (const text of ["``` ", "```js ", "```mermaidx ", "x```mermaid "]) {
      expect(shortcut?.pattern.test(text)).toBe(false);
    }
  });
});
