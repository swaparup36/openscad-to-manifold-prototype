## OpenSCAD to ManifoldCAD Prototype Compiler

This is an early-stage experimental prototype for https://github.com/opencax/GSoC/issues/117.

### Workflow

```
OpenSCAD (.scad) -> Lexer -> Parser -> AST -> Compiler -> Manifold JS (.js)
```

The compiler reads `.scad` files, parses them into an AST using a hand-written **lexer** and **recursive descent parser**, then generates JavaScript that uses the Manifold 3D API.

### Supported OpenSCAD Constructs

#### 3D Primitives
- `cube()` — scalar or vector size, `center`
- `sphere()` — `r`, `d`, `$fn`
- `cylinder()` — `h`, `r`, `r1`/`r2`, `d`, `d1`/`d2`, `center`, `$fn`

#### 2D Primitives
- `circle()` — `r`, `d`, `$fn`
- `square()` — scalar or vector size, `center`
- `polygon()` — `points`

#### Transforms
- `translate()`, `rotate()`, `scale()` — vector argument
- `mirror()` — mirror across a plane
- `multmatrix()` — 4×4 transformation matrix
- `color()` — passthrough (noted in output as comment)

#### Boolean Operations
- `union()`, `difference()`, `intersection()`, `hull()`

#### Extrusion
- `linear_extrude()` — `height`, `twist`, `slices`, `center`
- `rotate_extrude()` — `$fn`

#### Language Features
- **Variables** — `x = 10;`
- **Modules** — `module foo(a, b=5) { ... }` with default parameters
- **Functions** — `function f(x) = x * 2;`
- **`for` loops** — `for (i = [0:10])`, `for (i = [1, 2, 3])`, multiple variables
- **`if` / `else`**
- **Expressions** — arithmetic (`+ - * / %`), comparison (`== != < > <= >=`), logical (`&& || !`), ternary (`? :`), unary negation
- **Named arguments** — `cube(size=10, center=true)`
- **Vectors & ranges** — `[1, 2, 3]`, `[0 : 0.5 : 10]`
- **Comments** — `// line` and `/* block */`
- **Strings** — `"hello\n"` with escape sequences
- **Nested module calls** — user-defined modules called like built-ins

### Quick Start

```bash
npm install
```

Compile an example:

```bash
npm run dev:cube          # examples/cube.scad
npm run dev:advanced      # examples/advanced.scad
npm run dev:boolean_ops   # examples/boolean_ops.scad
npm run dev:modules       # examples/modules.scad
```

Or compile any `.scad` file:

```bash
npx tsx demo.ts path/to/file.scad
```

Generated JS is written to `out/` and printed to the console.

### Project Structure

```
src/
  lexer.ts      Tokenizer — numbers, strings, identifiers, operators, comments
  ast.ts        AST node types (Expr + Statement)
  parser.ts     Recursive descent parser → Program AST
  compiler.ts   AST → Manifold JS code generator
demo.ts         CLI entry point — reads .scad, writes .js
examples/       Sample .scad files
out/            Generated .js output
```

### Future Work
- `children()` support
- `include` / `use`
- `let` / `each` / `assert`
- More 2D primitives (`text`, `offset`)
- `minkowski()`
- `projection()`
