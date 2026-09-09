import { cp, mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(projectRoot, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(path.join(distDir, "assets"), { recursive: true });

execFileSync("npx", ["tsc"], { cwd: projectRoot, stdio: "inherit" });

await cp(path.join(projectRoot, "index.html"), path.join(distDir, "index.html"));
await cp(path.join(projectRoot, "src", "styles"), path.join(distDir, "assets", "css"), {
  recursive: true
});
await cp(path.join(projectRoot, "assets", "images"), path.join(distDir, "assets", "images"), {
  recursive: true
});

console.log("Build hoàn tất: dist/");
