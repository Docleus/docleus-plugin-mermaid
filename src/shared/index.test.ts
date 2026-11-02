import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PLUGIN_NAME, parseMermaidAttrs } from "./index.ts";

const read = (file: string) =>
  JSON.parse(
    readFileSync(new URL(`../../${file}`, import.meta.url), "utf8"),
  ) as {
    name: string;
  };

describe("plugin manifest", () => {
  it("names the same plugin as package.json", () => {
    expect(read("docleus.plugin.json").name).toBe(PLUGIN_NAME);
    expect(read("package.json").name).toBe(PLUGIN_NAME);
  });
});

describe("parseMermaidAttrs", () => {
  it.each(["", "graph TD\n  A --> B", "<b>"])(
    "keeps the string %j",
    (source) => {
      expect(parseMermaidAttrs({ source })).toEqual({ source });
    },
  );

  it.each([undefined, null, "graph TD", {}, { source: 3 }, { source: null }])(
    "reads %j as an empty source",
    (value) => {
      expect(parseMermaidAttrs(value)).toEqual({ source: "" });
    },
  );
});
