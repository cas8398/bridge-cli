"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
exports.log = {
    title: (msg) => console.log(`\n\x1b[36m🌉 ${msg}\x1b[0m`),
    file: (f) => console.log(`  \x1b[90m📄\x1b[0m ${f}`),
    info: (msg) => console.log(`  \x1b[36mℹ\x1b[0m ${msg}`),
    success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
    error: (msg) => console.error(`\x1b[31m❌ ${msg}\x1b[0m`),
};
