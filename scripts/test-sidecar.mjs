import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const triples = {
  "win32-x64": ["x86_64-pc-windows-msvc", ".exe"],
  "win32-arm64": ["aarch64-pc-windows-msvc", ".exe"],
  "linux-x64": ["x86_64-unknown-linux-gnu", ""],
  "linux-arm64": ["aarch64-unknown-linux-gnu", ""],
  "darwin-x64": ["x86_64-apple-darwin", ""],
  "darwin-arm64": ["aarch64-apple-darwin", ""],
};

const [triple, extension] =
  triples[`${process.platform}-${process.arch}`] ?? [];
if (!triple) throw new Error("Unsupported platform for the API sidecar test");

const root = resolve(import.meta.dirname, "..");
const binary = join(
  root,
  "src-tauri",
  "binaries",
  `reverie-api-${triple}${extension}`,
);
if (!existsSync(binary))
  throw new Error("Sidecar is missing; run npm run prepare:sidecar");

const port = 3959;
const child = spawn(binary, [], {
  env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
  stdio: ["ignore", "pipe", "pipe"],
});

const timeout = setTimeout(
  () => finish(new Error("Sidecar startup timed out")),
  30000,
);
let finished = false;

async function finish(error) {
  if (finished) return;
  finished = true;
  clearTimeout(timeout);
  child.kill();
  if (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

child.on("error", finish);
child.stderr.on("data", (data) => process.stderr.write(data));
child.stdout.on("data", async (data) => {
  process.stdout.write(data);
  if (!data.toString().includes("server running")) return;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/login/status`);
    const body = await response.json();
    if (!response.ok || !body || typeof body !== "object") {
      throw new Error(`Unexpected API response: HTTP ${response.status}`);
    }
    console.log("API sidecar smoke test passed");
    await finish();
  } catch (error) {
    await finish(error);
  }
});
