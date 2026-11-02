import { readFileSync } from "node:fs";
import { parseManifest } from "@docleus/sdk";
import { describe, expect, it } from "vitest";
import config from "../tsdown.config.ts";
import { MERMAID_SYNTAX, MERMAID_TYPE } from "../src/shared/index.ts";

const manifest = parseManifest(
  JSON.parse(
    readFileSync(new URL("../docleus.plugin.json", import.meta.url), "utf8"),
  ),
);

/** Every file the tsdown builds write for their entries, as `./dist/...` paths. */
function buildOutputs(): string[] {
  const builds: readonly unknown[] = Array.isArray(config) ? config : [config];
  return builds.flatMap((build) => {
    if (typeof build !== "object" || build === null) return [];
    const { entry, outDir = "dist" } = build as {
      entry?: unknown;
      outDir?: unknown;
    };
    if (typeof entry !== "object" || entry === null) return [];
    return Object.keys(entry).map((name) => `./${String(outDir)}/${name}.js`);
  });
}

describe("docleus.plugin.json", () => {
  it("declares the diagram island and the mermaid fence syntax", () => {
    expect(manifest.islands).toEqual({
      [MERMAID_TYPE]: "./dist/site/diagram.js",
    });
    expect(manifest.syntax).toEqual([MERMAID_SYNTAX]);
  });

  it("points only at files the build produces", () => {
    const outputs = buildOutputs();
    const files = [
      ...Object.values(manifest.entries),
      ...Object.values(manifest.islands),
    ];
    expect(files).toHaveLength(5);
    for (const file of files) expect(outputs).toContain(file);
  });

  it("keeps the site entry and islands in one browser root", () => {
    const files = [manifest.entries.site, ...Object.values(manifest.islands)];
    for (const file of files) expect(file).toMatch(/^\.\/dist\/site\/[^/]+$/);
  });
});
