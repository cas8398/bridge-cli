"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexer = lexer;
function lexer(source) {
    const tokens = [];
    let i = 0, line = 1;
    while (i < source.length) {
        const ch = source[i];
        if (ch === " " || ch === "\t" || ch === "\r") {
            i++;
            continue;
        }
        if (ch === "\n") {
            line++;
            i++;
            continue;
        }
        if (ch === "/" && source[i + 1] === "/") {
            while (i < source.length && source[i] !== "\n")
                i++;
            continue;
        }
        // Numbers
        if (/[0-9]/.test(ch)) {
            let value = "";
            while (i < source.length && /[0-9.]/.test(source[i])) {
                value += source[i];
                i++;
            }
            tokens.push({ type: value.includes(".") ? "FLOAT" : "INT", value, line });
            continue;
        }
        // Strings
        if (ch === '"' || ch === "'") {
            const quote = ch;
            i++;
            let value = "";
            while (i < source.length && source[i] !== quote) {
                value += source[i];
                i++;
            }
            i++;
            tokens.push({ type: "STRING", value, line });
            continue;
        }
        // Identifiers & Keywords
        if (/[a-zA-Z_]/.test(ch)) {
            let value = "";
            while (i < source.length && /[a-zA-Z0-9_]/.test(source[i])) {
                value += source[i];
                i++;
            }
            const keywords = {
                function: "FUNCTION",
                return: "RETURN",
                let: "LET",
                const: "CONST",
                true: "TRUE",
                false: "FALSE",
                int: "TYPE",
                string: "TYPE",
                bool: "TYPE",
                float: "TYPE",
            };
            tokens.push({ type: keywords[value] || "IDENTIFIER", value, line });
            continue;
        }
        // Multi-character Operators
        const multiOp3 = source.slice(i, i + 3);
        const multiOp2 = source.slice(i, i + 2);
        if (multiOp3 === "===") {
            tokens.push({ type: "OPERATOR", value: "===", line });
            i += 3;
            continue;
        }
        if (multiOp2 === "==" ||
            multiOp2 === ">=" ||
            multiOp2 === "<=" ||
            multiOp2 === "->") {
            tokens.push({
                type: multiOp2 === "->" ? "ARROW" : "OPERATOR",
                value: multiOp2,
                line,
            });
            i += 2;
            continue;
        }
        // Single Characters
        switch (ch) {
            case "=":
                tokens.push({ type: "EQUALS", value: "=", line });
                break;
            case "+":
            case "-":
            case "*":
            case "/":
            case ">":
            case "<":
            case ".":
                tokens.push({ type: "OPERATOR", value: ch, line });
                break;
            case "{":
                tokens.push({ type: "LBRACE", value: "{", line });
                break;
            case "}":
                tokens.push({ type: "RBRACE", value: "}", line });
                break;
            case "(":
                tokens.push({ type: "LPAREN", value: "(", line });
                break;
            case ")":
                tokens.push({ type: "RPAREN", value: ")", line });
                break;
            case ":":
                tokens.push({ type: "COLON", value: ":", line });
                break;
            case ",":
                tokens.push({ type: "COMMA", value: ",", line });
                break;
            case "!":
                tokens.push({ type: "BANG", value: "!", line });
                break;
        }
        i++;
    }
    return tokens;
}
