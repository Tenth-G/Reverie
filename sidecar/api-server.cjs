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

serveNcmApi({ port, host, checkVersion: false }).catch((error) => {
  console.error("Failed to start NCM API:", error);
  process.exit(1);
});
