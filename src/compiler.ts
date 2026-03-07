import type {
  Program, Statement, Expr, Argument,
  ModuleCallStmt, BlockStmt, ForStmt, IfStmt,
  ForVariable, ListCompGenerator,
} from "./ast.js";

// JavaScript reserved words
const JS_RESERVED = new Set([
  "abstract", "arguments", "await", "boolean", "break", "byte", "case", "catch",
  "char", "class", "const", "continue", "debugger", "default", "delete", "do",
  "double", "else", "enum", "eval", "export", "extends", "false", "final",
  "finally", "float", "for", "function", "goto", "if", "implements", "import",
  "in", "instanceof", "int", "interface", "let", "long", "native", "new",
  "null", "package", "private", "protected", "public", "return", "short",
  "static", "super", "switch", "synchronized", "this", "throw", "throws",
  "transient", "true", "try", "typeof", "var", "void", "volatile", "while",
  "with", "yield",
]);

function escapeName(name: string): string {
  if (JS_RESERVED.has(name)) return `${name}_`;
  return name;
}

// OpenSCAD runtime (inlined into compiled output)
function getRuntime(): string {
  return `// OpenSCAD Runtime
// Type checks (OpenSCAD built-ins)
function is_undef_fn(x) { return x === undefined || x === null; }
function is_bool_fn(x) { return typeof x === "boolean"; }
function is_num_fn(x) { return typeof x === "number" && !Number.isNaN(x); }
function is_string_fn(x) { return typeof x === "string"; }
function is_list_fn(x) { return Array.isArray(x); }
function is_function_fn(x) { return typeof x === "function"; }
// is_finite, is_nan, is_int: provided by BOSL2 utility.scad; OpenSCAD builtins compiled from source.

// Trig (OpenSCAD uses degrees!)
function sin_fn(x) { return Math.sin(x * Math.PI / 180); }
function cos_fn(x) { return Math.cos(x * Math.PI / 180); }
function tan_fn(x) { return Math.tan(x * Math.PI / 180); }
function asin_fn(x) { return Math.asin(x) * 180 / Math.PI; }
function acos_fn(x) { return Math.acos(x) * 180 / Math.PI; }
function atan_fn(x) { return Math.atan(x) * 180 / Math.PI; }
function atan2_fn(y, x) { return Math.atan2(y, x) * 180 / Math.PI; }

// Math (OpenSCAD built-ins)
var abs_fn = Math.abs;
var sign_fn = Math.sign;
var floor_fn = Math.floor;
var ceil_fn = Math.ceil;
var round_fn = Math.round;
var sqrt_fn = Math.sqrt;
var exp_fn = Math.exp;
function ln_fn(x) { return Math.log(x); }
function log_fn(x) { return Math.log(x); }
function min_fn(...a) { return a.length === 1 && Array.isArray(a[0]) ? Math.min(...a[0]) : Math.min(...a); }
function max_fn(...a) { return a.length === 1 && Array.isArray(a[0]) ? Math.max(...a[0]) : Math.max(...a); }
function norm_fn(v) { return Math.sqrt(v.reduce((s, x) => s + x * x, 0)); }
function cross_fn(a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }

// String & list (OpenSCAD built-ins)
function len_fn(x) { return x == null ? undefined : x.length; }
function str_fn(...a) { return a.map(x => x === undefined ? "undef" : String(x)).join(""); }
function chr_fn(n) { return Array.isArray(n) ? n.map(c => String.fromCharCode(c)).join("") : String.fromCharCode(n); }
function ord_fn(s) { return s == null || s.length === 0 ? undefined : s.charCodeAt(0); }
function concat_fn(...a) { return [].concat(...a); }
function search_fn(needle, haystack, num_returns, idx_col) {
  if (is_string_fn(needle) && is_string_fn(haystack)) {
    var result = [];
    for (var ch of needle) {
      var indices = [];
      for (var i = 0; i < haystack.length; i++) { if (haystack[i] === ch) indices.push(i); }
      result.push(num_returns === 0 ? indices : indices.slice(0, num_returns || 1));
    }
    return num_returns === 1 || num_returns === undefined ? result.map(r => r.length > 0 ? r[0] : []) : result;
  }
  if (is_list_fn(haystack) && is_list_fn(needle)) {
    return needle.map(function(n) {
      var indices = [];
      for (var i = 0; i < haystack.length; i++) {
        var item = idx_col !== undefined ? haystack[i][idx_col] : haystack[i];
        if (__eq(item, n)) indices.push(i);
      }
      return num_returns === 0 ? indices : (indices.length > 0 ? indices[0] : []);
    });
  }
  return [];
}
function lookup_fn(key, table) {
  if (key <= table[0][0]) return table[0][1];
  if (key >= table[table.length-1][0]) return table[table.length-1][1];
  for (var i = 0; i < table.length - 1; i++) {
    if (table[i][0] <= key && key <= table[i+1][0]) {
      var t = (key - table[i][0]) / (table[i+1][0] - table[i][0]);
      return table[i][1] + t * (table[i+1][1] - table[i][1]);
    }
  }
  return undefined;
}

// Control
function openscad_assert_fn(cond, msg) { if (!cond) { console.trace("Assertion failed:", msg); throw new Error(msg || "Assertion failed"); } }
function __eq(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) { if (!__eq(a[i], b[i])) return false; }
    return true;
  }
  return false;
}
function __add(a, b) {
  if (Array.isArray(a)) {
    if (Array.isArray(b)) return a.map((x, i) => __add(x, b[i]));
    return a.map(x => __add(x, b));
  }
  if (Array.isArray(b)) return b.map(x => __add(a, x));
  return a + b;
}
function __sub(a, b) {
  if (Array.isArray(a)) {
    if (Array.isArray(b)) return a.map((x, i) => __sub(x, b[i]));
    return a.map(x => __sub(x, b));
  }
  if (Array.isArray(b)) return b.map(x => __sub(a, x));
  return a - b;
}
function __mul(a, b) {
  if (Array.isArray(a)) {
    if (Array.isArray(b)) {
      if (a.length > 0 && Array.isArray(a[0])) {
        if (b.length > 0 && Array.isArray(b[0])) {
          var res = [];
          for (var i = 0; i < a.length; i++) {
            res[i] = [];
            for (var j = 0; j < b[0].length; j++) {
              var sum = 0;
              for (var k = 0; k < a[0].length; k++) sum += a[i][k] * b[k][j];
              res[i].push(sum);
            }
          }
          return res;
        } else {
          return a.map(row => __mul(row, b));
        }
      } else {
        if (b.length > 0 && Array.isArray(b[0])) {
          var res2 = [];
          for (var j2 = 0; j2 < b[0].length; j2++) {
            var sum2 = 0;
            for (var k2 = 0; k2 < a.length; k2++) sum2 += a[k2] * b[k2][j2];
            res2.push(sum2);
          }
          return res2;
        } else {
          var sum3 = 0;
          for (var i3 = 0; i3 < Math.min(a.length, b.length); i3++) sum3 += a[i3] * b[i3];
          return sum3;
        }
      }
    }
    return a.map(x => __mul(x, b));
  }
  if (Array.isArray(b)) return b.map(x => __mul(a, x));
  return a * b;
}
function __div(a, b) {
  if (Array.isArray(a)) {
    if (Array.isArray(b)) return a.map((x, i) => __div(x, b[i]));
    return a.map(x => __div(x, b));
  }
  if (Array.isArray(b)) return b.map(x => __div(a, x));
  return a / b;
}
function __mod(a, b) {
  if (Array.isArray(a)) {
    if (Array.isArray(b)) return a.map((x, i) => __mod(x, b[i]));
    return a.map(x => __mod(x, b));
  }
  if (Array.isArray(b)) return b.map(x => __mod(a, x));
  return a % b;
}
function __neg(a) {
  if (Array.isArray(a)) return a.map(__neg);
  return -a;
}
function __pos(a) {
  if (Array.isArray(a)) return a.map(__pos);
  return +a;
}

// OpenSCAD version
function version_fn() { return [2019, 5, 0]; }
function version_num_fn() { return 20190500; }

// Constants
var PI = Math.PI;
var INF = Infinity;
var NAN = NaN;
var undef = undefined;
var _EPSILON = 1e-9;

// Children stack for module calls
var __children_stack = [];
function __with_children(fn, count, call) {
  __children_stack.push({ fn: fn, count: count });
  try {
    return call();
  } finally {
    __children_stack.pop();
  }
}

function __is_finite_matrix4(m) {
  return Array.isArray(m) &&
    m.length === 4 &&
    m.every((row) => Array.isArray(row) &&
      row.length === 4 &&
      row.every((v) => typeof v === "number" && Number.isFinite(v)));
}

// Manifold expects a flat 4x4 matrix in column-major order.
function __to_manifold_mat4(m) {
  if (Array.isArray(m) && m.length === 16 && m.every((v) => typeof v === "number" && Number.isFinite(v))) {
    return m;
  }
  if (!__is_finite_matrix4(m)) return undefined;
  const out = new Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      out[col * 4 + row] = m[row][col];
    }
  }
  return out;
}

// Guard transform() against invalid matrices produced by complex attachment math.
function __safe_transform(shape, m) {
  const mm = __to_manifold_mat4(m);
  if (!mm) return shape;
  try {
    return shape.transform(mm);
  } catch {
    return shape;
  }
}

function __identity4() {
  return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
}

// BOSL2 attachment math can occasionally emit invalid transforms or throw.
function __safe_attach_transform(...args) {
  try {
    const m = _attach_transform_fn(...args);
    return __is_finite_matrix4(m) ? m : __identity4();
  } catch {
    return __identity4();
  }
}

// 2D helpers used by offset()/projection() fallbacks.
function __safe_offset2d(shape, delta, joinType = "Round", miterLimit = 2, circularSegments = 0) {
  try {
    if (shape && typeof shape.offset === "function") {
      return shape.offset(delta, joinType, miterLimit, circularSegments);
    }
  } catch {}
  return shape;
}

function __safe_project3d(shape) {
  try {
    if (shape && typeof shape.project === "function") return shape.project();
  } catch {}
  return CrossSection.square(0);
}

// OpenSCAD iteration can target lists, strings, and occasionally scalars.
function __flat_map_iter(v, fn) {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v.flatMap(fn);
  if (typeof v === "string") return Array.from(v).flatMap(fn);
  return [v].flatMap(fn);
}

// Range expansion: convert OpenSCAD range [start:step:end] to an actual array
function __range(start, step, end) {
  var result = [];
  if (step > 0) { for (var i = start; i <= end; i += step) result.push(i); }
  else if (step < 0) { for (var i = start; i >= end; i += step) result.push(i); }
  return result;
}
// ── End Runtime ─────────────────────────────────────────────────────`;
}

