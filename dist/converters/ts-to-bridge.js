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
exports.convertTSToBridge = convertTSToBridge;
const fs = __importStar(require("fs"));
const logger_1 = require("../utils/logger");
function convertTSToBridge(input, output) {
    const content = fs.readFileSync(input, "utf8");
    // Matches standard and exported functions
    const functionRegex = /(?:export\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([\w<>\[\]]+))?\s*\{([\s\S]*?)\n\s*\}/gs;
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
            if (pType === "number")
                pType = "int"; // Defaulting to int, or use float
            if (pType === "boolean")
                pType = "bool";
            return `${pName}: ${pType || "any"}`;
        });
        // --- Return Type Transformation ---
        let ret = returnType || "void";
        if (ret === "number")
            ret = "int";
        if (ret === "boolean")
            ret = "bool";
        bridge += `function ${name}(${params.join(", ")}): ${ret} {\n${body}\n}\n\n`;
    }
    if (!bridge) {
        logger_1.log.error("No valid TypeScript functions found.");
        return;
    }
    fs.writeFileSync(output, bridge.trim() + "\n");
    logger_1.log.success(`Successfully reversed TypeScript into ${output}`);
}
