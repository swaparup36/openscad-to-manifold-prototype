import fs from "fs";
import { parse } from "./src/parser.js";
import { compile } from "./src/compiler.js";

const code = fs.readFileSync("examples/cube.scad", "utf8");

const ast = parse(code);
console.log("AST:", ast);

const js = compile(ast);
console.log("generated JS:");
console.log(js);