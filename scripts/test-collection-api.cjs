const http = require("node:http");
const { spawn } = require("node:child_process");

const port = 3998;
const server = spawn(process.execPath, ["sidecar/api-server.cjs"], {
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
const get = (path) =>
  new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${port}${path}`, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: JSON.parse(body) }),
        );
      })
      .on("error", reject);
  });

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await get("/login/status");
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw lastError;
}

(async () => {
  try {
    await waitForServer();
    for (const path of [
      "/album/sublist?limit=2",
      "/artist/sublist?limit=2",
      "/mv/sublist?limit=2",
      "/dj/sublist?limit=2",
    ]) {
      const result = await get(path);
      if (result.status !== 200 || Number(result.body.code) !== 200)
        throw new Error(`${path} failed`);
      console.log(`PASS | ${path} -> code=${result.body.code}`);
    }
    console.log("收藏中心真实 API 测试通过");
  } finally {
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  server.kill();
  process.exit(1);
});
