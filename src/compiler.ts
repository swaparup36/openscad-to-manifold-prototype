import type {
  Program, Statement, Expr, Argument,
  ModuleCallStmt, BlockStmt, ForStmt, IfStmt,
} from "./ast.js";

export function compile(program: Program): string {
  const declarations: string[] = [];
  const geometries: string[] = [];

  for (const stmt of program.statements) {
    if (
      stmt.kind === "variableDecl" ||
      stmt.kind === "moduleDecl" ||
      stmt.kind === "functionDecl"
    ) {
      declarations.push(compileDeclaration(stmt));
    } else {
      const geo = compileGeometry(stmt);
      if (geo) geometries.push(geo);
    }
  }

  let output = `import Module from "manifold-3d";\nconst wasm = await Module();\nconst { Manifold, CrossSection } = wasm;\n\n`;

  if (declarations.length) {
    output += declarations.join("\n") + "\n\n";
  }

  if (geometries.length === 0) {
    output += "// (no geometry)";
  } else if (geometries.length === 1) {
    output += `const result = ${geometries[0]};`;
  } else {
    output += `const result = Manifold.union([\n  ${geometries.join(",\n  ")}\n]);`;
  }

  return output;
}

function compileDeclaration(stmt: Statement): string {
  switch (stmt.kind) {
    case "variableDecl":
      return `const ${stmt.name} = ${compileExpr(stmt.value)};`;

    case "moduleDecl": {
      const params = stmt.params
        .map((p) =>
          p.defaultValue
            ? `${p.name} = ${compileExpr(p.defaultValue)}`
            : p.name
        )
        .join(", ");
      const body = compileGeometry(stmt.body);
      return `function ${stmt.name}(${params}) {\n  return ${body};\n}`;
    }

    case "functionDecl": {
      const params = stmt.params
        .map((p) =>
          p.defaultValue
            ? `${p.name} = ${compileExpr(p.defaultValue)}`
            : p.name
        )
        .join(", ");
      return `function ${stmt.name}(${params}) {\n  return ${compileExpr(stmt.body)};\n}`;
    }

    default:
      return `/* unsupported declaration: ${(stmt as Statement).kind} */`;
  }
}

function compileGeometry(stmt: Statement): string {
  switch (stmt.kind) {
    case "moduleCall":
      return compileModuleCall(stmt);
    case "block":
      return compileBlockGeometry(stmt);
    case "for":
      return compileForGeometry(stmt);
    case "if":
      return compileIfGeometry(stmt);
    case "empty":
      return "";
    case "variableDecl":
    case "moduleDecl":
    case "functionDecl":
      return `/* skipped declaration inside geometry context */`;
    default:
      return `/* unsupported: ${(stmt as Statement).kind} */`;
  }
}


function compileModuleCall(stmt: ModuleCallStmt): string {
  switch (stmt.name) {
    case "cube":       return compileCube(stmt.args);
    case "sphere":     return compileSphere(stmt.args);
    case "cylinder":   return compileCylinder(stmt.args);
    case "circle":     return compileCircle(stmt.args);
    case "square":     return compileSquare(stmt.args);
    case "polygon":    return compilePolygon(stmt.args);
    case "translate":  return compileTransform(stmt, "translate");
    case "rotate":     return compileTransform(stmt, "rotate");
    case "scale":      return compileTransform(stmt, "scale");
    case "mirror":     return compileMirror(stmt);
    case "multmatrix": return compileMultMatrix(stmt);
    case "color":      return compilePassthrough(stmt, "color");
    case "union":        return compileBoolOp(stmt, "union");
    case "difference":   return compileDifference(stmt);
    case "intersection": return compileBoolOp(stmt, "intersection");
    case "hull":         return compileBoolOp(stmt, "hull");
    case "linear_extrude": return compileLinearExtrude(stmt);
    case "rotate_extrude": return compileRotateExtrude(stmt);
    default:
      return compileUserModuleCall(stmt);
  }
}

function compileCube(args: Argument[]): string {
  const size   = findArg(args, "size", 0);
  const center = findArg(args, "center", 1);

  const sizeStr   = size   ? compileExpr(size.value)   : "1";
  const centerStr = center ? compileExpr(center.value) : "false";

  if (size && size.value.kind === "vector") {
    return `Manifold.cube(${sizeStr}, ${centerStr})`;
  }
  return `Manifold.cube([${sizeStr}, ${sizeStr}, ${sizeStr}], ${centerStr})`;
}

function compileSphere(args: Argument[]): string {
  const r  = findArg(args, "r", 0);
  const d  = findArg(args, "d");
  const fn = findArg(args, "$fn");

  let radiusStr: string;
  if (d) {
    radiusStr = `(${compileExpr(d.value)}) / 2`;
  } else {
    radiusStr = r ? compileExpr(r.value) : "1";
  }

  const segments = fn ? `, ${compileExpr(fn.value)}` : "";
  return `Manifold.sphere(${radiusStr}${segments})`;
}

