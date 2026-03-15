import fs from "fs";
import { compile } from "./src/compiler.js";
import { resolveProgram, getOpenSCADLibraryPaths } from "./src/resolver.js";

import path from "path";

const file = process.argv[2] || "examples/cube.scad";
const absFile = path.resolve(file);

try {
  const libraryPaths = [
    path.dirname(absFile),
    process.cwd(),
    ...getOpenSCADLibraryPaths(),
  ];

  // Resolve all include/use directives recursively
  const resolved = resolveProgram(absFile, libraryPaths);

  if (resolved.resolvedFiles.length > 1) {
    console.log(`Resolved ${resolved.resolvedFiles.length} files:`);
    for (const f of resolved.resolvedFiles) {
      console.log(`  ${path.relative(process.cwd(), f)}`);
    }
  }

  const ast = { kind: "program" as const, statements: resolved.statements };
  const js = compile(ast);
  console.log(`Generated JavaScript (${js.length.toLocaleString()} chars)`);

  const outputFile = path.join("out", path.basename(file, path.extname(file)) + ".js");
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, js);
  console.log(`Output written to ${outputFile}`);
} catch (err) {
  console.error(`Error: ${(err as Error).message}`);
  process.exitCode = 1;
}