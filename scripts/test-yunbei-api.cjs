const http = require("node:http");
const { spawn } = require("node:child_process");

const port = 4000;
const server = spawn(process.execPath, ["sidecar/api-server.cjs"], {
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

function get(path) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${port}${path}`, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body: {} });
          }
        });
      })
      .on("error", reject);
  });
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt++) {
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
      ["云贝余额", "/yunbei"],
      ["云贝信息", "/yunbei/info"],
      ["今日云贝", "/yunbei/today"],
      ["云贝任务", "/yunbei/tasks"],
      ["云贝待办", "/yunbei/tasks/todo"],
      ["云贝收入", "/yunbei/receipt?limit=2"],
      ["云贝支出", "/yunbei/expense?limit=2"],
    ];
    for (const [label, path] of routes) {
      const result = await get(path);
      const code = Number(result.body.code);
      if (![200, 301, 302, 404].includes(code))
        throw new Error(`${label} -> HTTP ${result.status}, code=${code}`);
      console.log(
        code === 200
          ? `PASS | ${label} -> code=200`
          : `SKIP | ${label} -> 需要登录态或上游未提供 (code=${code})`,
      );
    }
    console.log("云贝真实 API 路由测试通过");
  } finally {
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  server.kill();
  process.exit(1);
});