// Signatures
interface Signature { params: string[]; }
const signatures = new Map<string, Signature>();

const BUILTIN_SIGNATURES: Record<string, string[]> = {
  "cube$mod": ["size", "center"],
  "cylinder$mod": ["h", "r", "r1", "r2", "d", "d1", "d2", "center", "$fn", "$fa", "$fs"],
  "sphere$mod": ["r", "d", "$fn", "$fa", "$fs"],
  "square$mod": ["size", "center"],
  "circle$mod": ["r", "d", "$fn", "$fa", "$fs"],
  "polygon$mod": ["points", "paths", "convexity"],
  "polyhedron$mod": ["points", "faces", "convexity"],
  "linear_extrude$mod": ["height", "center", "convexity", "twist", "slices", "scale", "$fn"],
  "rotate_extrude$mod": ["angle", "convexity", "$fn"],
  "text$mod": ["text", "size", "font", "halign", "valign", "spacing", "direction", "language", "script", "$fn"],
  "surface$mod": ["file", "center", "invert", "convexity"],
  "import$mod": ["file", "convexity", "layer"],
  "projection$mod": ["cut"],
  "translate$mod": ["v"],
  "rotate$mod": ["a", "v"],
  "scale$mod": ["v"],
  "resize$mod": ["newsize", "auto"],
  "mirror$mod": ["v"],
  "multmatrix$mod": ["m"],
  "color$mod": ["c", "alpha"],
  "offset$mod": ["r", "delta", "chamfer"],
};

