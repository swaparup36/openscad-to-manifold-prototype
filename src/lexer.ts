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

  // Ternary
  Question,  // ?

  EOF,
}

export interface Token {
  type: TokenType;
  value?: string;
}

export class Lexer {
  private pos = 0;

  constructor(private input: string) {}

  private peek(): string {
    return this.pos < this.input.length ? this.input[this.pos] : "\0";
  }

  private peekNext(): string {
    return this.pos + 1 < this.input.length ? this.input[this.pos + 1] : "\0";
  }

  private advance(): string {
    return this.input[this.pos++] ?? "\0";
  }

  private isAtEnd(): boolean {
    return this.pos >= this.input.length;
  }

  private skipWhitespaceAndComments(): void {
    while (!this.isAtEnd()) {
      const ch = this.peek();

      // Whitespace
      if (/\s/.test(ch)) {
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

    if (this.isAtEnd()) return { type: TokenType.EOF };

    const ch = this.peek();

    // Number
    if (/\d/.test(ch) || (ch === "." && /\d/.test(this.peekNext()))) {
      return this.readNumber();
    }

    // String literal
    if (ch === '"') {
      return this.readString();
    }

    // Identifier / keyword
    if (/[a-zA-Z_$]/.test(ch)) {
      return this.readIdentifier();
    }

    // Operators and punctuation
    this.advance();

    switch (ch) {
      case "(": return { type: TokenType.LParen };
      case ")": return { type: TokenType.RParen };
      case "[": return { type: TokenType.LBracket };
      case "]": return { type: TokenType.RBracket };
      case "{": return { type: TokenType.LBrace };
      case "}": return { type: TokenType.RBrace };
      case ",": return { type: TokenType.Comma };
      case ";": return { type: TokenType.Semicolon };
      case ":": return { type: TokenType.Colon };
      case "#": return { type: TokenType.Hash };
      case "?": return { type: TokenType.Question };
      case "+": return { type: TokenType.Plus };
      case "-": return { type: TokenType.Minus };
      case "*": return { type: TokenType.Star };
      case "%": return { type: TokenType.Percent };
      case "^": return { type: TokenType.Caret };

      case "/": return { type: TokenType.Slash };

      case "=":
        if (this.peek() === "=") { this.advance(); return { type: TokenType.EqEq }; }
        return { type: TokenType.Equals };

      case "!":
        if (this.peek() === "=") { this.advance(); return { type: TokenType.BangEq }; }
        return { type: TokenType.Bang };

      case "<":
        if (this.peek() === "=") { this.advance(); return { type: TokenType.LtEq }; }
        return { type: TokenType.Lt };

      case ">":
        if (this.peek() === "=") { this.advance(); return { type: TokenType.GtEq }; }
        return { type: TokenType.Gt };

      case "&":
        if (this.peek() === "&") { this.advance(); return { type: TokenType.And }; }
        throw new Error(`Unexpected character '&' (did you mean '&&'?)`);

      case "|":
        if (this.peek() === "|") { this.advance(); return { type: TokenType.Or }; }
        throw new Error(`Unexpected character '|' (did you mean '||'?)`);
    }

    throw new Error(`Unexpected character '${ch}'`);
  }

  private readNumber(): Token {
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

    return { type: TokenType.Number, value: this.input.slice(start, this.pos) };
  }

  private readString(): Token {
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

    if (this.isAtEnd()) throw new Error("Unterminated string literal");
    this.advance();

    return { type: TokenType.String, value: result };
  }

  private readIdentifier(): Token {
    const start = this.pos;
    while (/[a-zA-Z_$0-9]/.test(this.peek())) this.advance();
    return { type: TokenType.Identifier, value: this.input.slice(start, this.pos) };
  }
}