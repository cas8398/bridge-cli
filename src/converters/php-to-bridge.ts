import * as fs from "fs";
import { log } from "../utils/logger";

export function convertPHPToBridge(input: string, output: string) {
  const content = fs.readFileSync(input, "utf8");

  // Matches PHP functions inside or outside classes
  const functionRegex =
    /(?:public|protected|private|static|\s)*function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\w+))?\s*\{([\s\S]*?)\n\s*\}/gs;

  let bridge = "";
  let match;

  while ((match = functionRegex.exec(content)) !== null) {
    const [_, name, paramsRaw, returnType, bodyRaw] = match;

    // --- Body Transformation ---
    let body = bodyRaw
      .trim()
      // 1. Convert "$var =" to "let var =" (Critical for your parser)
      .replace(/\$(\w+)\s*=/g, "let $1 =")
      // 2. Strip remaining '$' from variable usages
      .replace(/\$(\w+)/g, "$1")
      // 3. Convert PHP string concat '.' to '+'
      .replace(/\s\.\s/g, " + ")
      // 4. Remove semicolons and cleanup whitespace
      .replace(/;/g, "")
      .split("\n")
      .map((line) => `  ${line.trim()}`)
      .join("\n");

    // --- Params Transformation ---
    const params = paramsRaw
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p)
      .map((p) => {
        const clean = p.replace(/\$/g, ""); // Remove $
        const parts = clean.split(/\s+/);
        const pName = parts.pop();
        const pType = parts.pop() || "any";
        return `${pName}: ${pType}`;
      });

    const ret = returnType ? `: ${returnType}` : "";
    bridge += `function ${name}(${params.join(", ")})${ret} {\n${body}\n}\n\n`;
  }

  if (!bridge) {
    log.error("No valid PHP functions found.");
    return;
  }

  fs.writeFileSync(output, bridge.trim() + "\n");
  log.success(`Successfully reversed PHP into ${output}`);
}