function collectSignatures(stmts: Statement[]) {
  for (const stmt of stmts) {
    if (stmt.kind === "functionDecl" || stmt.kind === "moduleDecl") {
      const name = stmt.kind === "functionDecl" ? escapeName(stmt.name) + "_fn" : escapeName(stmt.name) + "$mod";
      signatures.set(name, { params: stmt.params.map(p => p.name) });
      if (stmt.kind === "moduleDecl" && stmt.body.kind === "block") {
        collectSignatures(stmt.body.statements);
      }
    } else if (stmt.kind === "block") {
      collectSignatures(stmt.statements);
    } else if (stmt.kind === "if") {
      if (stmt.thenBody.kind === "block") collectSignatures(stmt.thenBody.statements);
      if (stmt.elseBody && stmt.elseBody.kind === "block") collectSignatures(stmt.elseBody.statements);
    }
  }
}

function compileArgList(name: string, args: Argument[]): string {
  const sig = signatures.get(name);
  if (!sig) {
    return args.map(a => a.name ? `/* ${a.name} = */ ${compileExpr(a.value)}` : compileExpr(a.value)).join(", ");
  }

  const compiledArgs: string[] = new Array(sig.params.length).fill("undefined");
  const extraArgs: string[] = [];

  let pos = 0;
  while (pos < args.length && !args[pos].name) {
    if (pos < sig.params.length) compiledArgs[pos] = compileExpr(args[pos].value);
    else extraArgs.push(compileExpr(args[pos].value));
    pos++;
  }

  for (let i = pos; i < args.length; i++) {
    const a = args[i]!;
    if (a.name) {
      const idx = sig.params.indexOf(a.name);
      if (idx >= 0) compiledArgs[idx] = `/* ${a.name} = */ ${compileExpr(a.value)}`;
      else extraArgs.push(`/* ${a.name} = */ ${compileExpr(a.value)}`);
    } else {
      extraArgs.push(compileExpr(a.value));
    }
  }

  while (compiledArgs.length > 0 && compiledArgs[compiledArgs.length - 1] === "undefined") {
    compiledArgs.pop();
  }

  return compiledArgs.concat(extraArgs).join(", ");
}

// OpenSCAD built-in function names (separate namespace from variables)
const BUILTIN_FUNCTIONS = new Set([
  "is_undef", "is_bool", "is_num", "is_string", "is_list", "is_function",
  "sin", "cos", "tan", "asin", "acos", "atan", "atan2",
  "abs", "sign", "floor", "ceil", "round", "sqrt", "exp", "ln", "log",
  "min", "max", "norm", "cross",
  "len", "str", "chr", "ord", "concat", "search", "lookup",
  "version", "version_num",
]);

// Track $ variables that need module-level declarations for dynamic scoping
let dynamicScopeVars: Set<string> = new Set();
const localScopes: Set<string>[] = [];

function withLocalScope<T>(names: string[], fn: () => T): T {
  localScopes.push(new Set(names));
  try {
    return fn();
  } finally {
    localScopes.pop();
  }
}

function isLocalName(name: string): boolean {
  for (let i = localScopes.length - 1; i >= 0; i--) {
    if (localScopes[i]!.has(name)) return true;
  }
  return false;
}

function registerLocalCallable(name: string) {
  if (localScopes.length === 0) return;
  localScopes[localScopes.length - 1]!.add(name);
}

function collectLocalVariableNames(stmts: Statement[]): string[] {
  const names: string[] = [];
  for (const s of stmts) {
    if (s.kind === "variableDecl") {
      names.push(escapeName(s.name));
    }
  }
  return names;
}

// Main entry
export function compile(program: Program): string {
  dynamicScopeVars = new Set();
  signatures.clear();
  for (const [k, v] of Object.entries(BUILTIN_SIGNATURES)) {
    signatures.set(k, { params: v });
  }
  collectSignatures(program.statements);

  // Build declarations, deduplicating by output name (last wins, matching OpenSCAD semantics)
  const declMap = new Map<string, string>();
  const declOrder: string[] = [];
  const geometries: string[] = [];

  for (const stmt of program.statements) {
    if (
      stmt.kind === "variableDecl" ||
      stmt.kind === "moduleDecl" ||
      stmt.kind === "functionDecl"
    ) {
      // Compute the output name to detect duplicates
      let key: string;
      if (stmt.kind === "variableDecl") key = `var:${escapeName(stmt.name)}`;
      else if (stmt.kind === "moduleDecl") key = `fn:${escapeName(stmt.name)}$mod`;
      else key = `fn:${escapeName(stmt.name)}_fn`;

      if (!declMap.has(key)) declOrder.push(key);
      declMap.set(key, compileDeclaration(stmt));
    } else if (stmt.kind === "use" || stmt.kind === "include") {
      const key = `comment:${stmt.path}`;
      if (!declMap.has(key)) declOrder.push(key);
      declMap.set(key, `// ${stmt.kind} <${stmt.path}>`);
    } else {
      const geo = compileGeometry(stmt);
      if (geo) geometries.push(geo);
    }
  }

  const declarations = declOrder.map(k => declMap.get(k)!);

  let output = `import Module from "manifold-3d";\nconst wasm = await Module();\nwasm.setup();\nconst { Manifold, CrossSection } = wasm;\n\n`;

  // Inline the OpenSCAD runtime
  output += getRuntime() + "\n\n";

  if (declarations.length) {
    output += declarations.join("\n") + "\n\n";
  }

  if (geometries.length === 0) {
    output += "// (no geometry)";
  }
  // Add minimum special variables
  output += `var $fn = 0, $fa = 12, $fs = 2;\n`;
  output += `var $vpr = [0, 0, 0], $vpt = [0, 0, 0], $vpd = 500;\n`;
  output += `var $parent_modules = 0;\n`;

  // Declare any $ variables that were only set inside modules/blocks
  const topLevelVarKeys = new Set(declOrder.filter(k => k.startsWith("var:")).map(k => k.slice(4)));
  for (const v of dynamicScopeVars) {
    if (!topLevelVarKeys.has(v)) {
      output += `var ${v};\n`;
    }
  }

  // Provide a global container for user variables and helpers
  output += `var _NO_ARG = Symbol("NO_ARG");\n`;

  if (geometries.length === 1) {
    output += `export const result = ${geometries[0]};`;
  } else {
    output += `export const result = Manifold.union([\n  ${geometries.join(",\n  ")}\n]);`;
  }

  return output;
}

