import ts from "typescript";
import { cwd } from "node:process";
import { resolve, dirname, parse } from "node:path";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { writeFileSync, rmSync, readFileSync } from "node:fs";
import { babel } from "@rollup/plugin-babel";
import alias from "@rollup/plugin-alias";

rmSync(resolve(cwd(), "dist"), {
  force: true,
  recursive: true,
});

const currentDir = cwd();
const pkg = (() => {
  function findClosestPackageJson(start = cwd(), level = 0) {
    try {
      const path = resolve(start, "package.json");
      const content = readFileSync(path, { encoding: "utf8" });
      return JSON.parse(content);
    } catch {
      return level >= 10
        ? {}
        : findClosestPackageJson(dirname(start), level + 1);
    }
  }

  return findClosestPackageJson(currentDir);
})();
const tsConfig = (() => {
  try {
    const path = resolve(currentDir, "tsconfig.json");
    const content = readFileSync(path, { encoding: "utf8" });
    return JSON.parse(content);
  } catch {
    return {};
  }
})();

const extensions = [".js", ".ts", ".jsx", ".tsx"];
const src = pkg.source;

if (!src) {
  throw new Error("Please set the `source` property in your `package.json`");
}

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const babelTargets = pkg.browserslist || "last 2 years";

const name = parse(src).name;

const outputs = [
  {
    format: "cjs",
    file: resolve(`dist/${name}/index.common.js`),
    sourcemap: true,
  },
  {
    format: "esm",
    file: resolve(`dist/${name}/index.module.js`),
    sourcemap: true,
  },
];

const input = resolve(src);

export default outputs.map((output) => {
  return {
    input,
    output,
    external,
    plugins: [
      alias(
        (() => {
          const aliases = tsConfig.compilerOptions.paths || false;

          if (!aliases) {
            return {};
          }

          return {
            entries: Object.entries(aliases)
              .filter(([key]) => key.endsWith("/*"))
              .map(([key, [value]]) => ({
                find: key.replace("/*", ""),
                replacement: resolve(currentDir, value.replace("/*", "")),
              })),
          };
        })(),
      ),
      babel({
        extensions,
        babelHelpers: "bundled",
        presets: [
          "@babel/preset-typescript",
          ["@babel/preset-env", { bugfixes: true, targets: babelTargets }],
        ],
      }),
      nodeResolve({ extensions }),
      {
        name: "ts",
        buildEnd() {
          const program = ts.createProgram([input], {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.NodeNext,
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            outDir: `dist/${name}`,
            declarationDir: `dist/${name}`,
            declaration: true,
            allowJs: true,
          });

          program.emit();
        },
      },
      {
        name: "instructions",
        buildEnd() {},
      },
      {
        name: "generate",
        buildEnd() {
          const build = {
            main: `index.common.js`,
            module: `index.module.js`,
            types: `${name}.d.ts`,
            exports: {
              ".": {
                import: `./index.module.js`,
                require: `./index.common.js`,
                node: `./index.common.js`,
              },
            },
          };

          writeFileSync(
            resolve(currentDir, "dist", name, "package.json"),
            JSON.stringify(build, null, 2),
            { encoding: "utf8" },
          );
        },
      },
    ],
  };
});