function compileCylinder(args: Argument[]): string {
  const h      = findArg(args, "h", 0);
  const r      = findArg(args, "r", 1);
  const r1     = findArg(args, "r1");
  const r2     = findArg(args, "r2");
  const d      = findArg(args, "d");
  const d1     = findArg(args, "d1");
  const d2     = findArg(args, "d2");
  const center = findArg(args, "center");
  const fn     = findArg(args, "$fn");

  const hStr = h ? compileExpr(h.value) : "1";

  let rLow: string, rHigh: string;
  if (d1 && d2) {
    rLow  = `(${compileExpr(d1.value)}) / 2`;
    rHigh = `(${compileExpr(d2.value)}) / 2`;
  } else if (r1 && r2) {
    rLow  = compileExpr(r1.value);
    rHigh = compileExpr(r2.value);
  } else if (d) {
    rLow = rHigh = `(${compileExpr(d.value)}) / 2`;
  } else {
    rLow = rHigh = r ? compileExpr(r.value) : "1";
  }

  const parts = [hStr, rLow, rHigh];
  if (fn || center) parts.push(fn ? compileExpr(fn.value) : "0");
  if (center) parts.push(compileExpr(center.value));

  return `Manifold.cylinder(${parts.join(", ")})`;
}

function compileCircle(args: Argument[]): string {
  const r  = findArg(args, "r", 0);
  const d  = findArg(args, "d");
  const fn = findArg(args, "$fn");

  let radiusStr: string;
  if (d) {
    radiusStr = `(${compileExpr(d.value)}) / 2`;
  } else {
    radiusStr = r ? compileExpr(r.value) : "1";
  }

  const segments = fn ? `, ${compileExpr(fn.value)}` : "";
  return `CrossSection.circle(${radiusStr}${segments})`;
}

function compileSquare(args: Argument[]): string {
  const size   = findArg(args, "size", 0);
  const center = findArg(args, "center", 1);

  const sizeStr   = size   ? compileExpr(size.value)   : "1";
  const centerStr = center ? compileExpr(center.value) : "false";

  if (size && size.value.kind === "vector") {
    return `CrossSection.square(${sizeStr}, ${centerStr})`;
  }
  return `CrossSection.square([${sizeStr}, ${sizeStr}], ${centerStr})`;
}

function compilePolygon(args: Argument[]): string {
  const points = findArg(args, "points", 0);
  if (!points) return `CrossSection.polygon(/* missing points */)`;
  return `CrossSection.polygon(${compileExpr(points.value)})`;
}

function compileTransform(
  stmt: ModuleCallStmt,
  method: string,
): string {
  if (!stmt.child) return `/* ${method} with no child */`;

  const child = compileGeometry(stmt.child);
  const vec   = stmt.args[0];
  if (!vec) return `${child}.${method}([0, 0, 0])`;

  return `${child}.${method}(${compileExpr(vec.value)})`;
}

function compileMirror(stmt: ModuleCallStmt): string {
  if (!stmt.child) return "/* mirror with no child */";
  const child = compileGeometry(stmt.child);
  const vec   = stmt.args[0];
  if (!vec) return `${child}.mirror([1, 0, 0])`;
  return `${child}.mirror(${compileExpr(vec.value)})`;
}

function compileMultMatrix(stmt: ModuleCallStmt): string {
  if (!stmt.child) return "/* multmatrix with no child */";
  const child = compileGeometry(stmt.child);
  const mat   = stmt.args[0];
  if (!mat) return `${child}.transform(/* missing matrix */)`;
  return `${child}.transform(${compileExpr(mat.value)})`;
}

function compilePassthrough(stmt: ModuleCallStmt, tag: string): string {
  // For unsupported transforms like color, just compile the child
  if (!stmt.child) return `/* ${tag}() with no child */`;
  return `/* ${tag}(${stmt.args.map(a => compileExpr(a.value)).join(", ")}) */ ${compileGeometry(stmt.child)}`;
}

function collectChildren(stmt: ModuleCallStmt): string[] {
  if (!stmt.child) return [];
  if (stmt.child.kind === "block") {
    return stmt.child.statements
      .filter((s) => s.kind !== "empty")
      .map(compileGeometry)
      .filter(Boolean);
  }
  const g = compileGeometry(stmt.child);
  return g ? [g] : [];
}

function compileBoolOp(stmt: ModuleCallStmt, op: string): string {
  const children = collectChildren(stmt);
  if (children.length === 0) return `/* empty ${op} */`;
  if (children.length === 1) return children[0]!;
  return `Manifold.${op}([\n  ${children.join(",\n  ")}\n])`;
}

function compileDifference(stmt: ModuleCallStmt): string {
  const children = collectChildren(stmt);
  if (children.length === 0) return "/* empty difference */";
  if (children.length === 1) return children[0]!;

  const [first, ...rest] = children;
  if (rest.length === 1) {
    return `${first}.subtract(${rest[0]})`;
  }
  return `${first}.subtract(Manifold.union([\n  ${rest.join(",\n  ")}\n]))`;
}