// Declarations
function compileDeclaration(stmt: Statement): string {
  switch (stmt.kind) {
    case "variableDecl":
      return `var ${escapeName(stmt.name)} = ${compileExpr(stmt.value)};`;

    case "moduleDecl": {
      const params = compileParams(stmt.params);
      const localParams = deduplicateParams(stmt.params).map(p => escapeName(p.name));
      const body = compileModuleBody(stmt.body, stmt.name, localParams);
      return `function ${escapeName(stmt.name)}$mod(${params}) {\n${body}\n}`;
    }

    case "functionDecl": {
      const params = compileParams(stmt.params);
      const localParams = deduplicateParams(stmt.params).map(p => escapeName(p.name));
      const bodyExpr = withLocalScope(localParams, () => compileExpr(stmt.body));
      return `function ${escapeName(stmt.name)}_fn(${params}) {\n  return ${bodyExpr};\n}`;
    }

    default:
      return `/* unsupported declaration: ${(stmt as Statement).kind} */`;
  }
}

// Deduplicate parameters: keep last occurrence of each name (OpenSCAD allows duplicates)
function deduplicateParams(params: import("./ast.js").Parameter[]): import("./ast.js").Parameter[] {
  const seen = new Map<string, number>();
  for (let i = 0; i < params.length; i++) {
    seen.set(params[i].name, i);
  }
  return params.filter((p, i) => seen.get(p.name) === i);
}

function compileParams(params: import("./ast.js").Parameter[]): string {
  return deduplicateParams(params)
    .map((p) =>
      p.defaultValue
        ? `${escapeName(p.name)} = ${compileExpr(p.defaultValue)}`
        : escapeName(p.name)
    )
    .join(", ");
}

// Module body compilation
function compileModuleBody(body: Statement, moduleName?: string, localParamNames: string[] = []): string {
  const stmts = body.kind === "block" ? body.statements : [body];
  const localVarNames = collectLocalVariableNames(stmts);

  const lines: string[] = [];
  const geoExprs: string[] = [];

  // Capture children from the stack at the start of every module body
  lines.push("  var __c = __children_stack.length > 0 ? __children_stack[__children_stack.length - 1] : { fn: undefined, count: 0 };");
  lines.push("  var $children = __c.count;");
  lines.push("  function children(i) { return __c.fn ? __c.fn(i) : Manifold.union([]); }");

  const dollarSaves: string[] = [];
  const dollarRestores: string[] = [];

  withLocalScope([...localParamNames, ...localVarNames], () => {
    for (const s of stmts) {
      if (s.kind === "empty") continue;
      if (s.kind === "variableDecl") {
        const name = escapeName(s.name);
        const valueExpr = compileExpr(s.value);
        if (s.name.startsWith("$") && s.name !== "$children") {
          // Dynamic scoping: save/assign/restore for $ variables
          dynamicScopeVars.add(name);
          dollarSaves.push(`  var __save_${name} = ${name};`);
          lines.push(`  ${name} = ${valueExpr};`);
          dollarRestores.push(`  ${name} = __save_${name};`);
        } else {
          lines.push(`  var ${name} = ${valueExpr};`);
        }
      } else if (s.kind === "functionDecl" || s.kind === "moduleDecl") {
        // Indent the nested declaration
        const decl = compileDeclaration(s);
        lines.push("  " + decl.split("\n").join("\n  "));
      } else {
        const geo = compileGeometry(s);
        if (geo) geoExprs.push(geo);
      }
    }
  });

  let result: string;
  if (geoExprs.length === 0) {
    result = "Manifold.union([])";
  } else if (geoExprs.length === 1) {
    result = geoExprs[0];
  } else {
    result = `Manifold.union([\n    ${geoExprs.join(",\n    ")}\n  ])`;
  }

  if (moduleName === "attachable") {
    result = `(() => {\n` +
      `    const __out = ${result};\n` +
      `    try {\n` +
      `      const __mesh = __out.getMesh({});\n` +
      `      if (__mesh.numVert === 0 || __mesh.numTri === 0) {\n` +
      `        return children(0);\n` +
      `      }\n` +
      `    } catch {}\n` +
      `    return __out;\n` +
      `  })()`;
  }

  if (dollarRestores.length > 0) {
    // Insert saves at the beginning (after children setup)
    lines.splice(3, 0, ...dollarSaves);
    lines.push(`  try {`);
    lines.push(`    return ${result};`);
    lines.push(`  } finally {`);
    lines.push(...dollarRestores.map(r => `  ${r}`));
    lines.push(`  }`);
  } else {
    lines.push(`  return ${result};`);
  }
  return lines.join("\n");
}

// Geometry compilation
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
      // Standalone declarations in geometry context are handled by
      // compileBlockGeometry and compileModuleBody. If we get here,
      // it means a declaration appeared outside a block (unusual).
      return "";
    case "use":
    case "include":
      return "";
    default:
      return `/* unsupported: ${(stmt as Statement).kind} */`;
  }
}

