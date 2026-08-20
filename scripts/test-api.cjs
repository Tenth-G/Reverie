"use strict";

const { serveNcmApi } = require("NeteaseCloudMusicApi");

const PORT = 3949;
const BASE = `http://127.0.0.1:${PORT}`;
const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(
    `${pass ? "PASS" : "FAIL"} | ${name}${detail ? "  ->  " + detail : ""}`,
  );
}

async function req(path) {
  const r = await fetch(BASE + path);
  const text = await r.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: r.status, body };
}

async function main() {
  await serveNcmApi({ port: PORT, host: "127.0.0.1", checkVersion: false });
  console.log(`API 服务已启动 @ ${BASE}\n`);

  /* 1. search */
  const s = await req(
    "/search?keywords=%E5%91%A8%E6%9D%B0%E4%BC%A6&limit=10&timestamp=" +
      Date.now(),
  );
  record(
    "搜索接口 /search",
    s.status === 200 && (s.body?.result?.songs?.length || 0) > 0,
    `${s.body?.result?.songs?.length || 0} 首`,
  );

  /* 2. song/detail fields */
  const d = await req("/song/detail?ids=186016&timestamp=" + Date.now());
  const song = d.body?.songs?.[0];
  record(
    "歌曲详情 /song/detail (ar/al/picUrl)",
    !!(song?.name && song?.ar?.length && song?.al?.name && song?.al?.picUrl),
    `${song?.name} - ${song?.ar?.map((a) => a.name).join("/")} | 专辑:${song?.al?.name}`,
  );

  /* 3. find a free playable song */
  let freeSong = null;
  const ids = [509781655, 186016, 347230];
  for (const id of ids) {
    const u = await req(
      `/song/url/v1?id=${id}&level=standard&timestamp=${Date.now()}`,
    );
    if (u.body?.data?.[0]?.url) {
      freeSong = { id, url: u.body.data[0].url, br: u.body.data[0].br };
      break;
    }
  }
  record(
    "播放地址 /song/url/v1 (免费歌曲)",
    !!freeSong?.url,
    freeSong ? `id=${freeSong.id} br=${freeSong.br}` : "测试歌曲均需登录",
  );

  /* 4. lyric */
  const l = await req("/lyric?id=186016&timestamp=" + Date.now());
  record(
    "歌词接口 /lyric",
    !!l.body?.lrc?.lyric,
    `lrc 长度 ${(l.body?.lrc?.lyric || "").length}`,
  );

  /* 5. QR key */
  const k = await req("/login/qr/key?timestamp=" + Date.now());
  const unikey = k.body?.data?.unikey;
  record("扫码-获取key /login/qr/key", !!unikey, unikey || "");

  /* 6. QR create */
  const c = await req(
    `/login/qr/create?key=${unikey}&qrimg=true&timestamp=${Date.now()}`,
  );
  const qrimg = c.body?.data?.qrimg;
  record(
    "扫码-生成二维码 /login/qr/create",
    !!qrimg && qrimg.startsWith("data:image"),
    `base64 长度 ${(qrimg || "").length}`,
  );

  /* 7. QR check (waiting state) */
  const chk = await req(
    `/login/qr/check?key=${unikey}&timestamp=${Date.now()}`,
  );
  const code = chk.body?.code;
  record(
    "扫码-轮询 /login/qr/check",
    [800, 801, 802].includes(code),
    `code=${code} (801=等待扫码)`,
  );

  /* 8. toplist + top/song */
  const t = await req("/toplist?timestamp=" + Date.now());
  record(
    "排行榜 /toplist",
    (t.body?.list?.length || 0) > 0,
    `${t.body?.list?.length || 0} 个榜单`,
  );
  const ts = await req("/top/song?type=0&timestamp=" + Date.now());
  record(
    "歌曲榜 /top/song",
    (ts.body?.data?.length || 0) > 0,
    `${ts.body?.data?.length || 0} 首`,
  );

  /* 9. playlist detail */
  const pl = await req("/playlist/detail?id=3778678&timestamp=" + Date.now());
  record(
    "歌单详情 /playlist/detail",
    (pl.body?.playlist?.tracks?.length || 0) > 0,
    `${pl.body?.playlist?.name} · ${pl.body?.playlist?.tracks?.length || 0} 首`,
  );

  /* 10. login-required endpoints (should indicate need-login without cookie) */
  const ls = await req("/login/status?timestamp=" + Date.now());
  const notLoggedIn = !ls.body?.data?.profile && !ls.body?.profile;
  record(
    "登录状态 /login/status (未登录)",
    notLoggedIn === true,
    JSON.stringify({ code: ls.body?.code, data: ls.body?.data }).slice(0, 60),
  );

  const rec = await req("/recommend/songs?timestamp=" + Date.now());
  record(
    "每日推荐 /recommend/songs",
    rec.body?.code === 200,
    `code=${rec.body?.code} (未登录返回默认推荐，登录后个性化)`,
  );

  const fm = await req("/personal_fm?timestamp=" + Date.now());
  record(
    "私人FM /personal_fm",
    fm.body?.code === 200 || Array.isArray(fm.body?.data),
    `code=${fm.body?.code} data=${fm.body?.data?.length ?? 0} 首`,
  );

  /* 11. like endpoints (need login, should still respond) */
  const like = await req("/like?id=186016&like=true&timestamp=" + Date.now());
  record(
    "红心 /like",
    typeof like.body?.code === "number",
    `code=${like.body?.code}${like.body?.code === 301 ? "(需登录)" : ""}`,
  );
  const likelist = await req("/likelist?uid=1&timestamp=" + Date.now());
  record(
    "喜欢列表 /likelist",
    typeof likelist.body?.code === "number" ||
      Array.isArray(likelist.body?.ids),
    `code=${likelist.body?.code}${Array.isArray(likelist.body?.ids) ? " ids=" + likelist.body.ids.length : ""}`,
  );

  /* summary */
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(`\n===== API 测试结果: ${passed}/${results.length} 通过 =====`);
  if (failed.length) failed.forEach((f) => console.log("  FAIL:", f.name));

  require("fs").writeFileSync(
    require("path").join(__dirname, "..", "test-results", "api-report.json"),
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        total: results.length,
        passed,
        details: results,
      },
      null,
      2,
    ),
  );

  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error("API 测试异常:", e);
  process.exit(2);
});
