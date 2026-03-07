export enum TokenType {
  // Literals
  Identifier,
  Number,
  String,

  // Punctuation
  LParen,    // (
  RParen,    // )
  LBracket,  // [
  RBracket,  // ]
  LBrace,    // {
  RBrace,    // }
  Comma,     // ,
  Semicolon, // ;
  Colon,     // :
  Hash,      // #

  // Assignment
  Equals,    // =

  // Arithmetic
  Plus,      // +
  Minus,     // -
  Star,      // *
  Slash,     // /
  Percent,   // %
  Caret,     // ^

  // Comparison
  Lt,        // <
  Gt,        // >
  LtEq,     // <=
  GtEq,     // >=
  EqEq,     // ==
  BangEq,   // !=

  // Logical
  And,       // &&
  Or,        // ||
  Bang,      // !

  // Member access
  Dot,       // .

  // Ternary
  Question,  // ?

  EOF,
}

export interface Token {
  type: TokenType;
  value?: string;
  line?: number;
}

export class Lexer {
  private pos = 0;
  private line = 1;

  constructor(private input: string) {}

  private peek(): string {
    return this.pos < this.input.length ? this.input[this.pos] : "\0";
  }

  private peekNext(): string {
    return this.pos + 1 < this.input.length ? this.input[this.pos + 1] : "\0";
  }

  private advance(): string {
    const ch = this.input[this.pos++] ?? "\0";
    if (ch === "\n") this.line++;
    return ch;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.input.length;
  }

  private skipWhitespaceAndComments(): void {
    while (!this.isAtEnd()) {
      const ch = this.peek();

      // Whitespace
      if (/\s/.test(ch)) {
        if (ch === "\n") this.line++;
        this.pos++;
        continue;
      }

      // Line comment
      if (ch === "/" && this.peekNext() === "/") {
        this.pos += 2;
        while (!this.isAtEnd() && this.peek() !== "\n") this.pos++;
        continue;
      }

      // Block comment
      if (ch === "/" && this.peekNext() === "*") {
        this.pos += 2;
        while (!this.isAtEnd()) {
          if (this.peek() === "*" && this.peekNext() === "/") {
            this.pos += 2;
            break;
          }
          this.pos++;
        }
        continue;
      }

      break;
    }
  }

  nextToken(): Token {
    this.skipWhitespaceAndComments();

    if (this.isAtEnd()) return { type: TokenType.EOF, line: this.line };

    const line = this.line;
    const ch = this.peek();

    // Number
    if (/\d/.test(ch) || (ch === "." && /\d/.test(this.peekNext()))) {
      return this.readNumber(line);
    }

    // String literal
    if (ch === '"') {
      return this.readString(line);
    }

    // Identifier / keyword
    if (/[a-zA-Z_$]/.test(ch)) {
      return this.readIdentifier(line);
    }

    // Operators and punctuation
    this.advance();

    switch (ch) {
      case "(": return { type: TokenType.LParen, line };
      case ")": return { type: TokenType.RParen, line };
      case "[": return { type: TokenType.LBracket, line };
      case "]": return { type: TokenType.RBracket, line };
      case "{": return { type: TokenType.LBrace, line };
      case "}": return { type: TokenType.RBrace, line };
      case ",": return { type: TokenType.Comma, line };
      case ";": return { type: TokenType.Semicolon, line };
      case ":": return { type: TokenType.Colon, line };
      case "#": return { type: TokenType.Hash, line };
      case "?": return { type: TokenType.Question, line };
      case ".": return { type: TokenType.Dot, line };
      case "+": return { type: TokenType.Plus, line };
      case "-": return { type: TokenType.Minus, line };
      case "*": return { type: TokenType.Star, line };
      case "%": return { type: TokenType.Percent, line };
      case "^": return { type: TokenType.Caret, line };

      case "/": return { type: TokenType.Slash, line };

      case "=":
        if (this.peek() === "=") { this.advance(); return { type: TokenType.EqEq, line }; }
        return { type: TokenType.Equals, line };

      case "!":
        if (this.peek() === "=") { this.advance(); return { type: TokenType.BangEq, line }; }
        return { type: TokenType.Bang, line };

      case "<":
        if (this.peek() === "=") { this.advance(); return { type: TokenType.LtEq, line }; }
        return { type: TokenType.Lt, line };

      case ">":
        if (this.peek() === "=") { this.advance(); return { type: TokenType.GtEq, line }; }
        return { type: TokenType.Gt, line };

      case "&":
        if (this.peek() === "&") { this.advance(); return { type: TokenType.And, line }; }
        throw new Error(`Unexpected character '&' (did you mean '&&'?) at line ${line}`);

      case "|":
        if (this.peek() === "|") { this.advance(); return { type: TokenType.Or, line }; }
        throw new Error(`Unexpected character '|' (did you mean '||'?) at line ${line}`);
    }

    throw new Error(`Unexpected character '${ch}' at line ${line}`);
  }

  private readNumber(line: number): Token {
    const start = this.pos;

    // Integer part
    while (/\d/.test(this.peek())) this.advance();

    // Fractional part
    if (this.peek() === "." && /[\d\0]/.test(this.peekNext())) {
      this.advance(); 
      while (/\d/.test(this.peek())) this.advance();
    } else if (this.peek() === ".") {
      this.advance(); // trailing dot
    }

    // Scientific notation
    if (this.peek() === "e" || this.peek() === "E") {
      this.advance();
      if (this.peek() === "+" || this.peek() === "-") this.advance();
      while (/\d/.test(this.peek())) this.advance();
    }

    return { type: TokenType.Number, value: this.input.slice(start, this.pos), line };
  }

  private readString(line: number): Token {
    this.advance(); // consume opening "
    let result = "";

    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === "\\") {
        this.advance();
        const esc = this.advance();
        switch (esc) {
          case "n": result += "\n"; break;
          case "t": result += "\t"; break;
          case "\\": result += "\\"; break;
          case '"': result += '"'; break;
          default: result += esc; break;
        }
      } else {
        result += this.advance();
      }
    }

    if (this.isAtEnd()) throw new Error(`Unterminated string literal at line ${line}`);
    this.advance();

    return { type: TokenType.String, value: result, line };
  }

  private readIdentifier(line: number): Token {
    const start = this.pos;
    while (/[a-zA-Z_$0-9]/.test(this.peek())) this.advance();
    return { type: TokenType.Identifier, value: this.input.slice(start, this.pos), line };
  }
}