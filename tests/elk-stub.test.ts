import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const STUB_DIR = fileURLToPath(new URL("../stubs/elkjs/", import.meta.url));

describe("elkjs override", () => {
  it("resolves mermaid's elkjs to the stub, so no EPL-2.0 code is installed", () => {
    const fromMermaid = createRequire(
      createRequire(import.meta.url).resolve("mermaid"),
    );
    const resolved = realpathSync(
      dirname(fromMermaid.resolve("elkjs/package.json")),
    );
    expect(`${resolved}/`).toBe(realpathSync(STUB_DIR) + "/");
  });

  it("fails the ELK layout with an error mermaid passes on", async () => {
    const { default: ELK, ELK_UNSUPPORTED } =
      await import("../stubs/elkjs/lib/elk.bundled.js");
    expect(() => new ELK()).toThrow(ELK_UNSUPPORTED);
    expect(ELK_UNSUPPORTED).toMatch(/^The ELK layout is not supported/);
  });
});
