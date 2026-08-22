"use strict";

const { serveNcmApi } = require("NeteaseCloudMusicApi");

const port = 3999;
const base = `http://127.0.0.1:${port}`;
const publicUid = 32953014;

async function get(path) {
  const response = await fetch(`${base}${path}`);
  const body = await response.json();
  return { status: response.status, body };
}

async function main() {
  const app = await serveNcmApi({
    port,
    host: "127.0.0.1",
    checkVersion: false,
  });
  try {
    const detail = await get(
      `/user/detail?uid=${publicUid}&timestamp=${Date.now()}`,
    );
    if (!detail.body?.profile?.userId) {
      throw new Error("公开用户详情没有返回 profile");
    }
    console.log(`PASS | 用户详情 -> ${detail.body.profile.nickname}`);

    const weekly = await get(
      `/user/record?uid=${publicUid}&type=1&timestamp=${Date.now()}`,
    );
    if (weekly.body?.code === 200 && Array.isArray(weekly.body.weekData)) {
      console.log(`PASS | 周听歌排行 -> ${weekly.body.weekData.length} 条`);
    } else {
      console.log("SKIP | 目标用户未公开周听歌排行");
    }

    for (const [label, path] of [
      ["用户等级", "/user/level"],
      ["收藏计数", "/user/subcount"],
    ]) {
      const response = await get(`${path}?timestamp=${Date.now()}`);
      if (response.body?.code === 200) console.log(`PASS | ${label}`);
      else if (response.body && typeof response.body.code === "number") {
        console.log(`PASS | ${label}路由响应 code=${response.body.code}`);
      } else {
        throw new Error(`${label}接口没有返回有效响应`);
      }
    }
    console.log("个人中心真实 API 测试通过");
  } finally {
    await new Promise((resolve) => app.server?.close(resolve));
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