// Module call dispatch
function compileModuleCall(stmt: ModuleCallStmt): string {
  switch (stmt.name) {
    // Primitives
    case "cube": return compileCube(stmt.args);
    case "sphere": return compileSphere(stmt.args);
    case "cylinder": return compileCylinder(stmt.args);
    case "circle": return compileCircle(stmt.args);
    case "square": return compileSquare(stmt.args);
    case "polygon": return compilePolygon(stmt.args);
    case "polyhedron": return compilePolyhedron(stmt.args);
    case "text": return compileText(stmt.args);

    // Transforms
    case "translate": return compileTransform(stmt, "translate");
    case "rotate": return compileTransform(stmt, "rotate");
    case "scale": return compileTransform(stmt, "scale");
    case "mirror": return compileMirror(stmt);
    case "multmatrix": return compileMultMatrix(stmt);
    case "resize": return compilePassthrough(stmt, "resize");
    case "offset": return compileOffset(stmt);
    case "color": return compilePassthrough(stmt, "color");
    case "render": return compilePassthrough(stmt, "render");
    case "projection": return compileProjection(stmt);

    // Boolean operations
    case "union": return compileBoolOp(stmt, "union");
    case "difference": return compileDifference(stmt);
    case "intersection": return compileBoolOp(stmt, "intersection");
    case "hull": return compileBoolOp(stmt, "hull");
    case "minkowski": return compileMinkowski(stmt);

    // Extrusion
    case "linear_extrude": return compileLinearExtrude(stmt);
    case "rotate_extrude": return compileRotateExtrude(stmt);

    // Built-in statement modifiers
    case "echo": return compileEchoModule(stmt);
    case "assert": return compileAssertModule(stmt);
    case "let": return compileLetModule(stmt);
    case "children": return compileChildrenModule(stmt);

    default:
      return compileUserModuleCall(stmt);
  }
}

// Built-in module helpers
function compileEchoModule(stmt: ModuleCallStmt): string {
  const args = stmt.args.map(a =>
    a.name ? `"${a.name} = ", ${compileExpr(a.value)}` : compileExpr(a.value)
  ).join(", ");
  if (stmt.child && stmt.child.kind !== "empty") {
    const child = compileGeometry(stmt.child);
    return `(console.log(${args}), ${child || "Manifold.union([])"})`;
  }
  return `(console.log(${args}), Manifold.union([]))`;
}

function compileAssertModule(stmt: ModuleCallStmt): string {
  const condition = stmt.args[0] ? compileExpr(stmt.args[0].value) : "true";
  const message = stmt.args[1] ? compileExpr(stmt.args[1].value) : '"Assertion failed"';
  if (stmt.child && stmt.child.kind !== "empty") {
    const child = compileGeometry(stmt.child);
    return `(openscad_assert_fn(${condition}, ${message}), ${child || "Manifold.union([])"})`;
  }
  return `(openscad_assert_fn(${condition}, ${message}), Manifold.union([]))`;
}

function compileLetModule(stmt: ModuleCallStmt): string {
  let child = "Manifold.union([])";
  if (stmt.child && stmt.child.kind !== "empty") {
    child = compileGeometry(stmt.child) || child;
  }
  let result = child;
  for (let i = stmt.args.length - 1; i >= 0; i--) {
    const a = stmt.args[i]!;
    const name = a.name ? escapeName(a.name) : "_";
    result = `((${name}) => (${result}))(${compileExpr(a.value)})`;
  }
  return result;
}

function compileChildrenModule(stmt: ModuleCallStmt): string {
  if (stmt.args.length > 0) {
    return `children(${compileExpr(stmt.args[0].value)})`;
  }
  return `children()`;
}

// Primitive compilation

function compileCube(args: Argument[]): string {
  const size = findArg(args, "size", 0);
  const center = findArg(args, "center", 1);

  const sizeStr = size ? compileExpr(size.value) : "1";
  const centerStr = center ? compileExpr(center.value) : "false";

  // `size` can be a scalar or a runtime vector expression.
  return `((__s) => Manifold.cube((is_list_fn(__s) ? __s : [__s, __s, __s]), ${centerStr}))(${sizeStr})`;
}

