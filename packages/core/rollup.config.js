import { resolve, dirname } from "path";
import { cwd } from "process";
import { rmSync, readFileSync } from "fs";

import ts from "rollup-plugin-ts";
import terser from "@rollup/plugin-terser";

const currDir = cwd();

const pkg = (() => {
  function findPkg(start = currDir, level = 0) {
    try {
      const path = resolve(start, "package.json");
      const content = readFileSync(path, { encoding: "utf8" });
      return JSON.parse(content);
    } catch {
      return level >= 10 ? {} : findPkg(dirname(start), level + 1);
    }
  }

  return findPkg();
})();

const outDir = resolve(currDir, "dist");

rmSync(outDir, { recursive: true, force: true });

export default {
  input: "src/index.ts",
  output: [
    {
      file: resolve(outDir, "cjs", "index.js"),
      format: "cjs",
      sourcemap: true,
    },
    {
      file: resolve(outDir, "esm", "index.js"),
      format: "esm",
      sourcemap: true,
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  plugins: [
    ts({
      transpiler: {
        typescriptSyntax: "typescript",
        otherSyntax: "babel",
      },
      browserslist: false,
    }),
    terser(),
  ],
};
