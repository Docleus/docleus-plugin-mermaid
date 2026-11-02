import { createMarkdownService } from "@docleus/core-markdown";
import { Context, type BlockNode, type MarkdownCodec } from "@docleus/sdk";
import { createMarkdownRoundTrip } from "@docleus/testing";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  MERMAID_SYNTAX,
  MERMAID_TYPE,
  createMermaidCodec,
} from "../src/shared/index.ts";

const check = createMarkdownRoundTrip([createMermaidCodec()]);

const diagram = (source: string): BlockNode => ({
  id: "d",
  type: MERMAID_TYPE,
  v: 1,
  attrs: { source },
});

/**
 * Stands in for the codec that owns `code` (docleus-plugin-blocks-commonmark's):
 * it reads every fence, whatever its info string.
 */
const genericCode: MarkdownCodec = {
  name: "test.code",
  claims: ["code"],
  blockTypes: ["test.code"],
  toBlock(node, context) {
    if (node.type !== "code") return undefined;
    return {
      id: context.newId(),
      type: "test.code",
      v: 1,
      attrs: { lang: node.lang ?? null, value: node.value },
    };
  },
  fromBlock(block) {
    const { lang, value } = block.attrs;
    return {
      type: "code",
      lang: typeof lang === "string" ? lang : null,
      value: typeof value === "string" ? value : "",
    };
  },
};

function service(codecs: readonly MarkdownCodec[]) {
  const markdown = createMarkdownService(new Context());
  for (const codec of codecs) markdown.register(codec);
  return markdown;
}

const types = (markdown: ReturnType<typeof service>, text: string) =>
  (markdown.parse(text).body.content ?? []).map((block) => block.type);

/** Diagram text, weighted towards characters fences and Markdown care about. */
const sourceChar = fc.constantFrom(
  ..."`~-> \n\t#*_[]<>&\"'\\:|{}()%;",
  ..."abcxyzABC019",
);
const source = fc.string({ unit: sourceChar, maxLength: 40 });

describe("mermaid codec", () => {
  it("reads a mermaid fence as a diagram", () => {
    const markdown = service([createMermaidCodec()]);
    const [block, ...rest] =
      markdown.parse("```mermaid\nflowchart LR\n  A --> B\n```\n").body
        .content ?? [];
    expect(rest).toEqual([]);
    expect(block).toMatchObject({
      type: MERMAID_TYPE,
      v: 1,
      attrs: { source: "flowchart LR\n  A --> B" },
    });
  });

  it("writes a diagram as a mermaid fence", () => {
    expect(check.roundTrip(diagram("graph TD\n  A --> B"))).toBe(
      "```mermaid\ngraph TD\n  A --> B\n```\n",
    );
  });

  it("round-trips any source (tree -> Markdown -> tree)", () => {
    fc.assert(
      fc.property(source, (text) => {
        check.roundTrip(diagram(text));
      }),
      { numRuns: 300 },
    );
  });

  it("lengthens the fence around a source holding backticks", () => {
    expect(check.roundTrip(diagram("a\n```\nb"))).toBe(
      "````mermaid\na\n```\nb\n````\n",
    );
  });

  it("reads back what it wrote after an uninstall and reinstall", () => {
    check.survivesUninstall(diagram('pie\n  "A": 1'));
  });

  it.each([
    ["backtick fence", "```mermaid\nflowchart LR\n  A-->B\n```\n"],
    ["tilde fence", "~~~mermaid\ngraph TD\n~~~\n"],
    ["long fence", "`````mermaid\na\n`````\n\ntext after\n"],
    ["indented content", "```mermaid\n    graph TD\n\n\n```\n"],
  ])("exports an unchanged %s byte for byte", (_name, markdown) => {
    check.preserves(markdown);
  });

  it("claims only fences with the mermaid info string", () => {
    expect(createMermaidCodec().claims).toEqual([MERMAID_SYNTAX]);
    const markdown = service([createMermaidCodec()]);
    expect(
      types(
        markdown,
        "```js\nx\n```\n\n```\nplain\n```\n\n```mermaid title\nmeta\n```\n\n```Mermaid\ncase\n```\n",
      ),
    ).toEqual(["raw", "raw", "raw", "raw"]);
  });

  it("leaves other fences to the code codec registered after it", () => {
    const markdown = service([createMermaidCodec(), genericCode]);
    const text = "```mermaid\ngraph TD\n```\n\n```ts\nconst a = 1;\n```\n";
    expect(types(markdown, text)).toEqual([MERMAID_TYPE, "test.code"]);
    const document = markdown.parse(text);
    expect(markdown.serialize({ body: document.body })).toBe(text);
  });

  it("can register next to the codec that claims code", () => {
    expect(() => service([genericCode, createMermaidCodec()])).not.toThrow();
  });

  it("wins over a code codec registered before it", () => {
    const markdown = service([genericCode, createMermaidCodec()]);
    expect(
      types(markdown, "```mermaid\ngraph TD\n```\n\n```ts\nx\n```\n"),
    ).toEqual([MERMAID_TYPE, "test.code"]);
  });
});
