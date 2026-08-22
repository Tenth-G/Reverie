const http = require("node:http");
const { spawn } = require("node:child_process");

const port = 3997;
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
    const routes = [
      "/msg/private?limit=2",
      "/msg/recentcontact",
      "/msg/private/history?uid=9003&limit=2",
      "/msg/comments?uid=32953014&limit=2",
      "/msg/forwards?limit=2",
      "/msg/notices?limit=2",
    ];
    for (const path of routes) {
      const result = await get(path);
      const code = Number(result.body.code);
      if (![200, 301].includes(code))
        throw new Error(`${path} -> code=${code}`);
      console.log(
        code === 200
          ? `PASS | ${path} -> code=200`
          : `SKIP | ${path} 需要登录态 cookie`,
      );
    }
    console.log("消息中心真实 API 路由测试通过");
  } finally {
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  server.kill();
  process.exit(1);
});
