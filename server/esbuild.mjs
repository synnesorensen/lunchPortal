import * as esbuild from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("dist/health", { recursive: true });

await esbuild.build({
  entryPoints: ["src/handlers/health.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  outfile: "dist/health/index.js",
  sourcemap: true,
});
