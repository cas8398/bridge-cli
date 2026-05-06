import * as fs from "fs";
import * as path from "path";

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
export function writeFile(p: string, content: string) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
}
export function readFile(p: string) {
  return fs.readFileSync(p, "utf8");
}
export function findFiles(dir: string, ext: string) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(ext));
}
