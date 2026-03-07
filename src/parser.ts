import { Lexer, TokenType } from "./lexer.js";
import type { Token } from "./lexer.js";
import type {
  Expr, Statement, Program, Argument, Parameter, ForVariable,
  ModuleCallStmt, BlockStmt, ListCompGenerator, LetAssignment,
} from "./ast.js";

export class Parser {
  private tokens: Token[] = [];
  private pos = 0;
  private current!: Token;

  constructor(lexer: Lexer) {
    // Pre-tokenize for easy lookahead
    let tok: Token;
    do {
      tok = lexer.nextToken();
      this.tokens.push(tok);
    } while (tok.type !== TokenType.EOF);
    this.current = this.tokens[0]!;
  }

  private advance(): Token {
    const tok = this.current;
    this.pos++;
    this.current = this.tokens[this.pos] ?? { type: TokenType.EOF };
    return tok;
  }

  private expect(type: TokenType): Token {
    if (this.current.type !== type) {
      throw new Error(
        `Expected ${TokenType[type]} but got ${TokenType[this.current.type]} at line ${this.current.line ?? '?'}`
      );
    }
    return this.advance();
  }

  private match(type: TokenType): boolean {
    if (this.current.type === type) {
      this.advance();
      return true;
    }
    return false;
  }

  private peekNext(): Token {
    return this.tokens[this.pos + 1] ?? { type: TokenType.EOF };
  }

  private isIdentifier(name?: string): boolean {
    return (
      this.current.type === TokenType.Identifier &&
      (name === undefined || this.current.value === name)
    );
  }

  parseProgram(): Program {
    const statements: Statement[] = [];
    while (this.current.type !== TokenType.EOF) {
      statements.push(this.parseStatement());
    }
    return { kind: "program", statements };
  }

  private parseStatement(): Statement {
    // module declaration
    if (this.isIdentifier("module")) return this.parseModuleDecl();

    // function declaration
    if (this.isIdentifier("function")) return this.parseFunctionDecl();

    // use / include
    if (this.isIdentifier("use") || this.isIdentifier("include")) return this.parseUseInclude();

    // for loop
    if (this.isIdentifier("for")) return this.parseForStmt();

    // let as statement modifier: let(assignments) statement
    if (this.isIdentifier("let") && this.peekNext().type === TokenType.LParen) return this.parseLetStmt();

    // if / else
    if (this.isIdentifier("if")) return this.parseIfStmt();

    // block
    if (this.current.type === TokenType.LBrace) return this.parseBlock();

    // empty statement
    if (this.match(TokenType.Semicolon)) return { kind: "empty" };

    // variable declaration:  identifier =
    if (
      this.current.type === TokenType.Identifier &&
      this.peekNext().type === TokenType.Equals
    ) {
      return this.parseVariableDecl();
    }

    // module / operator call (cube, translate, union etc.)
    return this.parseModuleCallStmt();
  }

  private parseModuleDecl(): Statement {
    this.advance(); // consume 'module'
    const name = this.expect(TokenType.Identifier).value!;
    this.expect(TokenType.LParen);
    const params = this.parseParameterList();
    this.expect(TokenType.RParen);
    const body = this.parseStatement();
    return { kind: "moduleDecl", name, params, body };
  }

  private parseFunctionDecl(): Statement {
    this.advance(); // consume 'function'
    const name = this.expect(TokenType.Identifier).value!;
    this.expect(TokenType.LParen);
    const params = this.parseParameterList();
    this.expect(TokenType.RParen);
    this.expect(TokenType.Equals);
    const body = this.parseExpr();
    this.expect(TokenType.Semicolon);
    return { kind: "functionDecl", name, params, body };
  }

  private parseForStmt(): Statement {
    this.advance(); // consume 'for'
    this.expect(TokenType.LParen);

    const variables: ForVariable[] = [];
    do {
      const name = this.expect(TokenType.Identifier).value!;
      this.expect(TokenType.Equals);
      const range = this.parseExpr();
      variables.push({ name, range });
    } while (this.match(TokenType.Comma));

    this.expect(TokenType.RParen);
    const body = this.parseStatement();
    return { kind: "for", variables, body };
  }

