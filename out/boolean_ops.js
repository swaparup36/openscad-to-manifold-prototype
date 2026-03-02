import Module from "manifold-3d";
const wasm = await Module();
const { Manifold, CrossSection } = wasm;

const $fn = 48;

const result = Manifold.union([
  Manifold.sphere(20),
  Manifold.cylinder(60, 5, 5, 0, true).rotate([0, 90, 0]),
  Manifold.cylinder(15, 12, 2).translate([0, 0, 18])
]);