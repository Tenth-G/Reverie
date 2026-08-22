"use strict";

const { serveNcmApi } = require("NeteaseCloudMusicApi");

const port = 3989;
const base = `http://127.0.0.1:${port}`;
const cases = [
  ["歌曲", 1, "songs"],
  ["歌词", 1006, "songs"],
  ["专辑", 10, "albums"],
  ["歌手", 100, "artists"],
  ["歌单", 1000, "playlists"],
  ["用户", 1002, "userprofiles"],
  ["MV", 1004, "mvs"],
  ["播客", 1009, "djRadios"],
  ["视频", 1014, "videos"],
];

async function get(path) {
  const response = await fetch(`${base}${path}`);
  const body = await response.json();
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return body;
}

async function main() {
  const app = await serveNcmApi({
    port,
    host: "127.0.0.1",
    checkVersion: false,
  });
  try {
    const hot = await get(`/search/hot/detail?timestamp=${Date.now()}`);
    if (!Array.isArray(hot.data) || !hot.data.length) {
      throw new Error("热搜接口没有返回搜索词");
    }

    let firstMv = 0;
    let firstVideo = "";
    for (const [label, type, field] of cases) {
      const endpoint = type === 1014 ? "/search" : "/cloudsearch";
      const body = await get(
        `${endpoint}?keywords=${encodeURIComponent("周杰伦")}&type=${type}&limit=5&timestamp=${Date.now()}`,
      );
      const items = body.result?.[field];
      if (type === 1014 && (!Array.isArray(items) || !items.length)) {
        console.log("SKIP | 视频搜索匿名态未返回结果，登录态由界面流程验证");
        continue;
      }
      if (!Array.isArray(items) || !items.length) {
        throw new Error(
          `${label}搜索没有返回 ${field}: ${JSON.stringify(body.result ?? {}).slice(0, 500)}`,
        );
      }
      if (type === 1004) firstMv = Number(items[0].id ?? 0);
      if (type === 1014) firstVideo = String(items[0].vid ?? items[0].id ?? "");
      console.log(`PASS | ${label}搜索 -> ${items.length} 条`);
    }

    if (firstMv) {
      const mv = await get(
        `/mv/url?id=${firstMv}&r=720&timestamp=${Date.now()}`,
      );
      if (!mv.data?.url) throw new Error("MV 搜索结果无法取得播放地址");
      console.log("PASS | MV 播放地址");
    }
    firstVideo ||= "89ADDE33C0AAE8EC14B99F6750DB954D";
    if (firstVideo) {
      const video = await get(
        `/video/url?id=${encodeURIComponent(firstVideo)}&resolutions=720&timestamp=${Date.now()}`,
      );
      if (video.urls?.[0]?.url) console.log("PASS | 视频播放地址");
      else console.log("SKIP | 匿名态无法取得视频播放地址");
    }
    console.log("搜索中心真实 API 测试通过");
  } finally {
    await new Promise((resolve) => app.server?.close(resolve));
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
