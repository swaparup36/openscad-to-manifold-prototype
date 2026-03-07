import Module from "manifold-3d";
const wasm = await Module();
wasm.setup();
const { Manifold, CrossSection } = wasm;

// OpenSCAD Runtime
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
// ── End Runtime ─────────────────────────────────────────────────────

var $fn = 48;

var $fn = 0, $fa = 12, $fs = 2;
var $vpr = [0, 0, 0], $vpt = [0, 0, 0], $vpd = 500;
var $parent_modules = 0;
var _NO_ARG = Symbol("NO_ARG");
export const result = Manifold.union([
  Manifold.sphere(20),
  Manifold.cylinder(60, 5, 5, 0, true).rotate([0, 90, 0]),
  Manifold.cylinder(15, 12, 2).translate([0, 0, 18])
]);