  private parseIfStmt(): Statement {
    this.advance();
    this.expect(TokenType.LParen);
    const condition = this.parseExpr();
    this.expect(TokenType.RParen);
    const thenBody = this.parseStatement();

    let elseBody: Statement | undefined;
    if (this.isIdentifier("else")) {
      this.advance();
      elseBody = this.parseStatement();
    }

    return { kind: "if", condition, thenBody, elseBody };
  }

  private parseBlock(): BlockStmt {
    this.expect(TokenType.LBrace);
    const statements: Statement[] = [];
    while (
      this.current.type !== TokenType.RBrace &&
      this.current.type !== TokenType.EOF
    ) {
      statements.push(this.parseStatement());
    }
    this.expect(TokenType.RBrace);
    return { kind: "block", statements };
  }

  private parseVariableDecl(): Statement {
    const name = this.expect(TokenType.Identifier).value!;
    this.expect(TokenType.Equals);
    const value = this.parseExpr();
    this.expect(TokenType.Semicolon);
    return { kind: "variableDecl", name, value };
  }

  private parseModuleCallStmt(): ModuleCallStmt {
    let modifier: string | undefined;
    if (this.current.type === TokenType.Hash)    { modifier = "#"; this.advance(); }
    else if (this.current.type === TokenType.Bang)    { modifier = "!"; this.advance(); }
    else if (this.current.type === TokenType.Star)    { modifier = "*"; this.advance(); }
    else if (this.current.type === TokenType.Percent) { modifier = "%"; this.advance(); }

    const name = this.expect(TokenType.Identifier).value!;
    this.expect(TokenType.LParen);
    const args = this.parseArgumentList();
    this.expect(TokenType.RParen);

    let child: Statement | undefined;
    if (this.current.type === TokenType.Semicolon) {
      this.advance();
    } else {
      child = this.parseStatement();
    }

    return { kind: "moduleCall", name, args, child, modifier };
  }

  private parseArgumentList(): Argument[] {
    const args: Argument[] = [];
    if (this.current.type === TokenType.RParen) return args;

    do {
      // Trailing comma: if next token closes the list, stop
      if (this.current.type === TokenType.RParen) break;
      if (
        this.current.type === TokenType.Identifier &&
        this.peekNext().type === TokenType.Equals
      ) {
        const name = this.advance().value!;
        this.advance(); // consume '='
        const value = this.parseExpr();
        args.push({ name, value });
      } else {
        args.push({ value: this.parseExpr() });
      }
    } while (this.match(TokenType.Comma));

    return args;
  }

  private parseParameterList(): Parameter[] {
    const params: Parameter[] = [];
    if (this.current.type === TokenType.RParen) return params;

    do {
      // Trailing comma - if next token closes the list, stop
      if (this.current.type === TokenType.RParen) break;
      const name = this.expect(TokenType.Identifier).value!;
      let defaultValue: Expr | undefined;
      if (this.match(TokenType.Equals)) {
        defaultValue = this.parseExpr();
      }
      params.push({ name, defaultValue });
    } while (this.match(TokenType.Comma));

    return params;
  }

  parseExpr(): Expr {
    return this.parseTernary();
  }

  private parseTernary(): Expr {
    let expr = this.parseOr();
    if (this.match(TokenType.Question)) {
      const ifTrue = this.parseExpr();
      this.expect(TokenType.Colon);
      const ifFalse = this.parseExpr();
      return { kind: "ternary", condition: expr, ifTrue, ifFalse };
    }
    return expr;
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.match(TokenType.Or)) {
      const right = this.parseAnd();
      left = { kind: "binary", op: "||", left, right };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseComparison();
    while (this.match(TokenType.And)) {
      const right = this.parseComparison();
      left = { kind: "binary", op: "&&", left, right };
    }
    return left;
  }

