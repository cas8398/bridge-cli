"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertPHPToBridge = convertPHPToBridge;
const fs = __importStar(require("fs"));
const logger_1 = require("../utils/logger");
function convertPHPToBridge(input, output) {
    const content = fs.readFileSync(input, "utf8");
    // Matches PHP functions inside or outside classes
    const functionRegex = /(?:public|protected|private|static|\s)*function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\w+))?\s*\{([\s\S]*?)\n\s*\}/gs;
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
        logger_1.log.error("No valid PHP functions found.");
        return;
    }
    fs.writeFileSync(output, bridge.trim() + "\n");
    logger_1.log.success(`Successfully reversed PHP into ${output}`);
}
