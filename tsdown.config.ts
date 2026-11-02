import { defineConfig } from "tsdown";

const common = {
  format: "esm",
  dts: false,
  outExtensions: () => ({ js: ".js" }),
} as const;

// React, its JSX runtime and the SDK come from the host's import map; mermaid
// is bundled into each browser build as lazily loaded chunks.
const browser = {
  ...common,
  platform: "browser" as const,
  deps: {
    neverBundle: ["@docleus/sdk", /^react(-dom)?(\/.*)?$/],
    alwaysBundle: [/^mermaid(\/.*)?$/, /^elkjs(\/.*)?$/],
    onlyBundle: false as const,
  },
};

export default defineConfig([
  {
    ...common,
    entry: {
      "shared/index": "src/shared/index.ts",
      "server/index": "src/server/index.ts",
    },
    clean: ["dist/shared", "dist/server", "dist/*.js"],
  },
  {
    // Browser builds of their own, so their chunks stay inside the browser
    // roots the host serves and publishes: `dist/editor` and `dist/site`.
    ...browser,
    entry: { index: "src/editor/index.ts" },
    outDir: "dist/editor",
    clean: true,
  },
  {
    ...browser,
    entry: { index: "src/site/index.ts", diagram: "src/site/diagram.ts" },
    outDir: "dist/site",
    clean: true,
  },
]);
