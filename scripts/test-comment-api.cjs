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
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (error) {
            reject(error);
          }
        });
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
      ["歌曲", "/comment/new?id=347230&type=0&pageNo=1&pageSize=2&sortType=99"],
      ["MV", "/comment/new?id=4909&type=1&pageNo=1&pageSize=2&sortType=99"],
      [
        "歌单",
        "/comment/new?id=3778678&type=2&pageNo=1&pageSize=2&sortType=99",
      ],
      ["专辑", "/comment/new?id=32311&type=3&pageNo=1&pageSize=2&sortType=99"],
      [
        "播客节目",
        "/comment/new?id=3726931192&type=4&pageNo=1&pageSize=2&sortType=99",
      ],
      [
        "视频",
        "/comment/new?id=12C8316C513E0457C62B53779608D33B&type=5&pageNo=1&pageSize=2&sortType=99",
      ],
      [
        "回复楼层",
        "/comment/floor?parentCommentId=5031795&id=347230&type=0&limit=2",
      ],
      [
        "动态评论",
        "/comment/event?threadId=R_VI_62_12C8316C513E0457C62B53779608D33B&limit=2",
      ],
    ];
    for (const [label, path] of routes) {
      const result = await get(path);
      const code = Number(result.body.code);
      if (![200, 301].includes(code)) {
        throw new Error(`${label} ${path} -> code=${code}`);
      }
      console.log(
        code === 200
          ? `PASS | ${label} ${path} -> code=200`
          : `SKIP | ${label} 需要登录态 cookie`,
      );
    }
    console.log("多资源评论真实 API 路由测试通过");
  } finally {
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  server.kill();
  process.exit(1);
});
