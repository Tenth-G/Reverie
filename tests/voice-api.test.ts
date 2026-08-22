import test from "node:test";
import assert from "node:assert/strict";
import {
  deleteVoices,
  getVoiceDetail,
  getVoiceListDetail,
  getVoicesByList,
  getVoiceLyric,
  normalizeVoice,
  searchVoiceLists,
  searchVoices,
  transcribeVoice,
  uploadVoice,
} from "../src/api/voice.ts";

test("voice APIs normalize list and voice records", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("voicelist/search"))
      return Response.json({
        data: [{ id: 4, name: "列表", coverImgUrl: "cover", programCount: 3 }],
      });
    if (url.includes("voicelist/detail"))
      return Response.json({ data: { id: 4, name: "详情列表" } });
    if (url.includes("voicelist/list/search"))
      return Response.json({ data: [{ id: 9, name: "搜索声音", radioId: 4 }] });
    if (url.includes("voicelist/list"))
      return Response.json({ data: [{ id: 8, name: "声音", radioId: 4 }] });
    if (url.includes("voice/detail"))
      return Response.json({ data: { id: 8, name: "详情声音", radioId: 4 } });
    if (url.includes("voice/lyric"))
      return Response.json({ data: { lyric: "[00:01]歌词" } });
    return Response.json({ code: 200, data: {} });
  };
  try {
    const list = await searchVoiceLists({ podcastName: "列" });
    assert.equal(list[0]?.id, 4);
    assert.equal(list[0]?.voiceCount, 3);
    assert.equal((await getVoiceListDetail(4))?.name, "详情列表");
    assert.equal((await getVoicesByList(4))[0]?.voiceListId, 4);
    assert.equal(
      (await searchVoices({ name: "声", voiceListId: 4 }))[0]?.id,
      9,
    );
    assert.equal((await getVoiceDetail(8))?.name, "详情声音");
    assert.equal(await getVoiceLyric(8), "[00:01]歌词");
    assert.match(urls[0]!, /voicelist\/search/);
    assert.match(urls[3]!, /voicelist\/list\/search/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("voice mutations send expected methods, params and multipart file", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return Response.json({ code: 200, data: { id: 12, name: "上传声音" } });
  };
  try {
    await transcribeVoice({ radioId: 4, programId: 8, position: 2 });
    await deleteVoices([8, 9]);
    await uploadVoice(new File(["audio"], "demo.mp3", { type: "audio/mpeg" }), {
      songName: "演示",
      voiceListId: 4,
    });
    assert.equal(new URL(calls[0]!.url).pathname, "/voicelist/trans");
    assert.equal(new URL(calls[0]!.url).searchParams.get("programId"), "8");
    assert.equal(calls[0]!.init?.method, "POST");
    assert.equal(new URL(calls[1]!.url).pathname, "/voice/delete");
    assert.equal(new URL(calls[1]!.url).searchParams.get("ids"), "8,9");
    assert.equal(calls[1]!.init?.method, "POST");
    assert.equal(new URL(calls[2]!.url).pathname, "/voice/upload");
    assert.equal(new URL(calls[2]!.url).searchParams.get("songName"), "演示");
    assert.equal(calls[2]!.init?.method, "POST");
    assert.ok(calls[2]!.init?.body instanceof FormData);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("normalizeVoice rejects records without a valid id", () => {
  assert.equal(normalizeVoice({ name: "missing" }), null);
  assert.equal(normalizeVoice({ id: 3, name: "valid" })?.name, "valid");
});