function compileSphere(args: Argument[]): string {
  const r = findArg(args, "r", 0);
  const d = findArg(args, "d");
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
  const h = findArg(args, "h", 0);
  const r = findArg(args, "r", 1);
  const r1 = findArg(args, "r1");
  const r2 = findArg(args, "r2");
  const d = findArg(args, "d");
  const d1 = findArg(args, "d1");
  const d2 = findArg(args, "d2");
  const center = findArg(args, "center");
  const fn = findArg(args, "$fn");

  const hStr = h ? compileExpr(h.value) : "1";

  let rLow: string, rHigh: string;
  if (d1 && d2) {
    rLow = `(${compileExpr(d1.value)}) / 2`;
    rHigh = `(${compileExpr(d2.value)}) / 2`;
  } else if (r1 && r2) {
    rLow = compileExpr(r1.value);
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
  const r = findArg(args, "r", 0);
  const d = findArg(args, "d");
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
  const size = findArg(args, "size", 0);
  const center = findArg(args, "center", 1);

  const sizeStr = size ? compileExpr(size.value) : "1";
  const centerStr = center ? compileExpr(center.value) : "false";

  // `size` can be a scalar or a runtime vector expression.
  return `((__s) => CrossSection.square((is_list_fn(__s) ? __s : [__s, __s]), ${centerStr}))(${sizeStr})`;
}

function compilePolygon(args: Argument[]): string {
  const points = findArg(args, "points", 0);
  if (!points) return `CrossSection.ofPolygons(/* missing points */[])`;
  return `CrossSection.ofPolygons(${compileExpr(points.value)})`;
}

function compileText(args: Argument[]): string {
  const textArg = findArg(args, "text", 0);
  const sizeArg = findArg(args, "size", 1);
  const txt = textArg ? compileExpr(textArg.value) : `""`;
  const size = sizeArg ? compileExpr(sizeArg.value) : "10";

  // Manifold doesn't expose font text primitives; approximate with a sized box.
  return `((__t, __s) => CrossSection.square([Math.max(0.001, len_fn(str_fn(__t)) * __s * 0.6), Math.max(0.001, __s)], false))(${txt}, ${size})`;
}

function compilePolyhedron(args: Argument[]): string {
  const points = findArg(args, "points", 0);
  const faces = findArg(args, "faces", 1);
  if (!points || !faces) return `/* polyhedron: missing points or faces */`;
  return `new Manifold(new wasm.Mesh({ numProp: 3, vertProperties: new Float32Array(${compileExpr(points.value)}.flat()), triVerts: new Uint32Array(${compileExpr(faces.value)}.flat()) }))`;
}

// Transforms
function compileTransform(
  stmt: ModuleCallStmt,
  method: string,
): string {
  if (!stmt.child) return `/* ${method} with no child */`;

  const child = compileGeometry(stmt.child);
  const vec = stmt.args[0];
  if (!vec) return `${child}.${method}([0, 0, 0])`;

  return `${child}.${method}(${compileExpr(vec.value)})`;
}

function compileMirror(stmt: ModuleCallStmt): string {
  if (!stmt.child) return "/* mirror with no child */";
  const child = compileGeometry(stmt.child);
  const vec = stmt.args[0];
  if (!vec) return `${child}.mirror([1, 0, 0])`;
  return `${child}.mirror(${compileExpr(vec.value)})`;
}

function compileMultMatrix(stmt: ModuleCallStmt): string {
  if (!stmt.child) return "/* multmatrix with no child */";
  const child = compileGeometry(stmt.child);
  const mat = stmt.args[0];
  if (!mat) return `${child}`;
  return `__safe_transform(${child}, ${compileExpr(mat.value)})`;
}

function compilePassthrough(stmt: ModuleCallStmt, tag: string): string {
  if (!stmt.child) return `/* ${tag}() with no child */`;
  return `/* ${tag}(${stmt.args.map(a => compileExpr(a.value)).join(", ")}) */ ${compileGeometry(stmt.child)}`;
}

function compileOffset(stmt: ModuleCallStmt): string {
  if (!stmt.child) return "/* offset() with no child */";
  const child = compileGeometry(stmt.child);
  const r = findArg(stmt.args, "r", 0);
  const delta = findArg(stmt.args, "delta");
  const amount = r ?? delta;
  const amt = amount ? compileExpr(amount.value) : "0";
  return `__safe_offset2d(${child}, ${amt})`;
}

function compileProjection(stmt: ModuleCallStmt): string {
  if (!stmt.child) return "/* projection() with no child */";
  const child = compileGeometry(stmt.child);
  // Projection is 2D in OpenSCAD; emit a thin manifold so geometry pipelines remain 3D-safe.
  return `Manifold.extrude(__safe_project3d(${child}), 0.001, 0, 0, [1, 1], true)`;
}

// Boolean / collection 
function collectChildren(stmt: ModuleCallStmt): string[] {
  if (!stmt.child) return [];
  if (stmt.child.kind === "block") {
    return compileBlockStatements(stmt.child.statements);
  }
  const g = compileGeometry(stmt.child);
  return g ? [g] : [];
}

// Compile a mixed list of statements, separating declarations into an IIFE wrapper when needed.
function compileBlockStatements(stmts: Statement[]): string[] {
  const decls: string[] = [];
  const geos: string[] = [];

  for (const s of stmts) {
    if (s.kind === "empty") continue;
    if (s.kind === "variableDecl") {
      decls.push(`var ${escapeName(s.name)} = ${compileExpr(s.value)};`);
    } else if (s.kind === "functionDecl" || s.kind === "moduleDecl") {
      decls.push(compileDeclaration(s));
    } else {
      const g = compileGeometry(s);
      if (g) geos.push(g);
    }
  }

  // If there are declarations, wrap the whole thing into a single IIFE
  if (decls.length > 0 && geos.length > 0) {
    const result = geos.length === 1
      ? geos[0]
      : `Manifold.union([\n    ${geos.join(",\n    ")}\n  ])`;
    return [`(() => {\n  ${decls.join("\n  ")}\n  return ${result};\n})()`];
  }

  return geos;
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

function compileMinkowski(stmt: ModuleCallStmt): string {
  const children = collectChildren(stmt);
  if (children.length === 0) return "/* empty minkowski */";
  if (children.length === 1) return children[0]!;
  // Approximation: convex hull of inputs. Better than plain union for rounded-like intent.
  return `Manifold.hull([\n  ${children.join(",\n  ")}\n])`;
}

function compileLinearExtrude(stmt: ModuleCallStmt): string {
  if (!stmt.child) return "/* linear_extrude with no child */";
  const child = compileGeometry(stmt.child);
  const height = findArg(stmt.args, "height", 0);
  const hStr = height ? compileExpr(height.value) : "1";

  const twist = findArg(stmt.args, "twist");
  const slices = findArg(stmt.args, "slices");

  const opts: string[] = [];
  if (twist) opts.push(`twist: ${compileExpr(twist.value)}`);
  if (slices) opts.push(`nDivisions: ${compileExpr(slices.value)}`);

  if (opts.length) {
    return `Manifold.extrude(${child}, ${hStr}, { ${opts.join(", ")} })`;
  }
  return `Manifold.extrude(${child}, ${hStr})`;
}

function compileRotateExtrude(stmt: ModuleCallStmt): string {
  if (!stmt.child) return "/* rotate_extrude with no child */";
  const child = compileGeometry(stmt.child);
  const fn = findArg(stmt.args, "$fn");

  const segments = fn ? `, ${compileExpr(fn.value)}` : "";
  return `Manifold.revolve(${child}${segments})`;
}

// Block geometry 
function compileBlockGeometry(block: BlockStmt): string {
  const items: { kind: "var" | "dollar" | "func" | "geo"; name?: string; code: string }[] = [];
  const localVarNames = collectLocalVariableNames(block.statements);

  withLocalScope(localVarNames, () => {
    for (const s of block.statements) {
      if (s.kind === "empty") continue;
      if (s.kind === "variableDecl") {
        const name = escapeName(s.name);
        const code = compileExpr(s.value);
        if (s.name.startsWith("$")) {
          dynamicScopeVars.add(name);
          items.push({ kind: "dollar", name, code });
        } else {
          items.push({ kind: "var", name, code });
        }
      } else if (s.kind === "functionDecl" || s.kind === "moduleDecl") {
        items.push({ kind: "func", code: compileDeclaration(s) });
      } else {
        const g = compileGeometry(s);
        if (g) items.push({ kind: "geo", code: g });
      }
    }
  });

  // Collect geometry expressions
  const geos = items.filter(i => i.kind === "geo").map(i => i.code);
  const result =
    geos.length === 0 ? "Manifold.union([])"
      : geos.length === 1 ? geos[0]!
        : `Manifold.union([\n  ${geos.join(",\n  ")}\n])`;

  // Collect declarations (var, dollar, func) in order
  const decls = items.filter(i => i.kind !== "geo");
  if (decls.length === 0) return result;

  // Build inside-out: start with result, wrap with declarations from last to first.
  // This implements OpenSCAD's cascading let semantics correctly:
  // - Regular vars: ((name) => body)(expr) — captures outer value, no var hoisting issues
  // - $ vars: save/assign/try-finally — dynamic scoping across function calls
  // - func decls: wrapped in IIFE with the remaining body
  let body = result;

  for (let i = decls.length - 1; i >= 0; i--) {
    const d = decls[i]!;
    if (d.kind === "var") {
      body = `((${d.name}) => (${body}))(${d.code})`;
    } else if (d.kind === "dollar") {
      body = `(() => { var __save_${d.name} = ${d.name}; ${d.name} = ${d.code}; try { return ${body}; } finally { ${d.name} = __save_${d.name}; } })()`;
    } else {
      // Function/module declaration: wrap remaining body in IIFE with the declaration
      body = `(() => {\n  ${d.code}\n  return ${body};\n})()`;
    }
  }

  return body;
}

// For / If geometry
function compileForGeometry(stmt: ForStmt): string {
  return buildNestedFor(stmt.variables, 0, compileGeometry(stmt.body));
}

function buildNestedFor(vars: ForVariable[], idx: number, body: string): string {
  if (idx >= vars.length) return body;

  const v = vars[idx]!;
  const inner = buildNestedFor(vars, idx + 1, body);

  if (v.range.kind === "range") {
    const start = compileExpr(v.range.start);
    const end = compileExpr(v.range.end);
    const step = v.range.step ? compileExpr(v.range.step) : "1";
    return `Manifold.union((() => {\n` +
      `  const __items = [];\n` +
      `  for (let ${escapeName(v.name)} = ${start}; ${escapeName(v.name)} <= ${end}; ${escapeName(v.name)} += ${step}) {\n` +
      `    __items.push(${inner});\n` +
      `  }\n` +
      `  return __items;\n` +
      `})())`;
  }

  // vector iteration
  const rangeExpr = compileExpr(v.range);
  return `Manifold.union(__flat_map_iter(${rangeExpr}, (${escapeName(v.name)}) => [${inner}]))`;
}

function compileIfGeometry(stmt: IfStmt): string {
  const cond = compileExpr(stmt.condition);
  const then = compileGeometry(stmt.thenBody);
  if (stmt.elseBody) {
    const els = compileGeometry(stmt.elseBody);
    return `(${cond} ? ${then} : ${els})`;
  }
  return `(${cond} ? ${then} : Manifold.union([]))`;
}

// User module call
function compileUserModuleCall(stmt: ModuleCallStmt): string {
  const name = `${escapeName(stmt.name)}$mod`;
  const argList = compileArgList(name, stmt.args);

  let childCount = 0;
  let childFn = "() => Manifold.union([])";

  if (stmt.child && stmt.child.kind !== "empty") {
    const children = collectChildren(stmt);
    childCount = children.length;
    if (childCount > 0) {
      const indexedCases = children
        .map((child, idx) => `if (i === ${idx}) return ${child};`)
        .join(" ");
      childFn =
        `(i) => { ` +
        `if (i === undefined) return Manifold.union([\n  ${children.join(",\n  ")}\n]); ` +
        `${indexedCases} ` +
        `return Manifold.union([]); ` +
        `}`;
    }
  }

  return `__with_children(${childFn}, ${childCount}, () => ${name}(${argList}))`;
}

// Expression compilation
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
      // $children stays as $children (the count variable set in module body)
      if (expr.name === "$children") return "$children";
      return escapeName(expr.name);
    case "vector":
      return `[${expr.elements.map(compileExpr).join(", ")}]`;
    case "range":
      if (expr.step) {
        return `__range(${compileExpr(expr.start)}, ${compileExpr(expr.step)}, ${compileExpr(expr.end)})`;
      }
      return `__range(${compileExpr(expr.start)}, 1, ${compileExpr(expr.end)})`;
    case "binary":
      if (expr.op === "^") {
        return `Math.pow(${compileExpr(expr.left)}, ${compileExpr(expr.right)})`;
      }
      if (expr.op === "==") {
        return `__eq(${compileExpr(expr.left)}, ${compileExpr(expr.right)})`;
      }
      if (expr.op === "!=") {
        return `(!__eq(${compileExpr(expr.left)}, ${compileExpr(expr.right)}))`;
      }
      if (expr.op === "+") return `__add(${compileExpr(expr.left)}, ${compileExpr(expr.right)})`;
      if (expr.op === "-") return `__sub(${compileExpr(expr.left)}, ${compileExpr(expr.right)})`;
      if (expr.op === "*") return `__mul(${compileExpr(expr.left)}, ${compileExpr(expr.right)})`;
      if (expr.op === "/") return `__div(${compileExpr(expr.left)}, ${compileExpr(expr.right)})`;
      if (expr.op === "%") return `__mod(${compileExpr(expr.left)}, ${compileExpr(expr.right)})`;
      return `(${compileExpr(expr.left)} ${expr.op} ${compileExpr(expr.right)})`;
    case "unary":
      if (expr.op === "-") return `__neg(${compileExpr(expr.operand)})`;
      if (expr.op === "+") return `__pos(${compileExpr(expr.operand)})`;
      return `(${expr.op}${compileExpr(expr.operand)})`;
    case "ternary": {
      let ifTrue = compileExpr(expr.ifTrue);
      let ifFalse = compileExpr(expr.ifFalse);
      const trueSpread = ifTrue.startsWith("...");
      const falseSpread = ifFalse.startsWith("...");
      if (trueSpread || falseSpread) {
        if (trueSpread) ifTrue = ifTrue.slice(3); else ifTrue = `[${ifTrue}]`;
        if (falseSpread) ifFalse = ifFalse.slice(3); else ifFalse = `[${ifFalse}]`;
        return `...(${compileExpr(expr.condition)} ? ${ifTrue} : ${ifFalse})`;
      }
      return `(${compileExpr(expr.condition)} ? ${ifTrue} : ${ifFalse})`;
    }
    case "call":
      return compileCallExpr(expr);
    case "index":
      return `${compileExpr(expr.object)}[${compileExpr(expr.index)}]`;
    case "member": {
      const memberMap: Record<string, string> = { x: "0", y: "1", z: "2" };
      const idx = memberMap[expr.property];
      if (idx !== undefined) {
        return `${compileExpr(expr.object)}[${idx}]`;
      }
      return `${compileExpr(expr.object)}.${expr.property}`;
    }
    case "group": {
      const inner = compileExpr(expr.expr);
      if (inner.startsWith("...")) return inner;  // Don't wrap spread in parens
      return `(${inner})`;
    }
    case "echo": {
      const eArgs = expr.args.map(a =>
        a.name ? `"${a.name} = ", ${compileExpr(a.value)}` : compileExpr(a.value)
      ).join(", ");
      return `(console.log(${eArgs}), ${compileExpr(expr.expr)})`;
    }
    case "assert": {
      const condition = expr.args[0] ? compileExpr(expr.args[0].value) : "true";
      const message = expr.args[1] ? compileExpr(expr.args[1].value) : '"Assertion failed"';
      return `(openscad_assert_fn(${condition}, ${message}), ${compileExpr(expr.expr)})`;
    }
    case "let": {
      const localAssignNames = expr.assignments.map(a => escapeName(a.name));
      return withLocalScope(localAssignNames, () => {
        let result = compileExpr(expr.body);
        for (let i = expr.assignments.length - 1; i >= 0; i--) {
          const a = expr.assignments[i]!;
          result = `((${escapeName(a.name)}) => (${result}))(${compileExpr(a.value)})`;
        }
        return result;
      });
    }
    case "each": {
      const inner = compileExpr(expr.expr);
      if (inner.startsWith("...")) return inner;
      return `...${inner}`;
    }
    case "lambda": {
      const params = expr.params.map(p => p.defaultValue ? `${escapeName(p.name)} = ${compileExpr(p.defaultValue)}` : escapeName(p.name)).join(", ");
      const localParams = expr.params.map(p => escapeName(p.name));
      const bodyExpr = withLocalScope(localParams, () => compileExpr(expr.body));
      return `(${params}) => ${bodyExpr}`;
    }
    case "listComp": {
      // The generator now always returns an array. Since listComp is always an element of a vector, we must spread its result so the elements are spliced properly.
      return `...(${compileListComp(expr.generator)})`;
    }
    case "dynCall": {
      const callee = compileExpr(expr.callee);
      const args = expr.args.map(a => a.name ? `/* ${a.name} = */ ${compileExpr(a.value)}` : compileExpr(a.value)).join(", ");
      return `(${callee})(${args})`;
    }
    default:
      return `/* unsupported expr: ${(expr as Expr).kind} */`;
  }
}

