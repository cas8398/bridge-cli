#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const cliPath = path.join(__dirname, "dist/cli.js");
if (!fs.existsSync(cliPath)) {
  console.log("Building...");
  spawn("npm", ["run", "build"], { stdio: "inherit", shell: true }).on(
    "close",
    () => run()
  );
} else {
  run();
}

function run() {
  spawn("node", [cliPath, ...process.argv.slice(2)], { stdio: "inherit" });
}
