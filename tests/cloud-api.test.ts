import test from "node:test";
import assert from "node:assert/strict";
import {
  deleteCloudSong,
  getCloudSongDetails,
  getCloudSongs,
  importCloudSong,
  matchCloudSong,
  uploadCloudSong,
} from "../src/api/cloud.ts";

test("cloud list normalizes nested song metadata and pagination", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return Response.json({
      code: 200,
      data: [
        {
          songId: 12,
          songName: "云端歌曲",
          artistName: "歌手",
          albumName: "专辑",
          fileSize: 2048,
          bitrate: 320000,
          simpleSong: {
            id: 12,
            name: "云端歌曲",
            ar: [{ id: 2, name: "歌手" }],
            al: { id: 3, name: "专辑", picUrl: "cover" },
          },
        },
      ],
      count: 8,
      hasMore: true,
    });
  };
  try {
    const result = await getCloudSongs(1, 2);
    assert.equal(result.songs[0]?.id, 12);
    assert.equal(result.songs[0]?.cloudId, 12);
    assert.equal(result.songs[0]?.artists, "歌手");
    assert.equal(result.total, 8);
    assert.equal(result.hasMore, true);
    const url = new URL(urls[0]!);
    assert.equal(url.pathname, "/user/cloud");
    assert.equal(url.searchParams.get("limit"), "1");
    assert.equal(url.searchParams.get("offset"), "2");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("cloud mutations use the expected routes and multipart upload", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return Response.json({ code: 200, data: [] });
  };
  try {
    await deleteCloudSong(12);
    await matchCloudSong(7, 12, 99);
    await uploadCloudSong(
      new File(["audio"], "demo.mp3", { type: "audio/mpeg" }),
    );
    await importCloudSong({
      md5: "abc",
      id: 12,
      bitrate: 320000,
      fileSize: 5,
      song: "demo",
      artist: "歌手",
      album: "专辑",
      fileType: "mp3",
    });
    assert.equal(new URL(calls[0]!.url).pathname, "/user/cloud/del");
    assert.equal(calls[0]!.init?.method, "POST");
    assert.equal(new URL(calls[1]!.url).pathname, "/cloud/match");
    assert.equal(calls[1]!.init?.method, "POST");
    assert.equal(new URL(calls[2]!.url).pathname, "/cloud");
    assert.equal(calls[2]!.init?.method, "POST");
    assert.ok(calls[2]!.init?.body instanceof FormData);
    assert.equal(new URL(calls[3]!.url).pathname, "/cloud/import");
    assert.equal(new URL(calls[3]!.url).searchParams.get("md5"), "abc");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("cloud detail normalizes returned song records", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      data: [{ songId: 4, songName: "详情", artistName: "作者" }],
    });
  try {
    const songs = await getCloudSongDetails([4]);
    assert.equal(songs.length, 1);
    assert.equal(songs[0]?.name, "详情");
    assert.equal(songs[0]?.artists, "作者");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