function compileCallExpr(expr: { kind: "call"; name: string; args: Argument[] }): string {
  const escaped = escapeName(expr.name);
  const isKnownFunction = BUILTIN_FUNCTIONS.has(expr.name) || signatures.has(`${escaped}_fn`);
  const name = (!isKnownFunction && isLocalName(escaped)) ? escaped : `${escaped}_fn`;
  const argList = compileArgList(name, expr.args);
  if (name === "_attach_transform_fn") {
    return `__safe_attach_transform(${argList})`;
  }
  return `${name}(${argList})`;
}

// List comprehension
function compileListComp(gen: ListCompGenerator): string {
  switch (gen.kind) {
    case "lcFor": {
      let result = compileListComp(gen.body);
      for (let i = gen.variables.length - 1; i >= 0; i--) {
        const v = gen.variables[i]!;
        const vName = escapeName(v.name);
        if (v.range.kind === "range") {
          const start = compileExpr(v.range.start);
          const end = compileExpr(v.range.end);
          const step = v.range.step ? compileExpr(v.range.step) : "1";
          result = `(() => { const __r = []; for (let ${vName} = ${start}; ${vName} <= ${end}; ${vName} += ${step}) __r.push(...(${result})); return __r; })()`;
        } else {
          result = `__flat_map_iter(${compileExpr(v.range)}, (${vName}) => ${result})`;
        }
      }
      return result;
    }
    case "lcIf": {
      const cond = compileExpr(gen.condition);
      let ifTrue = compileListComp(gen.ifTrue);
      let ifFalse = gen.ifFalse ? compileListComp(gen.ifFalse) : "[]";
      // Both branches are now guaranteed to evaluate to an array.
      return `(${cond} ? ${ifTrue} : ${ifFalse})`;
    }
    case "lcLet": {
      let result = compileListComp(gen.body);
      for (let i = gen.assignments.length - 1; i >= 0; i--) {
        const a = gen.assignments[i]!;
        result = `((${escapeName(a.name)}) => (${result}))(${compileExpr(a.value)})`;
      }
      return result;
    }
    case "lcExpr": {
      const expr = compileExpr(gen.expr);
      if (expr.startsWith("...")) {
        return `[${expr}]`;
      }
      return `[${expr}]`;
    }
    case "lcCFor": {
      const inits = gen.inits.map(a => `${escapeName(a.name)} = ${compileExpr(a.value)}`).join(", ");
      const cond = compileExpr(gen.condition);
      const updates = gen.updates.map(a => `${escapeName(a.name)} = ${compileExpr(a.value)}`).join(", ");
      const inner = compileListComp(gen.body);
      return `(() => { const __r = []; for (let ${inits}; ${cond}; ${updates}) __r.push(${inner}); return __r; })()`;
    }
  }
}

// Argument lookup
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
