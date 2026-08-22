"use strict";

const { serveNcmApi } = require("NeteaseCloudMusicApi/server");

const port = Number(process.env.PORT || 3939);
const host = process.env.HOST || "127.0.0.1";
const parentPid = Number(process.env.PARENT_PID || 0);

if (Number.isInteger(parentPid) && parentPid > 0) {
  setInterval(() => {
    try {
      process.kill(parentPid, 0);
    } catch {
      process.exit(0);
    }
  }, 1000);
}

serveNcmApi({ port, host, checkVersion: false })
  .then((app) => {
    // listen 绑定失败（如 EADDRINUSE）在 promise resolve 之后异步抛出，
    // 不监听 error 事件会变成未捕获异常。
    if (app && app.server && typeof app.server.on === "function") {
      app.server.on("error", (error) => {
        console.error("Failed to start NCM API:", error);
        process.exit(1);
      });
    }
  })
  .catch((error) => {
    console.error("Failed to start NCM API:", error);
    process.exit(1);
  });
