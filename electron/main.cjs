"use strict";

const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const path = require("path");

const API_PORT = 3939;
const API_HOST = "127.0.0.1";

/** Whether the in-app updater is enabled (packaged builds only). */
let updateEnabled = false;

/** True while the current check was triggered manually from the settings. */
let manualCheck = false;

/**
 * electron-updater's GitHub provider delivers releaseNotes as either a string
 * or an array of { version, note } (HTML from the GitHub Atom feed). Extract a
 * single note string for the newest version.
 */
function extractReleaseNotes(releaseNotes) {
  if (Array.isArray(releaseNotes)) {
    const entries = releaseNotes.filter(
      (n) => n && typeof n.note === "string" && n.note.trim(),
    );
    if (entries.length === 0) return "";
    entries.sort((a, b) =>
      String(b.version).localeCompare(String(a.version), undefined, {
        numeric: true,
      }),
    );
    return entries[0].note;
  }
  if (typeof releaseNotes === "string") return releaseNotes;
  if (releaseNotes && typeof releaseNotes.note === "string") {
    return releaseNotes.note;
  }
  return "";
}

/** Forward an updater event to every window (renderer drives the UI). */
function sendUpdateEvent(type, data) {
  for (const w of BrowserWindow.getAllWindows()) {
    w.webContents.send("update:event", { type, data });
  }
}

/**
 * Wire the electron-updater auto update flow:
 * detect the new version, show a modal with 取消/更新, download only after the
 * user confirms, then let them restart to install.
 * Only active in packaged builds; skipped for dev / e2e (REVERIE_SKIP_UPDATE=1).
 */
function setupUpdater() {
  if (!app.isPackaged) return;
  if (process.env.REVERIE_SKIP_UPDATE === "1") return;
  updateEnabled = true;

  // Never download without the user clicking 更新 in the dialog.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => sendUpdateEvent("checking"));
  autoUpdater.on("update-available", (info) => {
    sendUpdateEvent("available", {
      version: String(info.version),
      notes: extractReleaseNotes(info.releaseNotes),
      manual: manualCheck,
    });
    manualCheck = false;
  });
  autoUpdater.on("update-not-available", () => {
    sendUpdateEvent("not-available", { manual: manualCheck });
    manualCheck = false;
  });
  autoUpdater.on("download-progress", (p) =>
    sendUpdateEvent("progress", {
      percent: Math.round(p.percent || 0),
      transferred: p.transferred || 0,
      total: p.total || 0,
      speed: p.bytesPerSecond || 0,
    }),
  );
  autoUpdater.on("update-downloaded", () => sendUpdateEvent("downloaded"));
  autoUpdater.on("error", (err) => {
    sendUpdateEvent("error", {
      message: String((err && err.message) || err),
      manual: manualCheck,
    });
    manualCheck = false;
  });

  // Auto check shortly after launch (silent on failure).
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 5000);
}

// Window icon for dev / unpackaged runs (the packaged exe carries its own).
// Falls back to the default while no icon file is present in build/.
const WIN_ICON_ICO = path.join(__dirname, "..", "build", "icon.ico");
const WIN_ICON_PNG = path.join(__dirname, "..", "build", "icon.png");
const windowIcon = fs.existsSync(WIN_ICON_ICO)
  ? WIN_ICON_ICO
  : fs.existsSync(WIN_ICON_PNG)
    ? WIN_ICON_PNG
    : undefined;

/** @type {import('http').Server | null} */
let apiServer = null;

/** Is something already serving our API on `base`? (JSON reply => likely our server) */
async function probeApi(base) {
  try {
    const res = await fetch(`${base}/login/status?timestamp=${Date.now()}`, {
      signal: AbortSignal.timeout(3000),
    });
    const text = await res.text();
    return text.trimStart().startsWith("{");
  } catch {
    return false;
  }
}

/**
 * Start the embedded NeteaseCloudMusicApi server in-process.
 * The renderer talks to http://127.0.0.1:3939 directly.
 */
