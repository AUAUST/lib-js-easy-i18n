import { resolve } from "path";
import { cwd } from "process";
import { rmSync } from "fs";

import ts from "rollup-plugin-ts";
import { terser } from "rollup-plugin-terser";

const outDir = resolve(cwd(), "dist");

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
  // ...
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
