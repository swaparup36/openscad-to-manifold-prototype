import * as __rt from "./runtime.js";
const { Manifold, CrossSection, wasm, is_undef_fn, is_bool_fn, is_num_fn, is_string_fn, is_list_fn, is_function_fn, sin_fn, cos_fn, tan_fn, asin_fn, acos_fn, atan_fn, atan2_fn, abs_fn, sign_fn, floor_fn, ceil_fn, round_fn, sqrt_fn, exp_fn, ln_fn, log_fn, min_fn, max_fn, norm_fn, cross_fn, len_fn, str_fn, chr_fn, ord_fn, concat_fn, search_fn, lookup_fn, openscad_assert_fn, __eq, __add, __sub, __mul, __div, __mod, __neg, __pos, version_fn, version_num_fn, __children_stack, __with_children, __is_finite_matrix4, __to_manifold_mat4, __safe_transform, __identity4, __safe_attach_transform, __safe_offset2d, __safe_project3d, __apply_color, __flat_map_iter, __range, __union2d3d, __difference2d3d, __intersection2d3d, __hull2d3d, __minkowski2d3d } = __rt;
var PI = __rt.PI;
var INF = __rt.INF;
var NAN = __rt.NAN;
var undef = __rt.undef;
var _EPSILON = __rt._EPSILON;

var $fn = 0, $fa = 12, $fs = 2;
var $vpr = [0, 0, 0], $vpt = [0, 0, 0], $vpd = 500;
var $parent_modules = 0;
var _NO_ARG = Symbol("NO_ARG");
export const result = __minkowski2d3d([
  ((__s) => Manifold.cube((is_list_fn(__s) ? __s : [__s, __s, __s]), true))([10, 10, 10]),
  Manifold.sphere(2)
]);