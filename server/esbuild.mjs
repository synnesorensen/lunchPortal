import * as esbuild from "esbuild";
import { mkdirSync } from "node:fs";

const handlers = ["health", "me", "dbPing"];

for (const name of handlers) {
  mkdirSync(`dist/${name}`, { recursive: true });
  await esbuild.build({
    entryPoints: [`src/handlers/${name}.ts`],
    bundle: true,
    platform: "node",
    target: "node22",
    format: "cjs",
    outfile: `dist/${name}/index.js`,
    sourcemap: true,
  });
}
