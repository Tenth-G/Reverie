import test from "node:test";
import assert from "node:assert/strict";
import {
  addSongLyricMark,
  deleteSongLyricMarks,
  getSongLyricMarks,
  getUserLyricMarks,
} from "../src/api/lyricsMark.ts";

test("lyrics mark APIs normalize song and user pages", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("user/page"))
      return Response.json({
        data: {
          list: [
            {
              id: "m2",
              songId: 2,
              songName: "用户摘录",
              originalLyricsText: "原文",
              startTimeStamp: 1000,
            },
          ],
        },
      });
    return Response.json({
      data: [
        {
          id: "m1",
          songId: 1,
          songName: "歌曲",
          originalLyricsText: "摘录",
          translateLyricsText: "翻译",
          startTimeStamp: 500,
        },
      ],
    });
  };
  try {
    const song = await getSongLyricMarks(1);
    assert.equal(song[0]?.id, "m1");
    assert.equal(song[0]?.translateLyricsText, "翻译");
    const user = await getUserLyricMarks(10, 20);
    assert.equal(user[0]?.songName, "用户摘录");
    assert.match(urls[0]!, /song\/lyrics\/mark\?id=1/);
    assert.match(urls[1]!, /user\/page\?limit=10&offset=20/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("lyrics mark mutations forward JSON data and mark ids", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return Response.json({ code: 200 });
  };
  try {
    await addSongLyricMark({
      songId: 4,
      marks: [
        {
          startTimeStamp: 800,
          originalLyricsText: "原文",
          translateLyricsText: "译文",
          translateType: 1,
        },
      ],
    });
    await deleteSongLyricMarks(["m1", "m2"]);
    assert.equal(new URL(calls[0]!.url).pathname, "/song/lyrics/mark/add");
    assert.equal(new URL(calls[0]!.url).searchParams.get("id"), "4");
    assert.match(
      new URL(calls[0]!.url).searchParams.get("data") ?? "",
      /originalLyricsText/,
    );
    assert.equal(calls[0]!.init?.method, "POST");
    assert.equal(new URL(calls[1]!.url).pathname, "/song/lyrics/mark/del");
    assert.equal(new URL(calls[1]!.url).searchParams.get("id"), "m1,m2");
    assert.equal(calls[1]!.init?.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