function compileLinearExtrude(stmt: ModuleCallStmt): string {
  if (!stmt.child) return "/* linear_extrude with no child */";
  const child  = compileGeometry(stmt.child);
  const height = findArg(stmt.args, "height", 0);
  const hStr   = height ? compileExpr(height.value) : "1";

  const twist   = findArg(stmt.args, "twist");
  const slices  = findArg(stmt.args, "slices");
  const center  = findArg(stmt.args, "center");

  const opts: string[] = [];
  if (twist)  opts.push(`twist: ${compileExpr(twist.value)}`);
  if (slices) opts.push(`nDivisions: ${compileExpr(slices.value)}`);

  if (opts.length) {
    return `Manifold.extrude(${child}, ${hStr}, { ${opts.join(", ")} })`;
  }
  return `Manifold.extrude(${child}, ${hStr})`;
}

function compileRotateExtrude(stmt: ModuleCallStmt): string {
  if (!stmt.child) return "/* rotate_extrude with no child */";
  const child = compileGeometry(stmt.child);
  const fn    = findArg(stmt.args, "$fn");

  const segments = fn ? `, ${compileExpr(fn.value)}` : "";
  return `Manifold.revolve(${child}${segments})`;
}

function compileBlockGeometry(block: BlockStmt): string {
  const parts = block.statements
    .filter((s) => s.kind !== "empty")
    .map(compileGeometry)
    .filter(Boolean);
  if (parts.length === 0) return "/* empty block */";
  if (parts.length === 1) return parts[0]!;
  return `Manifold.union([\n  ${parts.join(",\n  ")}\n])`;
}

function compileForGeometry(stmt: ForStmt): string {
  return buildNestedFor(stmt.variables, 0, compileGeometry(stmt.body));
}

function buildNestedFor(vars: ForVariable[], idx: number, body: string): string {
  if (idx >= vars.length) return body;

  const v = vars[idx]!;
  const inner = buildNestedFor(vars, idx + 1, body);

  if (v.range.kind === "range") {
    const start = compileExpr(v.range.start);
    const end   = compileExpr(v.range.end);
    const step  = v.range.step ? compileExpr(v.range.step) : "1";
    return `Manifold.union((() => {\n` +
      `  const __items = [];\n` +
      `  for (let ${v.name} = ${start}; ${v.name} <= ${end}; ${v.name} += ${step}) {\n` +
      `    __items.push(${inner});\n` +
      `  }\n` +
      `  return __items;\n` +
      `})())`;
  }

  // vector iteration
  const rangeExpr = compileExpr(v.range);
  return `Manifold.union(${rangeExpr}.flatMap((${v.name}) => ${idx < vars.length - 1 ? `[${inner}]` : `[${inner}]`}))`;
}

function compileIfGeometry(stmt: IfStmt): string {
  const cond = compileExpr(stmt.condition);
  const then = compileGeometry(stmt.thenBody);
  if (stmt.elseBody) {
    const els = compileGeometry(stmt.elseBody);
    return `(${cond} ? ${then} : ${els})`;
  }
  return `(${cond} ? ${then} : new Manifold())`;
}

function compileUserModuleCall(stmt: ModuleCallStmt): string {
  const argList = stmt.args
    .map((a) =>
      a.name
        ? `/* ${a.name} = */ ${compileExpr(a.value)}`
        : compileExpr(a.value)
    )
    .join(", ");
  return `${stmt.name}(${argList})`;
}

function compileExpr(expr: Expr): string {
  switch (expr.kind) {
    case "number":
      return String(expr.value);
    case "string":
      return JSON.stringify(expr.value);
    case "boolean":
      return String(expr.value);
    case "undef":
      return "undefined";
    case "identifier":
      return expr.name;
    case "vector":
      return `[${expr.elements.map(compileExpr).join(", ")}]`;
    case "range":
      // Ranges are handled contextually
      if (expr.step) {
        return `[/* range */ ${compileExpr(expr.start)}, ${compileExpr(expr.step)}, ${compileExpr(expr.end)}]`;
      }
      return `[/* range */ ${compileExpr(expr.start)}, ${compileExpr(expr.end)}]`;
    case "binary":
      return `(${compileExpr(expr.left)} ${expr.op} ${compileExpr(expr.right)})`;
    case "unary":
      return `(${expr.op}${compileExpr(expr.operand)})`;
    case "ternary":
      return `(${compileExpr(expr.condition)} ? ${compileExpr(expr.ifTrue)} : ${compileExpr(expr.ifFalse)})`;
    case "call":
      return `${expr.name}(${expr.args.map(a => a.name ? `/* ${a.name} = */ ${compileExpr(a.value)}` : compileExpr(a.value)).join(", ")})`;
    case "index":
      return `${compileExpr(expr.object)}[${compileExpr(expr.index)}]`;
    case "member":
      return `${compileExpr(expr.object)}.${expr.property}`;
    case "group":
      return `(${compileExpr(expr.expr)})`;
  }
}

// Look up an argument by name or fall back to positional index
function findArg(
  args: Argument[],
  name: string,
  positionalIndex?: number,
): Argument | undefined {
  const named = args.find((a) => a.name === name);
  if (named) return named;
  if (positionalIndex !== undefined && positionalIndex < args.length) {
    const a = args[positionalIndex]!;
    if (!a.name) return a;
  }
  return undefined;
}