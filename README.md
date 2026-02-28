## OpenSCAD to ManifoldCAD Prototype Compiler

This is just a very early stage experimental prototype of this GSOC 2026 idea - https://github.com/opencax/GSoC/issues/117

### What This Prototype Demonstrates
- Parsing a subset of OpenSCAD syntax
- Building an Abstract Syntax Tree (AST)
- Translating OpenSCAD primitives and transformations into Manifold-style API calls
- Establishing a foundation for a full OpenSCAD → ManifoldCAD compiler

Currently supported constructs:
- `cube()`
- `sphere()`
- `translate()`

### WORKFLOW:
```OpenSCAD Code -> Parser -> AST -> Compiler -> Manifold JS Calls```

### Quick Start:
```
npm i
npm run dev
```
Add more examples on `/examples` to test.

### Future Work
- modules
- functions
- children()
- $variables
- nightly features
