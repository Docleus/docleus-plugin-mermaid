/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "plugins-use-sdk-only",
      severity: "error",
      comment:
        "Plugins depend on @docleus/sdk, never on core internals or other plugins.",
      from: { path: "^src" },
      to: { path: "node_modules/@docleus/(?!sdk/|config/)" },
    },
    {
      name: "mermaid-in-browser-entries-only",
      severity: "error",
      comment:
        "mermaid runs in the browser; server and shared code must not load it.",
      from: {
        path: "^src/(server|shared)/",
        pathNot: ["^src/shared/render-mermaid\\.ts$", "\\.test\\.tsx?$"],
      },
      to: {
        path: ["node_modules/mermaid/", "^src/shared/render-mermaid\\.ts$"],
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
