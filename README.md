# OpenSCAD to Manifold.js Prototype Compiler

Early-stage experimental prototype for: https://github.com/opencax/GSoC/issues/117

## Current Status

This project can parse OpenSCAD source, resolve recursive `include`/`use` dependencies, and compile to JavaScript that executes with `manifold-3d`.

Current pipeline:

```text
OpenSCAD (.scad) -> Lexer -> Parser -> AST -> Compiler -> Manifold JS (.js)
```

The generated files in `out/` export:

```js
export const result = ...
```

## Supported Constructs

### Geometry / Modules
- Primitives: `cube`, `sphere`, `cylinder`, `circle`, `square`, `polygon`, `polyhedron`, `text`
- Transforms: `translate`, `rotate`, `scale`, `mirror`, `multmatrix`, `resize`
- Boolean ops: `union`, `difference`, `intersection`, `hull`, `minkowski`
- Extrusion: `linear_extrude`, `rotate_extrude`
- Other modules: `projection`, `offset`, `color`, `render`, `children`, `echo`, `assert`, `let`

### Language
- Variables, functions, modules
- `for` statements and list-comprehension forms (`for`, C-style `for`, `if`, `let`, `each`)
- `if/else`
- Expressions: arithmetic, comparison, logical, ternary, unary, indexing, member access
- Named arguments and default parameters
- Vectors and ranges
- Lambdas and dynamic calls (for example `expr(args)`)
- Strings, booleans, `undef`, comments
- `include <...>` and `use <...>` (resolved recursively before compile)

## Include / Use Resolution

`demo.ts` resolves dependencies via `src/resolver.ts` using:
- The current file's directory
- Workspace root (so local libraries like `BOSL2/` can be found)
- `OPENSCADPATH`
- Default OpenSCAD user library locations per OS

`include` imports declarations and top-level geometry.

`use` imports declarations only (modules/functions).

## Running

Install:

```bash
npm install
```

Set the `OPENSCADPATH` on the `.env` file. (This is the path on you PC where OpenSCAD libraries are stored)

Compile built-in examples:

```bash
npm run dev:cube
npm run dev:advanced
npm run dev:boolean_ops
npm run dev:modules
```

Compile all built-in examples at once:

```bash
npm run compile-all-examples
```

Compile any `.scad` file:

```bash
npx tsx demo.ts path/to/file.scad
```

Generated JavaScript is written to `out/` and printed to stdout.

## Visual Comparison Assets

- BOSL2-oriented examples are available in `examples/`
- Render comparison images are in `images/`
- Comparison document: `comparison.md`
- A local viewer page exists at `viewer.html` for loading compiled `out/*.js`

## View any compiled example output

```bash
npm serve .
```

- Open http://localhost:3000/viewer 
- Enter the compiled output js file path (eg. out/xyz.js)
- Click on the load button
- You can see the mesh loaded on the 3D space

## Known Approximations / Gaps

- `text()` is approximated to a simple sized cross-section box.
- `minkowski()` is approximated using convex hull of inputs.
- `projection()` is emitted as a thin extruded manifold for 3D pipeline compatibility.
- `color()` and `render()` are currently pass-through (kept as comments in output).
- Compatibility with full OpenSCAD and full BOSL2 is not complete; behavior is pragmatic and still evolving.

## Project Layout

```text
src/
  lexer.ts
  parser.ts
  ast.ts
  compiler.ts
  resolver.ts
demo.ts
complie_all_example.ts
examples/
images/
out/
viewer.html
comparison.md
```
