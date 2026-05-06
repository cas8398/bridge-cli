#!/usr/bin/env node
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const lexer_1 = require("./lexer");
const parser_1 = require("./parser");
const php_1 = require("./compiler/php");
const typescript_1 = require("./compiler/typescript");
const node_1 = require("./compiler/node");
const php_to_bridge_1 = require("./converters/php-to-bridge");
const ts_to_bridge_1 = require("./converters/ts-to-bridge");
const logger_1 = require("./utils/logger");
const file_1 = require("./utils/file");
/**
 * BRIDGE CLI
 * The "Flutter for Business Logic" build tool.
 */
const defaultConfig = {
    src: "src",
    outDir: ".bridge",
    targets: ["php", "ts", "node"],
    preserveName: true,
};
function loadConfig(cwd) {
    const configPath = path.join(cwd, "bridge.config.json");
    if (fs.existsSync(configPath)) {
        try {
            const userConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
            return { ...defaultConfig, ...userConfig };
        }
        catch (e) {
            logger_1.log.error("Malformed bridge.config.json. Using defaults.");
        }
    }
    return defaultConfig;
}
function build(cwd) {
    const config = loadConfig(cwd);
    const srcDir = path.join(cwd, config.src);
    if (!fs.existsSync(srcDir))
        return logger_1.log.error(`Source directory not found: ${srcDir}`);
    const files = (0, file_1.findFiles)(srcDir, ".bridge");
    if (files.length === 0)
        return logger_1.log.error(`No .bridge files found in ${srcDir}`);
    logger_1.log.title(`Building ${files.length} file(s)`);
    for (const file of files) {
        const baseName = path.basename(file, ".bridge");
        const content = (0, file_1.readFile)(path.join(srcDir, file));
        // Process AST
        const tokens = (0, lexer_1.lexer)(content);
        const ast = (0, parser_1.parser)(tokens);
        if (ast.functions.length === 0)
            continue;
        logger_1.log.info(`Processing ${baseName} → [${config.targets.join(", ")}]`);
        // Output is dynamic based on config.outDir
        const outRoot = path.join(cwd, config.outDir);
        for (const target of config.targets) {
            const targetDir = path.join(outRoot, target);
            (0, file_1.ensureDir)(targetDir);
            const outputName = config.preserveName ? baseName : "logic";
            switch (target) {
                case "php":
                    (0, php_1.compileToPHP)(ast, targetDir, outputName);
                    break;
                case "ts":
                    (0, typescript_1.compileToTypeScript)(ast, targetDir, outputName);
                    break;
                case "node":
                    (0, node_1.compileToNode)(ast, targetDir, outputName);
                    break;
                default:
                    logger_1.log.error(`Unsupported target: ${target}`);
            }
        }
    }
    logger_1.log.success("Build complete!");
}
function toBridge(input, output) {
    if (!input)
        return logger_1.log.error("Please provide an input file (e.g., bridge to-bridge logic.php)");
    // Resolve case-sensitivity for Linux/Debian
    const cwd = process.cwd();
    let finalInput = input;
    if (!fs.existsSync(input)) {
        const files = fs.readdirSync(cwd);
        const match = files.find((f) => f.toLowerCase() === input.toLowerCase());
        if (match)
            finalInput = match;
        else
            return logger_1.log.error(`File not found: ${input}`);
    }
    const config = loadConfig(cwd);
    const ext = path.extname(finalInput);
    const baseName = path.basename(finalInput, ext);
    // DYNAMIC: Keep conversion source inside the hidden .bridge/to-bridge folder
    // but uses the config's outDir as the parent
    const internalDir = path.join(cwd, config.outDir, "to-bridge");
    (0, file_1.ensureDir)(internalDir);
    const outFile = output || path.join(internalDir, `${baseName}.bridge`);
    if (ext === ".php") {
        (0, php_to_bridge_1.convertPHPToBridge)(finalInput, outFile);
    }
    else if (ext === ".ts") {
        (0, ts_to_bridge_1.convertTSToBridge)(finalInput, outFile);
    }
    else {
        return logger_1.log.error(`Cannot convert ${ext} files to .bridge`);
    }
    logger_1.log.success(`Reversed ${finalInput} → ${outFile}`);
    logger_1.log.info(`Tip: Move this to your '${config.src}' folder to include it in builds.`);
}
function newProject(name) {
    const dir = path.join(process.cwd(), name);
    if (fs.existsSync(dir))
        return logger_1.log.error(`Directory ${name} exists`);
    (0, file_1.ensureDir)(dir);
    (0, file_1.ensureDir)(path.join(dir, "src"));
    const example = `function calculateTotal(price: float, tax: float): float {\n  let total = price * (1 + tax)\n  return total\n}`;
    (0, file_1.writeFile)(path.join(dir, "src/logic.bridge"), example);
    (0, file_1.writeFile)(path.join(dir, "bridge.config.json"), JSON.stringify(defaultConfig, null, 2));
    logger_1.log.title(`Project '${name}' initialized`);
}
function help() {
    console.log(`
🌉 BRIDGE CLI
Version: 1.0.0 (Raw Dev)

Commands:
  build                     Build .bridge files into targets
  to-bridge <file>          Reverse PHP/TS into .bridge logic
  new <name>                Initialize a new Bridge project
  help                      Show this menu
  `);
}
// Execution Logic
const [cmd, ...args] = process.argv.slice(2);
const cwd = process.cwd();
switch (cmd) {
    case "build":
        build(cwd);
        break;
    case "to-bridge":
        toBridge(args[0], args[1]);
        break;
    case "new":
        newProject(args[0]);
        break;
    case "help":
    default:
        help();
        break;
}