async function startApi() {
  const { serveNcmApi } = require("NeteaseCloudMusicApi");
  try {
    const expressApp = await serveNcmApi({
      port: API_PORT,
      host: API_HOST,
      checkVersion: false,
    });
    apiServer = expressApp.server;
    if (apiServer) {
      // serveNcmApi resolves even when the port is taken; the EADDRINUSE comes
      // later as an async 'error' event. Handle it instead of crashing.
      apiServer.on("error", async (err) => {
        if (err && err.code === "EADDRINUSE") {
          console.error(`[main] Port ${API_PORT} already in use:`, err.message);
          const ours = await probeApi(`http://${API_HOST}:${API_PORT}`);
          if (ours) {
            console.warn(
              `[main] Port ${API_PORT} already serving the music API — reusing it.`,
            );
            return;
          }
          try {
            dialog.showErrorBox(
              "Reverie 启动失败",
              `无法启动本地音乐服务：端口 ${API_PORT} 已被其他程序占用。\n\n请关闭占用该端口的程序（例如另一个 Reverie 实例）后重试。`,
            );
          } catch {
            /* ignore */
          }
          app.quit();
        } else if (err) {
          console.error("[main] API server error:", err);
        }
      });
    }
    console.log(
      `[main] NCM API server listening @ http://${API_HOST}:${API_PORT}`,
    );
  } catch (err) {
    console.error("[main] Failed to start NCM API:", err && err.message);
    try {
      dialog.showErrorBox(
        "Reverie 启动失败",
        `无法启动本地音乐服务：${err && err.message}`,
      );
    } catch {
      /* ignore */
    }
    app.quit();
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 1080,
    minHeight: 680,
    frame: false,
    backgroundColor: "#0a0a12",
    title: "Reverie",
    icon: windowIcon,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  win.once("ready-to-show", () => win.show());

  // Forward maximize state to the renderer for the custom title bar.
  win.on("maximize", () => win.webContents.send("win:maximized", true));
  win.on("unmaximize", () => win.webContents.send("win:maximized", false));

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // Forward renderer console to main stdout (useful for headless diagnostics)
  win.webContents.on(
    "console-message",
    (_e, level, message, line, sourceId) => {
      console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    },
  );
  win.webContents.on("did-fail-load", (_e, code, desc) => {
    console.error(`[main] did-fail-load: ${code} ${desc}`);
  });
  win.webContents.on("render-process-gone", (_e, details) => {
    console.error(`[main] render-process-gone: ${details.reason}`);
  });

  // Headless smoke-test: capture a screenshot then quit.
  if (process.env.NCM_SMOKE_TEST === "1") {
    const outDir =
      process.env.NCM_SMOKE_OUT || path.join(__dirname, "..", "test-results");
    win.webContents.once("did-finish-load", async () => {
      await new Promise((r) =>
        setTimeout(r, Number(process.env.NCM_SMOKE_DELAY || 4000)),
      );
      try {
        const fs = require("fs");
        fs.mkdirSync(outDir, { recursive: true });
        const image = await win.webContents.capturePage();
        const png = image.toPNG();
        const file = path.join(outDir, `smoke-${process.platform}.png`);
        fs.writeFileSync(file, png);
        console.log(`[smoke] screenshot saved: ${file} (${png.length} bytes)`);
      } catch (e) {
        console.error("[smoke] capture failed:", e);
      }
      app.quit();
    });
  }

  // Open external links (e.g. qrurl) in the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}

// Window control IPC (frameless-safe; harmless with native frame)
ipcMain.on("win:minimize", (e) =>
  BrowserWindow.fromWebContents(e.sender)?.minimize(),
);
ipcMain.on("win:maximize", (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  w.isMaximized() ? w.unmaximize() : w.maximize();
});
ipcMain.on("win:close", (e) =>
  BrowserWindow.fromWebContents(e.sender)?.close(),
);
ipcMain.handle(
  "win:isMaximized",
  (e) => BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false,
);

// Update IPC: manual check / start download / install (quit & run installer).
ipcMain.handle("update:check", () => {
  if (!updateEnabled) return { ok: false, reason: "disabled" };
  manualCheck = true;
  autoUpdater
    .checkForUpdates()
    .then(() => {})
    .catch((err) =>
      sendUpdateEvent("error", {
        message: String((err && err.message) || err),
        manual: true,
      }),
    );
  return { ok: true };
});
ipcMain.handle("update:download", async () => {
  if (!updateEnabled) return { ok: false, reason: "disabled" };
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (err) {
    sendUpdateEvent("error", {
      message: String((err && err.message) || err),
      manual: false,
    });
    return { ok: false };
  }
});
ipcMain.on("update:install", () => {
  if (!updateEnabled) return;
  autoUpdater.quitAndInstall();
});

app.whenReady().then(async () => {
  try {
    await startApi();
  } catch (err) {
    console.error("[main] Failed to start NCM API:", err);
  }
  createWindow();
  setupUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (apiServer) {
    try {
      apiServer.close();
    } catch (_) {
      /* noop */
    }
  }
});
