import { _electron as electron } from "playwright-core";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const OUT_DIR = "test-results";

const results = [];
function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(
    `${pass ? "PASS" : "FAIL"} | ${name}${detail ? "  ->  " + detail : ""}`,
  );
}

async function logoutIfNeeded(win) {
  if ((await win.locator(".user-menu").count()) > 0) {
    await win.locator(".topnav-user").click();
    await win.waitForSelector(".user-dropdown", { timeout: 5000 });
    await win.locator(".user-dropdown-item.danger").click();
    await win.waitForTimeout(600);
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const electronPath = require("electron");
  const app = await electron.launch({
    args: ["."],
    executablePath: electronPath,
    // Skip the auto update check (it hits the GitHub API and may be rate-limited).
    env: { ...process.env, REVERIE_SKIP_UPDATE: "1" },
  });
  const win = await app.firstWindow();

  const rendererErrors = [];
  win.on("console", (msg) => {
    if (msg.type() === "error") rendererErrors.push(msg.text());
  });

  await win.waitForLoadState("domcontentloaded");
  await win.waitForTimeout(2500);

  // establish a known logged-out state
  await logoutIfNeeded(win);

  /* 1. shell */
  record(
    "窗口标题为 Reverie",
    (await win.title()) === "Reverie",
    await win.title(),
  );
  record("自定义标题栏渲染", (await win.locator(".titlebar").count()) === 1);
  record(
    "标题栏居中显示 Reverie",
    (await win.locator(".titlebar-name").textContent()) === "Reverie",
  );
  // macOS uses its native traffic lights, so only the settings button is drawn;
  // Windows/Linux draw all four.
  const isMac = process.platform === "darwin";
  const expectedTbBtns = isMac ? 1 : 4;
  const tbBtns = await win.locator(".tb-btn").count();
  record(
    isMac
      ? "窗口控制按钮 (mac: 仅设置，窗口按钮交给系统)"
      : "窗口控制按钮 (4个: 设置/最小化/最大化/关闭)",
    tbBtns === expectedTbBtns,
    `${tbBtns} 个`,
  );
  if (isMac) {
    record(
      "mac 标记 data-platform=darwin",
      (await win.evaluate(() =>
        document.documentElement.getAttribute("data-platform"),
      )) === "darwin",
    );
  }
  record("顶部导航栏渲染", (await win.locator(".topnav").count()) === 1);
  record("左侧导航已移除", (await win.locator(".sidebar").count()) === 0);
  record("悬浮播放栏渲染", (await win.locator(".player-bar").count()) === 1);

  /* 2. not-logged-in: home shows no data */
  record(
    "未登录首页不显示数据",
    (await win.locator(".login-empty").count()) === 1,
  );
  record(
    "未登录首页无分区",
    (await win.locator(".home-section").count()) === 0,
  );
  const loginText = await win.locator(".topnav-login").textContent();
  const loginSvg = await win.locator(".topnav-login svg").count();
  record(
    '登录按钮仅显示"登录"二字',
    (loginText || "").trim() === "登录" && loginSvg === 0,
    `text="${loginText}" icon=${loginSvg}`,
  );
  await win.screenshot({ path: `${OUT_DIR}/e2e-01-home-notlogged.png` });

  /* 3. not-logged-in: chart shows no data */
  await win.locator(".topnav-item").filter({ hasText: "排行榜" }).click();
  await win.waitForTimeout(500);
  record(
    "未登录排行榜无数据",
    (await win.locator(".login-empty").count()) === 1 &&
      (await win.locator(".song-item").count()) === 0,
  );

  /* 4. not-logged-in: search shows no data (login hint) */
  await win.locator('button[title="搜索"]').click();
  await win.waitForTimeout(300);
  record(
    "搜索胶囊展开",
    (await win.locator(".search-capsule input").count()) === 1,
  );
  await win.fill(".search-capsule input", "周杰伦");
  await win.press(".search-capsule input", "Enter");
  await win.waitForTimeout(1200);
  record(
    "未登录搜索不显示结果",
    (await win.locator(".search-dropdown-item").count()) === 0,
  );
  record(
    "未登录搜索显示登录提示",
    (await win.locator(".search-login-hint").count()) === 1,
  );
  await win.screenshot({ path: `${OUT_DIR}/e2e-02-search-notlogged.png` });
  await win.locator(".search-close").click();
  await win.waitForTimeout(300);

  /* 5. theme (works without login) */
  await win.locator('button[title="设置"]').click();
  await win.waitForSelector(".modal", { timeout: 5000 });
  await win.locator(".opt-btn").filter({ hasText: "浅色" }).click();
  await win.waitForTimeout(300);
  record(
    "浅色主题生效",
    (await win.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    )) === "light",
  );
  await win.locator(".opt-btn").filter({ hasText: "深色" }).click();
  await win.waitForTimeout(300);
  record(
    "深色主题生效",
    (await win.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    )) === "dark",
  );
  await win.locator(".opt-btn").filter({ hasText: "跟随系统" }).click();
  await win.waitForTimeout(200);
  await win.locator(".modal-backdrop").click({ position: { x: 8, y: 8 } });
  await win.waitForTimeout(300);

  /* 6. login modal shows QR code */
  await win.locator(".topnav-login").click();
  await win.waitForSelector(".qr-box img", { timeout: 20000 });
  const qrSrc = await win.locator(".qr-box img").getAttribute("src");
  record(
    "登录二维码生成",
    (qrSrc || "").startsWith("data:image"),
    (qrSrc || "").slice(0, 40),
  );
  await win.screenshot({ path: `${OUT_DIR}/e2e-03-login.png` });
  await win.locator(".modal-backdrop").click({ position: { x: 8, y: 8 } });
  await win.waitForTimeout(300);

  record("未登录无头像下拉", (await win.locator(".user-menu").count()) === 0);

  /* 7. now-playing structure (no song -> placeholder + empty lyrics) */
  await win.locator(".pb-cover").click();
  await win.waitForTimeout(500);
  record("播放页打开", (await win.locator(".now-playing").count()) === 1);
  record("播放页隐藏顶部导航", await win.locator(".topnav").isHidden());
  record("播放页隐藏标题栏", await win.locator(".titlebar").isHidden());
  record(
    "播放页封面容器存在",
    (await win.locator(".np-cover-3d").count()) === 1,
  );
  record(
    "播放页歌词容器在封面上方",
    (await win.locator(".np-lyrics-3d").count()) === 1,
  );
  record(
    "歌词层级高于封面",
    await win.evaluate(() => {
      const cover = document.querySelector(".np-cover-3d");
      const lyrics = document.querySelector(".np-lyrics-3d");
      if (!cover || !lyrics) return false;
      return (
        Number(getComputedStyle(lyrics).zIndex) >
        Number(getComputedStyle(cover).zIndex)
      );
    }),
  );
  record(
    "无歌曲时歌词为空",
    await win.evaluate(() => {
      const cur = document.querySelector(".lyrics-3d-current");
      const next = document.querySelector(".lyrics-3d-next");
      return !!cur && !cur.textContent.trim() && !next.textContent.trim();
    }),
  );
  await win.screenshot({ path: `${OUT_DIR}/e2e-04-nowplaying.png` });
  await win.locator(".np-back").click();
  await win.waitForFunction(
    () => document.querySelectorAll(".now-playing").length === 0,
    null,
    { timeout: 5000 },
  );
  record("播放页返回", (await win.locator(".titlebar").count()) === 1);

  record(
    "无渲染进程错误",
    rendererErrors.length === 0,
    rendererErrors.slice(0, 3).join(" || ") || "clean",
  );

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(`\n===== E2E 测试结果: ${passed}/${results.length} 通过 =====`);
  if (failed.length) {
    console.log("未通过项:");
    failed.forEach((f) => console.log("  -", f.name));
  }

  writeFileSync(
    `${OUT_DIR}/e2e-report.json`,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        total: results.length,
        passed,
        failed: failed.map((f) => f.name),
        details: results,
        rendererErrors,
      },
      null,
      2,
    ),
  );

  await app.close();
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error("E2E 测试异常:", e);
  process.exit(2);
});
