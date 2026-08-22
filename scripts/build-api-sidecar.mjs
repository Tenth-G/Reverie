import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const targets = {
  "win32-x64": {
    pkg: "node22-win-x64",
    triple: "x86_64-pc-windows-msvc",
    extension: ".exe",
  },
  "win32-arm64": {
    pkg: "node22-win-arm64",
    triple: "aarch64-pc-windows-msvc",
    extension: ".exe",
  },
  "linux-x64": {
    pkg: "node22-linux-x64",
    triple: "x86_64-unknown-linux-gnu",
    extension: "",
  },
  "linux-arm64": {
    pkg: "node22-linux-arm64",
    triple: "aarch64-unknown-linux-gnu",
    extension: "",
  },
  "darwin-x64": {
    pkg: "node22-macos-x64",
    triple: "x86_64-apple-darwin",
    extension: "",
  },
  "darwin-arm64": {
    pkg: "node22-macos-arm64",
    triple: "aarch64-apple-darwin",
    extension: "",
  },
};

const key = `${process.platform}-${process.arch}`;
const target = targets[key];
if (!target) throw new Error(`Unsupported sidecar target: ${key}`);

const root = resolve(import.meta.dirname, "..");
const outputDir = join(root, "src-tauri", "binaries");
const output = join(
  outputDir,
  `reverie-api-${target.triple}${target.extension}`,
);
const input = join(root, "sidecar", "api-server.cjs");
const temporaryOutput = join(
  outputDir,
  `reverie-api-${target.triple}.tmp${target.extension}`,
);
const config = join(root, "package.json");
const lockfile = join(root, "package-lock.json");
const apiPackage = join(
  root,
  "node_modules",
  "NeteaseCloudMusicApi",
  "package.json",
);
const pkgCli = join(
  root,
  "node_modules",
  "@yao-pkg",
  "pkg",
  "lib-es5",
  "bin.js",
);

if (!existsSync(apiPackage)) {
  throw new Error("NeteaseCloudMusicApi is missing; run npm install first");
}

const newestInput = Math.max(
  statSync(import.meta.filename).mtimeMs,
  statSync(input).mtimeMs,
  statSync(config).mtimeMs,
  statSync(lockfile).mtimeMs,
  statSync(apiPackage).mtimeMs,
);
if (existsSync(output) && statSync(output).mtimeMs >= newestInput) {
  console.log(`API sidecar is current: ${output}`);
  process.exit(0);
}

mkdirSync(outputDir, { recursive: true });
rmSync(temporaryOutput, { force: true });
try {
  execFileSync(
    process.execPath,
    [
      pkgCli,
      input,
      "--config",
      config,
      "--target",
      target.pkg,
      "--public",
      "--public-packages",
      "*",
      "--no-bytecode",
      "--output",
      temporaryOutput,
    ],
    { cwd: root, stdio: "inherit" },
  );
  rmSync(output, { force: true });
  renameSync(temporaryOutput, output);
} finally {
  rmSync(temporaryOutput, { force: true });
}
console.log(`Built API sidecar: ${output}`);
