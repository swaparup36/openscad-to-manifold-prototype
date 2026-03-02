import Module from "manifold-3d";
const wasm = await Module();
const { Manifold, CrossSection } = wasm;

const wall = 2;
const size = 30;
const hole_r = 10;

const result = Manifold.cube([size, size, size], true).subtract(Manifold.cylinder((size + 1), hole_r, hole_r, 64, true));