import test from "node:test";
import assert from "node:assert/strict";
import { createPlaylistImportTask, getPlaylistImportTaskStatus } from "../src/api/playlistImport.ts";

test("playlist import creates text, link and local tasks with documented query shapes", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return Response.json({ data: { id: "task-1" } });
  };
  try {
    assert.equal(await createPlaylistImportTask({ kind: "text", value: "歌曲 歌手", playlistName: "文字歌单" }), "task-1");
    await createPlaylistImportTask({ kind: "links", value: ["https://example.com/song"], playlistName: "链接歌单" });
    await createPlaylistImportTask({ kind: "local", value: [{ name: "歌曲", artist: "歌手" }] });
    assert.equal(new URL(urls[0]!).pathname, "/playlist/import/name/task/create");
    assert.equal(new URL(urls[0]!).searchParams.get("text"), "歌曲 歌手");
    assert.equal(new URL(urls[1]!).searchParams.get("link"), JSON.stringify(["https://example.com/song"]));
    assert.equal(new URL(urls[2]!).searchParams.get("local"), JSON.stringify([{ name: "歌曲", artist: "歌手" }]));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("playlist import status normalizes pending, success and failure fields", async () => {
  const originalFetch = globalThis.fetch;
  const responses = [
    { data: { taskId: "a", status: "running", progress: 42, message: "处理中" } },
    { data: { taskId: "b", status: "success", playlistId: 9, playlistName: "完成" } },
    { data: { taskId: "c", status: "failed", error: "失败" } },
  ];
  globalThis.fetch = async () => Response.json(responses.shift());
  try {
    assert.equal((await getPlaylistImportTaskStatus("a")).status, "running");
    const success = await getPlaylistImportTaskStatus("b");
    assert.equal(success.status, "success");
    assert.equal(success.playlistId, 9);
    const failed = await getPlaylistImportTaskStatus("c");
    assert.equal(failed.status, "failed");
    assert.equal(failed.message, "失败");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

