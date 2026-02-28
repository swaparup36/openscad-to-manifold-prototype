import type { Node } from "./ast.js";

export function compile(node: Node): string {
  switch (node.type) {
    case "cube":
      return `Manifold.cube([${node.size},${node.size},${node.size}])`;

    case "sphere":
      return `Manifold.sphere(${node.radius})`;

    case "translate":
      return `${compile(node.child)}.translate([${node.vector.join(",")}])`;
  }
}