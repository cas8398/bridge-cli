import { Token } from "./lexer";

export interface Expression {
  type: "Literal" | "Identifier" | "BinaryExpression" | "CallExpression";
  value?: any;
  left?: Expression;
  right?: Expression;
  operator?: string;
  name?: string;
  args?: Expression[];
}

export interface Statement {
  type: "ReturnStatement" | "ExpressionStatement" | "VariableDeclaration";
  expression?: Expression;
  name?: string;
  init?: Expression;
}

export interface Function {
  name: string;
  params: { name: string; type: string }[];
  returnType: string;
  body: Statement[];
}

export interface AST {
  functions: Function[];
  models: any[];
  routes: any[];
}

export function parser(tokens: Token[]): AST {
  let pos = 0;
  const ast: AST = { functions: [], models: [], routes: [] };

  const peek = () => tokens[pos];
  const advance = () => tokens[pos++];
  const isEOF = () => pos >= tokens.length || peek() === undefined;

  function parsePrimary(): Expression {
    const token = advance();
    if (token.type === "STRING")
      return { type: "Literal", value: `"${token.value}"` };
    if (token.type === "INT" || token.type === "FLOAT")
      return { type: "Literal", value: token.value };
    if (token.type === "TRUE" || token.type === "FALSE")
      return { type: "Literal", value: token.value.toLowerCase() };

    if (token.type === "IDENTIFIER") {
      if (!isEOF() && peek().type === "LPAREN") {
        advance(); // (
        const args: Expression[] = [];
        while (!isEOF() && peek().type !== "RPAREN") {
          args.push(parseExpression());
          if (peek().type === "COMMA") advance();
        }
        advance(); // )
        return { type: "CallExpression", name: token.value, args };
      }
      return { type: "Identifier", name: token.value };
    }

    if (token.type === "LPAREN") {
      const expr = parseExpression();
      if (peek().type === "RPAREN") advance();
      return expr;
    }
    throw new Error(
      `Line ${token.line}: Unexpected token ${token.value} (Type: ${token.type})`
    );
  }

  function parseMultiplication(): Expression {
    let left = parsePrimary();
    while (!isEOF() && (peek().value === "*" || peek().value === "/")) {
      const operator = advance().value;
      const right = parsePrimary();
      left = { type: "BinaryExpression", left, operator, right };
    }
    return left;
  }

  function parseExpression(): Expression {
    let left = parseMultiplication();
    const ops = ["+", "-", "===", "==", ">", "<", ">=", "<=", "."];
    while (
      !isEOF() &&
      peek().type === "OPERATOR" &&
      ops.includes(peek().value)
    ) {
      const operator = advance().value;
      const right = parseMultiplication();
      left = { type: "BinaryExpression", left, operator, right };
    }
    return left;
  }

  function parseStatement(): Statement {
    const token = peek();
    if (token.type === "RETURN") {
      advance();
      return { type: "ReturnStatement", expression: parseExpression() };
    }
    if (token.type === "LET" || token.type === "CONST") {
      advance();
      const name = advance().value;
      if (!isEOF() && (peek().type === "EQUALS" || peek().value === "="))
        advance();
      return { type: "VariableDeclaration", name, init: parseExpression() };
    }
    return { type: "ExpressionStatement", expression: parseExpression() };
  }

  function parseFunction(): Function {
    advance(); // function
    const name = advance().value;
    advance(); // (
    const params = [];
    while (!isEOF() && peek().type !== "RPAREN") {
      const pName = advance().value;
      let pType = "any";
      if (peek().type === "COLON") {
        advance();
        pType = advance().value;
      }
      params.push({ name: pName, type: pType });
      if (peek().type === "COMMA") advance();
    }
    advance(); // )
    if (peek().type === "COLON") {
      advance();
      advance();
    } // return type
    advance(); // {
    const body = [];
    while (!isEOF() && peek().type !== "RBRACE") {
      body.push(parseStatement());
    }
    advance(); // }
    return { name, params, returnType: "any", body };
  }

  while (!isEOF()) {
    if (peek().type === "FUNCTION") ast.functions.push(parseFunction());
    else advance();
  }
  return ast;
}
