import * as __rt from "./runtime.js";
const { Manifold, CrossSection, wasm, is_undef_fn, is_bool_fn, is_num_fn, is_string_fn, is_list_fn, is_function_fn, sin_fn, cos_fn, tan_fn, asin_fn, acos_fn, atan_fn, atan2_fn, abs_fn, sign_fn, floor_fn, ceil_fn, round_fn, sqrt_fn, exp_fn, ln_fn, log_fn, min_fn, max_fn, norm_fn, cross_fn, len_fn, str_fn, chr_fn, ord_fn, concat_fn, search_fn, lookup_fn, openscad_assert_fn, __eq, __add, __sub, __mul, __div, __mod, __neg, __pos, version_fn, version_num_fn, __children_stack, __with_children, __is_finite_matrix4, __to_manifold_mat4, __safe_transform, __identity4, __safe_attach_transform, __safe_offset2d, __safe_project3d, __apply_color, __flat_map_iter, __range, __union2d3d, __difference2d3d, __intersection2d3d, __hull2d3d, __minkowski2d3d } = __rt;
var PI = __rt.PI;
var INF = __rt.INF;
var NAN = __rt.NAN;
var undef = __rt.undef;
var _EPSILON = __rt._EPSILON;

function leg$mod(h = 40, r = 3) {
  var __c = __children_stack.length > 0 ? __children_stack[__children_stack.length - 1] : { fn: undefined, count: 0 };
  var $children = __c.count;
  function children(i) { return __c.fn ? __c.fn(i) : Manifold.union([]); }
  return Manifold.cylinder(h, r, r, 32);
}
function table$mod(w = 80, d = 50, h = 40, top_t = 3) {
  var __c = __children_stack.length > 0 ? __children_stack[__children_stack.length - 1] : { fn: undefined, count: 0 };
  var $children = __c.count;
  function children(i) { return __c.fn ? __c.fn(i) : Manifold.union([]); }
  return __union2d3d([
    ((__s) => Manifold.cube((is_list_fn(__s) ? __s : [__s, __s, __s]), false))([w, d, top_t]).translate([0, 0, h]),
    __union2d3d(__flat_map_iter([0, __sub(w, 6)], (x) => [__union2d3d(__flat_map_iter([0, __sub(d, 6)], (y) => [((h) => (((r) => (Manifold.cylinder(h, r, r, 32)))(3)))(h).translate([__add(x, 3), __add(y, 3), 0])]))]))
  ]);
}

var $fn = 0, $fa = 12, $fs = 2;
var $vpr = [0, 0, 0], $vpt = [0, 0, 0], $vpd = 500;
var $parent_modules = 0;
var _NO_ARG = Symbol("NO_ARG");
export const result = ((w) => (((d) => (((h) => (((top_t) => (__union2d3d([
  ((__s) => Manifold.cube((is_list_fn(__s) ? __s : [__s, __s, __s]), false))([w, d, top_t]).translate([0, 0, h]),
  __union2d3d(__flat_map_iter([0, __sub(w, 6)], (x) => [__union2d3d(__flat_map_iter([0, __sub(d, 6)], (y) => [((h) => (((r) => (Manifold.cylinder(h, r, r, 32)))(3)))(h).translate([__add(x, 3), __add(y, 3), 0])]))]))
])))(3)))(40)))(50)))(80);