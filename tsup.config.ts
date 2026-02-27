import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/mcp-entry.ts", "src/cli.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  splitting: true,
  clean: true,
});
