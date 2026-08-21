"use strict";

const { serveNcmApi } = require("NeteaseCloudMusicApi");

const port = 3969;
const base = `http://127.0.0.1:${port}`;

async function get(path) {
  const response = await fetch(`${base}${path}`);
  const body = await response.json();
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return body;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const app = await serveNcmApi({
    port,
    host: "127.0.0.1",
    checkVersion: false,
  });
  try {
    const album = await get("/album?id=34720827");
    assert(album.album?.id, "album detail missing");
    assert(Array.isArray(album.songs), "album songs missing");

    const artist = await get("/artist/detail?id=6452");
    assert(artist.data?.artist?.id, "artist detail missing");

    const artistSongs = await get("/artists?id=6452");
    assert(Array.isArray(artistSongs.hotSongs), "artist songs missing");

    const comments = await get(
      "/comment/new?id=186016&type=0&pageNo=1&pageSize=5&sortType=2",
    );
    assert(Array.isArray(comments.data?.comments), "song comments missing");

    const radios = await get("/dj/recommend");
    assert(Array.isArray(radios.djRadios), "radio recommendations missing");

    const fm = await get("/personal_fm");
    assert(Array.isArray(fm.data), "personal FM response missing");

    console.log("Extended NCM API smoke test passed");
  } finally {
    await new Promise((resolve) => app.server?.close(resolve));
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
