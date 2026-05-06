import * as fs from "fs";
import { log } from "../utils/logger";

export function convertTSToBridge(input: string, output: string) {
  const content = fs.readFileSync(input, "utf8");

  // Matches standard and exported functions
  const functionRegex =
    /(?:export\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([\w<>\[\]]+))?\s*\{([\s\S]*?)\n\s*\}/gs;

  let bridge = "";
  let match;

  while ((match = functionRegex.exec(content)) !== null) {
    const [_, name, paramsRaw, returnType, bodyRaw] = match;

    // --- Body Transformation ---
    let body = bodyRaw
      .trim()
      .replace(/;/g, "") // Bridge doesn't use semicolons
      .split("\n")
      .map((line) => `  ${line.trim()}`)
      .join("\n");

    // --- Params Transformation ---
    const params = paramsRaw
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p)
      .map((p) => {
        let [pName, pType] = p.split(":").map((s) => s.trim());
        // Map TS Types to Bridge Types
        if (pType === "number") pType = "int"; // Defaulting to int, or use float
        if (pType === "boolean") pType = "bool";
        return `${pName}: ${pType || "any"}`;
      });

    // --- Return Type Transformation ---
    let ret = returnType || "void";
    if (ret === "number") ret = "int";
    if (ret === "boolean") ret = "bool";

    bridge += `function ${name}(${params.join(
      ", "
    )}): ${ret} {\n${body}\n}\n\n`;
  }

  if (!bridge) {
    log.error("No valid TypeScript functions found.");
    return;
  }

  fs.writeFileSync(output, bridge.trim() + "\n");
  log.success(`Successfully reversed TypeScript into ${output}`);
}
