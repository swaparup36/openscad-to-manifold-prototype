import Module from "manifold-3d";
const wasm = await Module();
const { Manifold, CrossSection } = wasm;

function leg(h = 40, r = 3) {
  return Manifold.cylinder(h, r, r, 32);
}
function table(w = 80, d = 50, h = 40, top_t = 3) {
  return Manifold.union([
  Manifold.cube([w, d, top_t], false).translate([0, 0, h]),
  Manifold.union([0, (w - 6)].flatMap((x) => [Manifold.union([0, (d - 6)].flatMap((y) => [leg(/* h = */ h).translate([(x + 3), (y + 3), 0])]))]))
]);
}

const result = table();