  private parseComparison(): Expr {
    let left = this.parseAddition();
    const opMap: Partial<Record<TokenType, string>> = {
      [TokenType.EqEq]:  "==",
      [TokenType.BangEq]:"!=",
      [TokenType.Lt]:    "<",
      [TokenType.Gt]:    ">",
      [TokenType.LtEq]:  "<=",
      [TokenType.GtEq]:  ">=",
    };
    const op = opMap[this.current.type];
    if (op) {
      this.advance();
      const right = this.parseAddition();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseAddition(): Expr {
    let left = this.parseMultiplication();
    while (
      this.current.type === TokenType.Plus ||
      this.current.type === TokenType.Minus
    ) {
      const op = this.current.type === TokenType.Plus ? "+" : "-";
      this.advance();
      const right = this.parseMultiplication();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseMultiplication(): Expr {
    let left = this.parseExponentiation();
    while (
      this.current.type === TokenType.Star ||
      this.current.type === TokenType.Slash ||
      this.current.type === TokenType.Percent
    ) {
      const op =
        this.current.type === TokenType.Star  ? "*" :
        this.current.type === TokenType.Slash ? "/" : "%";
      this.advance();
      const right = this.parseExponentiation();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseExponentiation(): Expr {
    let left = this.parseUnary();
    if (this.current.type === TokenType.Caret) {
      this.advance();
      const right = this.parseExponentiation(); // right-associative
      left = { kind: "binary", op: "^", left, right };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.current.type === TokenType.Minus) {
      this.advance();
      return { kind: "unary", op: "-", operand: this.parseUnary() };
    }
    if (this.current.type === TokenType.Plus) {
      this.advance();
      return { kind: "unary", op: "+", operand: this.parseUnary() };
    }
    if (this.current.type === TokenType.Bang) {
      this.advance();
      return { kind: "unary", op: "!", operand: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary();

    while (true) {
      if (this.current.type === TokenType.LBracket) {
        this.advance();
        const index = this.parseExpr();
        this.expect(TokenType.RBracket);
        expr = { kind: "index", object: expr, index };
      } else if (this.current.type === TokenType.Dot) {
        this.advance();
        const property = this.expect(TokenType.Identifier).value!;
        expr = { kind: "member", object: expr, property };
      } else if (this.current.type === TokenType.LParen && expr.kind !== "number" && expr.kind !== "string" && expr.kind !== "boolean" && expr.kind !== "undef") {
        // Callable postfix: expr(args) — e.g. geom[5](anchor)
        this.advance();
        const args = this.parseArgumentList();
        this.expect(TokenType.RParen);
        if (expr.kind === "identifier") {
          expr = { kind: "call", name: expr.name, args };
        } else {
          expr = { kind: "dynCall", callee: expr, args };
        }
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): Expr {
    const tok = this.current;

    // Number
    if (tok.type === TokenType.Number) {
      this.advance();
      return { kind: "number", value: Number(tok.value) };
    }

    // String
    if (tok.type === TokenType.String) {
      this.advance();
      return { kind: "string", value: tok.value! };
    }

    // Booleans & undef
    if (tok.type === TokenType.Identifier) {
      if (tok.value === "true")  { this.advance(); return { kind: "boolean", value: true }; }
      if (tok.value === "false") { this.advance(); return { kind: "boolean", value: false }; }
      if (tok.value === "undef") { this.advance(); return { kind: "undef" }; }

      // Anonymous function (lambda): function(params) expr
      if (tok.value === "function" && this.peekNext().type === TokenType.LParen) {
        this.advance(); // consume 'function'
        this.advance(); // consume '('
        const params = this.parseParameterList();
        this.expect(TokenType.RParen);
        const body = this.parseExpr();
        return { kind: "lambda", params, body };
      }

      // Echo expression modifier: echo(args) [expr]
      if (tok.value === "echo" && this.peekNext().type === TokenType.LParen) {
        this.advance(); // consume 'echo'
        this.advance(); // consume '('
        const args = this.parseArgumentList();
        this.expect(TokenType.RParen);
        const expr = this.canStartExpr() ? this.parseExpr() : { kind: "undef" } as const;
        return { kind: "echo", args, expr };
      }

      // Let expression: let(assignments) expr
      if (tok.value === "let" && this.peekNext().type === TokenType.LParen) {
        this.advance(); // consume 'let'
        this.advance(); // consume '('
        const assignments = this.parseLetAssignments();
        this.expect(TokenType.RParen);
        const body = this.canStartExpr() ? this.parseExpr() : { kind: "undef" } as const;
        return { kind: "let", assignments, body };
      }

      // Assert expression modifier: assert(args) [expr]
      if (tok.value === "assert" && this.peekNext().type === TokenType.LParen) {
        this.advance(); // consume 'assert'
        this.advance(); // consume '('
        const args = this.parseArgumentList();
        this.expect(TokenType.RParen);
        const expr = this.canStartExpr() ? this.parseExpr() : { kind: "undef" } as const;
        return { kind: "assert", args, expr };
      }

      // Each expression: each expr
      if (tok.value === "each") {
        this.advance(); // consume 'each'
        return { kind: "each", expr: this.parseExpr() };
      }

      if (this.peekNext().type === TokenType.LParen) {
        const name = this.advance().value!;
        this.advance();
        const args = this.parseArgumentList();
        this.expect(TokenType.RParen);
        return { kind: "call", name, args };
      }

      // Plain identifier
      this.advance();
      return { kind: "identifier", name: tok.value! };
    }

    // Vector or range
    if (tok.type === TokenType.LBracket) {
      return this.parseVectorOrRange();
    }

    // Grouped expression
    if (tok.type === TokenType.LParen) {
      this.advance();
      const expr = this.parseExpr();
      this.expect(TokenType.RParen);
      return { kind: "group", expr };
    }

    throw new Error(
      `Unexpected token ${TokenType[tok.type]}` +
      (tok.value ? ` '${tok.value}'` : "") +
      ` at line ${tok.line ?? '?'}`
    );
  }

  private parseVectorOrRange(): Expr {
    this.expect(TokenType.LBracket);

    // empty vector
    if (this.current.type === TokenType.RBracket) {
      this.advance();
      return { kind: "vector", elements: [] };
    }

    const first = this.parseVectorElement();

    // Range  [start : end] or [start : step : end]
    // Ranges only apply to plain expressions, not generators
    if (first.kind !== "listComp" && first.kind !== "each" && this.current.type === TokenType.Colon) {
      this.advance();
      const second = this.parseExpr();
      if (this.current.type === TokenType.Colon) {
        this.advance();
        const third = this.parseExpr();
        this.expect(TokenType.RBracket);
        return { kind: "range", start: first, step: second, end: third };
      }
      this.expect(TokenType.RBracket);
      return { kind: "range", start: first, end: second };
    }

    // Vector
    const elements: Expr[] = [first];
    while (this.match(TokenType.Comma)) {
      if (this.current.type === TokenType.RBracket) break;
      elements.push(this.parseVectorElement());
    }
    this.expect(TokenType.RBracket);
    return { kind: "vector", elements };
  }

  private parseVectorElement(): Expr {
    if (this.isIdentifier("each")) {
      this.advance();
      // each can precede a generator: each if(...), each for(...)
      if (this.isIdentifier("for") || this.isIdentifier("if") || this.isIdentifier("let")) {
        const generator = this.parseListCompGenerator();
        return { kind: "each", expr: { kind: "listComp", generator } };
      }
      return { kind: "each", expr: this.parseExpr() };
    }
    if (this.isIdentifier("for") || this.isIdentifier("if") || this.isIdentifier("let")) {
      const generator = this.parseListCompGenerator();
      return { kind: "listComp", generator };
    }
    return this.parseExpr();
  }

  private parseListCompGenerator(): ListCompGenerator {
    if (this.isIdentifier("for")) {
      this.advance();
      this.expect(TokenType.LParen);
      const variables: ForVariable[] = [];
      do {
        // Trailing comma before ; or )
        if (this.current.type === TokenType.Semicolon || this.current.type === TokenType.RParen) break;
        const name = this.expect(TokenType.Identifier).value!;
        this.expect(TokenType.Equals);
        const range = this.parseExpr();
        variables.push({ name, range });
      } while (this.match(TokenType.Comma));

      // C-style for: for(init ; condition ; update)
      if (this.current.type === TokenType.Semicolon) {
        this.advance();
        const inits = variables.map(v => ({ name: v.name, value: v.range }));
        const condition = this.parseExpr();
        this.expect(TokenType.Semicolon);
        const updates: import("./ast.js").LetAssignment[] = [];
        do {
          if (this.current.type === TokenType.RParen) break;
          const name = this.expect(TokenType.Identifier).value!;
          this.expect(TokenType.Equals);
          const value = this.parseExpr();
          updates.push({ name, value });
        } while (this.match(TokenType.Comma));
        this.expect(TokenType.RParen);
        const body = this.parseListCompGenerator();
        return { kind: "lcCFor", inits, condition, updates, body };
      }

      this.expect(TokenType.RParen);
      const body = this.parseListCompGenerator();
      return { kind: "lcFor", variables, body };
    }

    if (this.isIdentifier("if")) {
      this.advance();
      this.expect(TokenType.LParen);
      const condition = this.parseExpr();
      this.expect(TokenType.RParen);
      const ifTrue = this.parseListCompGenerator();
      let ifFalse: ListCompGenerator | undefined;
      if (this.isIdentifier("else")) {
        this.advance();
        ifFalse = this.parseListCompGenerator();
      }
      return { kind: "lcIf", condition, ifTrue, ifFalse };
    }

    if (this.isIdentifier("let")) {
      this.advance();
      this.expect(TokenType.LParen);
      const assignments = this.parseLetAssignments();
      this.expect(TokenType.RParen);
      const body = this.parseListCompGenerator();
      return { kind: "lcLet", assignments, body };
    }

    if (this.isIdentifier("each")) {
      this.advance();
      // each can wrap a generator: each if(...), each for(...)
      if (this.isIdentifier("for") || this.isIdentifier("if") || this.isIdentifier("let")) {
        const generator = this.parseListCompGenerator();
        return { kind: "lcExpr", expr: { kind: "each", expr: { kind: "listComp", generator } } };
      }
      return { kind: "lcExpr", expr: { kind: "each", expr: this.parseExpr() } };
    }

    return { kind: "lcExpr", expr: this.parseExpr() };
  }

  private parseLetAssignments(): LetAssignment[] {
    const assignments: LetAssignment[] = [];
    if (this.current.type === TokenType.RParen) return assignments;

    do {
      const name = this.expect(TokenType.Identifier).value!;
      this.expect(TokenType.Equals);
      const value = this.parseExpr();
      assignments.push({ name, value });
    } while (this.match(TokenType.Comma));

    return assignments;
  }

  private parseUseInclude(): Statement {
    const keyword = this.advance().value! as "use" | "include";
    this.expect(TokenType.Lt);

    let path = '';
    while (this.current.type !== TokenType.Gt && this.current.type !== TokenType.EOF) {
      const tok = this.advance();
      path += this.tokenToString(tok);
    }
    this.expect(TokenType.Gt);

    return { kind: keyword, path };
  }

  private parseLetStmt(): Statement {
    // let(assignments) statement — parsed as a module call with named args
    const name = this.advance().value!;
    this.expect(TokenType.LParen);
    const args = this.parseArgumentList();
    this.expect(TokenType.RParen);

    let child: Statement | undefined;
    if (this.current.type === TokenType.Semicolon) {
      this.advance();
    } else {
      child = this.parseStatement();
    }

    return { kind: "moduleCall", name, args, child };
  }

  private tokenToString(tok: Token): string {
    if (tok.value !== undefined) return tok.value;
    switch (tok.type) {
      case TokenType.Slash: return '/';
      case TokenType.Dot: return '.';
      case TokenType.Minus: return '-';
      case TokenType.Plus: return '+';
      case TokenType.Star: return '*';
      case TokenType.Colon: return ':';
      default: return '';
    }
  }

  private canStartExpr(): boolean {
    const t = this.current.type;
    return (
      t === TokenType.Number ||
      t === TokenType.String ||
      t === TokenType.Identifier ||
      t === TokenType.LBracket ||
      t === TokenType.LParen ||
      t === TokenType.Minus ||
      t === TokenType.Bang ||
      t === TokenType.Plus
    );
  }
}