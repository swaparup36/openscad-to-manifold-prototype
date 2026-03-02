import fs from "fs";
import { Lexer } from "./src/lexer.js";
import { Parser } from "./src/parser.js";
import { compile } from "./src/compiler.js";

import path from "path";

const file = process.argv[2] || "examples/cube.scad";
const code = fs.readFileSync(file, "utf8");

const lexer = new Lexer(code);
const parser = new Parser(lexer);
const ast = parser.parseProgram();

const js = compile(ast);
console.log("Generated JavaScript:");
console.log(js);

const outputFile = path.join("out", file.slice(file.indexOf('/') + 1).replace(/\.scad$/, ".js"));
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, js);
console.log(`Output written to ${outputFile}`);