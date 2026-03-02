import { Lexer, TokenType } from "./lexer.js";
import type { Token } from "./lexer.js";
import type {
  Expr, Statement, Program, Argument, Parameter, ForVariable,
  ModuleCallStmt, BlockStmt,
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
        `Expected ${TokenType[type]} but got ${TokenType[this.current.type]}`
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

    // for loop
    if (this.isIdentifier("for")) return this.parseForStmt();

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
    let left = this.parseUnary();
    while (
      this.current.type === TokenType.Star ||
      this.current.type === TokenType.Slash ||
      this.current.type === TokenType.Percent
    ) {
      const op =
        this.current.type === TokenType.Star  ? "*" :
        this.current.type === TokenType.Slash ? "/" : "%";
      this.advance();
      const right = this.parseUnary();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.current.type === TokenType.Minus) {
      this.advance();
      return { kind: "unary", op: "-", operand: this.parseUnary() };
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
      (tok.value ? ` '${tok.value}'` : "")
    );
  }

  private parseVectorOrRange(): Expr {
    this.expect(TokenType.LBracket);

    // empty vector
    if (this.current.type === TokenType.RBracket) {
      this.advance();
      return { kind: "vector", elements: [] };
    }

    const first = this.parseExpr();

    // Range  [start : end] or [start : step : end]
    if (this.current.type === TokenType.Colon) {
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
      elements.push(this.parseExpr());
    }
    this.expect(TokenType.RBracket);
    return { kind: "vector", elements };
  }
}