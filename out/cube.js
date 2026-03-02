import Module from "manifold-3d";
const wasm = await Module();
const { Manifold, CrossSection } = wasm;

const result = Manifold.cube([5, 5, 5], false).translate([1, 2, 3]);