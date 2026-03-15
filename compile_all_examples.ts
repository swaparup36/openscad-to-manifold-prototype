import fs from "fs";
import { compile } from "./src/compiler.js";
import { resolveProgram, getOpenSCADLibraryPaths } from "./src/resolver.js";

import path from "path";

const exampleDir = "examples";
const files = fs.readdirSync(exampleDir).filter(f => f.endsWith(".scad"));
const failed: string[] = [];

for (const file of files) {
    console.log(`\n=== Compiling ${file} ===`);
    const absFile = path.resolve(exampleDir, file);

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
        const message = (err as Error).message;
        console.error(`Error compiling ${file}: ${message}`);
        failed.push(file);
    }
}

if (failed.length > 0) {
    console.error(`\nFailed files (${failed.length}): ${failed.join(", ")}`);
    process.exitCode = 1;
}