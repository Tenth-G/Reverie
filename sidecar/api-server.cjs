"use strict";

const { serveNcmApi } = require("NeteaseCloudMusicApi/server");

const port = Number(process.env.PORT || 3939);
const host = process.env.HOST || "127.0.0.1";

serveNcmApi({ port, host, checkVersion: false }).catch((error) => {
  console.error("Failed to start NCM API:", error);
  process.exit(1);
});
