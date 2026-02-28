import type { Node } from "./ast.js";

const shapeList = ["cube", "sphere"];

export function parse(code: string): Node {
  if (code.includes("translate")) {
    const vecMatch = code.match(/\[(.*?)\]/);
    // console.log("vecMatch:", vecMatch);
    const vector = vecMatch![1]!.split(",").map(Number);

    // extreact the shape and its parameters from the codde translate([1,2,3]) shape(5);
    const shapeAndSizeMatch = code.match(/translate\(\[.*?\]\)\s*(\w+)\((.*?)\)/);
    // console.log("shapeAndSizeMatch:", shapeAndSizeMatch);
    const shape = shapeAndSizeMatch![1];
    const size = Number(shapeAndSizeMatch![2]);

    // Check if the shape and size is supported
    if (!shapeList.includes(shape!)) {
      throw new Error("Unsupported shape: " + shape);
    } else if (isNaN(size)) {
      throw new Error("Invalid size: " + shapeAndSizeMatch![2]);
    }

    return {
      type: "translate",
      vector,
      child: {
        type: shape as "cube" | "sphere",
        size
      } as Node
    };
  }

  if (code.includes("cube")) {
    const size = Number(code.match(/cube\((.*?)\)/)![1]);
    return { type: "cube", size };
  }

  throw new Error("Unsupported syntax");
}