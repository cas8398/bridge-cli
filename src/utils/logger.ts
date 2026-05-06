export const log = {
  title: (msg: string) => console.log(`\n\x1b[36m🌉 ${msg}\x1b[0m`),
  file: (f: string) => console.log(`  \x1b[90m📄\x1b[0m ${f}`),
  info: (msg: string) => console.log(`  \x1b[36mℹ\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
  error: (msg: string) => console.error(`\x1b[31m❌ ${msg}\x1b[0m`),
};
