#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { lexer } from "./lexer";
import { parser, AST } from "./parser";
import { compileToPHP } from "./compiler/php";
import { compileToTypeScript } from "./compiler/typescript";
import { compileToNode } from "./compiler/node";
import { convertPHPToBridge } from "./converters/php-to-bridge";
import { convertTSToBridge } from "./converters/ts-to-bridge";
import { log } from "./utils/logger";
import { findFiles, readFile, writeFile, ensureDir } from "./utils/file";

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

function loadConfig(cwd: string) {
  const configPath = path.join(cwd, "bridge.config.json");
  if (fs.existsSync(configPath)) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      return { ...defaultConfig, ...userConfig };
    } catch (e) {
      log.error("Malformed bridge.config.json. Using defaults.");
    }
  }
  return defaultConfig;
}

function build(cwd: string) {
  const config = loadConfig(cwd);
  const srcDir = path.join(cwd, config.src);

  if (!fs.existsSync(srcDir))
    return log.error(`Source directory not found: ${srcDir}`);

  const files = findFiles(srcDir, ".bridge");
  if (files.length === 0)
    return log.error(`No .bridge files found in ${srcDir}`);

  log.title(`Building ${files.length} file(s)`);

  for (const file of files) {
    const baseName = path.basename(file, ".bridge");
    const content = readFile(path.join(srcDir, file));

    // Process AST
    const tokens = lexer(content);
    const ast = parser(tokens);

    if (ast.functions.length === 0) continue;

    log.info(`Processing ${baseName} → [${config.targets.join(", ")}]`);

    // Output is dynamic based on config.outDir
    const outRoot = path.join(cwd, config.outDir);

    for (const target of config.targets) {
      const targetDir = path.join(outRoot, target);
      ensureDir(targetDir);

      const outputName = config.preserveName ? baseName : "logic";

      switch (target) {
        case "php":
          compileToPHP(ast, targetDir, outputName);
          break;
        case "ts":
          compileToTypeScript(ast, targetDir, outputName);
          break;
        case "node":
          compileToNode(ast, targetDir, outputName);
          break;
        default:
          log.error(`Unsupported target: ${target}`);
      }
    }
  }

  log.success("Build complete!");
}

function toBridge(input: string, output?: string) {
  if (!input)
    return log.error(
      "Please provide an input file (e.g., bridge to-bridge logic.php)"
    );

  // Resolve case-sensitivity for Linux/Debian
  const cwd = process.cwd();
  let finalInput = input;
  if (!fs.existsSync(input)) {
    const files = fs.readdirSync(cwd);
    const match = files.find((f) => f.toLowerCase() === input.toLowerCase());
    if (match) finalInput = match;
    else return log.error(`File not found: ${input}`);
  }

  const config = loadConfig(cwd);
  const ext = path.extname(finalInput);
  const baseName = path.basename(finalInput, ext);

  // DYNAMIC: Keep conversion source inside the hidden .bridge/to-bridge folder
  // but uses the config's outDir as the parent
  const internalDir = path.join(cwd, config.outDir, "to-bridge");
  ensureDir(internalDir);

  const outFile = output || path.join(internalDir, `${baseName}.bridge`);

  if (ext === ".php") {
    convertPHPToBridge(finalInput, outFile);
  } else if (ext === ".ts") {
    convertTSToBridge(finalInput, outFile);
  } else {
    return log.error(`Cannot convert ${ext} files to .bridge`);
  }

  log.success(`Reversed ${finalInput} → ${outFile}`);
  log.info(
    `Tip: Move this to your '${config.src}' folder to include it in builds.`
  );
}

function newProject(name: string) {
  const dir = path.join(process.cwd(), name);
  if (fs.existsSync(dir)) return log.error(`Directory ${name} exists`);

  ensureDir(dir);
  ensureDir(path.join(dir, "src"));

  const example = `function calculateTotal(price: float, tax: float): float {\n  let total = price * (1 + tax)\n  return total\n}`;
  writeFile(path.join(dir, "src/logic.bridge"), example);
  writeFile(
    path.join(dir, "bridge.config.json"),
    JSON.stringify(defaultConfig, null, 2)
  );

  log.title(`Project '${name}' initialized`);
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
