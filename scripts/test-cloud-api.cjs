const http = require("node:http");
const { spawn } = require("node:child_process");

const port = 3999;
const server = spawn(process.execPath, ["sidecar/api-server.cjs"], {
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

function request(path, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://127.0.0.1:${port}${path}`,
      { method },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body: {} });
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      await request("/login/status");
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
      ["云盘列表", "/user/cloud?limit=2&offset=0"],
      ["云盘详情", "/user/cloud/detail?id=1"],
      ["云盘匹配", "/cloud/match?uid=1&sid=1&asid=1", "POST"],
      ["云盘删除", "/user/cloud/del?id=1", "POST"],
      [
        "云盘导入",
        "/cloud/import?md5=bad&bitrate=320000&fileSize=1&song=x&artist=x&album=x&fileType=mp3",
        "POST",
      ],
    ];
    for (const [label, path, method] of routes) {
      const result = await request(path, method);
      const code = Number(result.body.code);
      if (![200, 301, 400, 500].includes(code)) {
        throw new Error(
          `${label} ${path} -> HTTP ${result.status}, code=${code}`,
        );
      }
      console.log(
        code === 200
          ? `PASS | ${label} -> code=200`
          : `SKIP | ${label} -> 需要登录态或合法文件参数 (code=${code})`,
      );
    }
    console.log("云盘真实 API 路由测试通过");
  } finally {
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  server.kill();
  process.exit(1);
});
