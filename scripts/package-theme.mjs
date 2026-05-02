import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const essentialPaths = ["templates", "README.md", "LICENSE", "i18n", "theme.yaml", "settings.yaml"];

async function readThemeName() {
  const themeYaml = await fs.readFile(path.join(process.cwd(), "theme.yaml"), "utf8");
  const match = themeYaml.match(/^\s*name:\s*([^\s]+)\s*$/m);
  if (!match) {
    throw new Error("Cannot find metadata.name in theme.yaml");
  }
  return match[1];
}

async function ensureCleanDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function copyEntry(name, outputDir) {
  const sourcePath = path.join(process.cwd(), name);
  const targetPath = path.join(outputDir, name);
  await execFileAsync("cp", ["-R", sourcePath, targetPath]);
}

async function zipDirectory(outputDir, zipPath) {
  await fs.rm(zipPath, { force: true });
  await execFileAsync("zip", ["-rq", zipPath, "."], { cwd: outputDir });
}

async function main() {
  const themeName = await readThemeName();
  const distDir = path.join(process.cwd(), "dist");
  const outputDir = path.join(distDir, themeName);
  const zipPath = path.join(distDir, `${themeName}.zip`);

  await fs.mkdir(distDir, { recursive: true });
  await ensureCleanDir(outputDir);

  for (const entry of essentialPaths) {
    await copyEntry(entry, outputDir);
  }

  await zipDirectory(outputDir, zipPath);

  console.log(`✅ Packaged successfully: ${zipPath}`);
  console.log(`Source directory: ${outputDir}`);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
