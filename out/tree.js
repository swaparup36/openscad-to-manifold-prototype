import * as __rt from "./runtime.js";
const { Manifold, CrossSection, wasm, is_undef_fn, is_bool_fn, is_num_fn, is_string_fn, is_list_fn, is_function_fn, sin_fn, cos_fn, tan_fn, asin_fn, acos_fn, atan_fn, atan2_fn, abs_fn, sign_fn, floor_fn, ceil_fn, round_fn, sqrt_fn, exp_fn, ln_fn, log_fn, min_fn, max_fn, norm_fn, cross_fn, len_fn, str_fn, chr_fn, ord_fn, concat_fn, search_fn, lookup_fn, openscad_assert_fn, __eq, __add, __sub, __mul, __div, __mod, __neg, __pos, version_fn, version_num_fn, __children_stack, __with_children, __is_finite_matrix4, __to_manifold_mat4, __safe_transform, __identity4, __safe_attach_transform, __safe_offset2d, __safe_project3d, __apply_color, __flat_map_iter, __range, __union2d3d, __difference2d3d, __intersection2d3d, __hull2d3d, __minkowski2d3d } = __rt;
var PI = __rt.PI;
var INF = __rt.INF;
var NAN = __rt.NAN;
var undef = __rt.undef;
var _EPSILON = __rt._EPSILON;

function simple_tree$mod(size, dna, n) {
  var __c = __children_stack.length > 0 ? __children_stack[__children_stack.length - 1] : { fn: undefined, count: 0 };
  var $children = __c.count;
  function children(i) { return __c.fn ? __c.fn(i) : Manifold.union([]); }
  return ((n > 0) ? __union2d3d([
  Manifold.cylinder(size, __div(size, 10), __div(size, 12), 24),
  __union2d3d(__flat_map_iter(dna, (bd) => [((angx) => (((angz) => (((scal) => (((size) => (((dna) => (((n) => (((n > 0) ? __union2d3d([
  Manifold.cylinder(size, __div(size, 10), __div(size, 12), 24),
  __union2d3d(__flat_map_iter(dna, (bd) => [((angx) => (((angz) => (((scal) => (__with_children(() => Manifold.union([]), 0, () => simple_tree$mod(__mul(scal, size), dna, __sub(n, 1))).rotate([angx, 0, angz])))(bd[2])))(bd[1])))(bd[0])])).translate([0, 0, size])
]) : __apply_color(Manifold.cylinder(__div(size, 10), __div(size, 6), __div(size, 6)).rotate([90, 0, 0]).translate([0, 0, __div(size, 6)]).scale([1, 1, 3]), "green", undefined))))(__sub(n, 1))))(dna)))(__mul(scal, size)).rotate([angx, 0, angz])))(bd[2])))(bd[1])))(bd[0])])).translate([0, 0, size])
]) : __apply_color(Manifold.cylinder(__div(size, 10), __div(size, 6), __div(size, 6)).rotate([90, 0, 0]).translate([0, 0, __div(size, 6)]).scale([1, 1, 3]), "green", undefined));
}
var dna = [[12, 80, 0.85], [55, 0, 0.6], [62, 125, 0.6], [57, __neg(125), 0.6]];

var $fn = 0, $fa = 12, $fs = 2;
var $vpr = [0, 0, 0], $vpt = [0, 0, 0], $vpd = 500;
var $parent_modules = 0;
var _NO_ARG = Symbol("NO_ARG");
export const result = ((size) => (((dna) => (((n) => (((n > 0) ? __union2d3d([
  Manifold.cylinder(size, __div(size, 10), __div(size, 12), 24),
  __union2d3d(__flat_map_iter(dna, (bd) => [((angx) => (((angz) => (((scal) => (__with_children(() => Manifold.union([]), 0, () => simple_tree$mod(__mul(scal, size), dna, __sub(n, 1))).rotate([angx, 0, angz])))(bd[2])))(bd[1])))(bd[0])])).translate([0, 0, size])
]) : __apply_color(Manifold.cylinder(__div(size, 10), __div(size, 6), __div(size, 6)).rotate([90, 0, 0]).translate([0, 0, __div(size, 6)]).scale([1, 1, 3]), "green", undefined))))(5)))(dna)))(50);