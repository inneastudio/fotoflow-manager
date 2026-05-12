import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const candidates = [
  join(root, "node_modules", "next", "dist", "bin", "next"),
  join(root, "..", "node_modules", "next", "dist", "bin", "next")
];
const nextBin = candidates.find((candidate) => existsSync(candidate));

if (!nextBin) {
  console.error("Next.js ni najden. Zaženi: npm install");
  process.exit(1);
}

const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code) => process.exit(code ?? 0));
