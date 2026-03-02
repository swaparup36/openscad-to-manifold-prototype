export type Expr =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | UndefLiteral
  | IdentifierExpr
  | VectorExpr
  | RangeExpr
  | BinaryExpr
  | UnaryExpr
  | TernaryExpr
  | FunctionCallExpr
  | IndexExpr
  | MemberExpr
  | GroupExpr;

export interface NumberLiteral   { kind: "number";     value: number; }
export interface StringLiteral   { kind: "string";     value: string; }
export interface BooleanLiteral  { kind: "boolean";    value: boolean; }
export interface UndefLiteral    { kind: "undef"; }
export interface IdentifierExpr  { kind: "identifier"; name: string; }
export interface VectorExpr      { kind: "vector";     elements: Expr[]; }
export interface RangeExpr       { kind: "range";      start: Expr; end: Expr; step?: Expr; }
export interface BinaryExpr      { kind: "binary";     op: string; left: Expr; right: Expr; }
export interface UnaryExpr       { kind: "unary";      op: string; operand: Expr; }
export interface TernaryExpr     { kind: "ternary";    condition: Expr; ifTrue: Expr; ifFalse: Expr; }
export interface FunctionCallExpr{ kind: "call";       name: string; args: Argument[]; }
export interface IndexExpr       { kind: "index";      object: Expr; index: Expr; }
export interface MemberExpr      { kind: "member";     object: Expr; property: string; }
export interface GroupExpr       { kind: "group";      expr: Expr; }

export interface Argument {
  name?: string;
  value: Expr;
}

export type Statement =
  | ModuleCallStmt
  | BlockStmt
  | VariableDeclStmt
  | ModuleDeclStmt
  | FunctionDeclStmt
  | ForStmt
  | IfStmt
  | EmptyStmt;

export interface ModuleCallStmt {
  kind: "moduleCall";
  name: string;
  args: Argument[];
  child?: Statement;
  modifier?: string;   // *, !, #, %
}

export interface BlockStmt {
  kind: "block";
  statements: Statement[];
}

export interface VariableDeclStmt {
  kind: "variableDecl";
  name: string;
  value: Expr;
}

export interface ModuleDeclStmt {
  kind: "moduleDecl";
  name: string;
  params: Parameter[];
  body: Statement;
}

export interface FunctionDeclStmt {
  kind: "functionDecl";
  name: string;
  params: Parameter[];
  body: Expr;
}

export interface ForStmt {
  kind: "for";
  variables: ForVariable[];
  body: Statement;
}

export interface IfStmt {
  kind: "if";
  condition: Expr;
  thenBody: Statement;
  elseBody?: Statement;
}

export interface EmptyStmt {
  kind: "empty";
}

export interface Parameter {
  name: string;
  defaultValue?: Expr;
}

export interface ForVariable {
  name: string;
  range: Expr;
}

export interface Program {
  kind: "program";
  statements: Statement[];
}