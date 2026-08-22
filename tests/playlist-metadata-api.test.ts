import test from "node:test";
import assert from "node:assert/strict";
import {
  updatePlaylistCover,
  updatePlaylistTags,
} from "../src/api/playlistMetadata.ts";

test("playlist metadata mutations send tags and multipart cover", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; body?: BodyInit }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), body: init?.body });
    return Response.json({ code: 200 });
  };
  try {
    await updatePlaylistTags(7, "华语, 流行");
    await updatePlaylistCover(
      7,
      new File(["image"], "cover.jpg", { type: "image/jpeg" }),
    );
    assert.match(calls[0]!.url, /playlist\/tags\/update/);
    assert.equal(new URL(calls[0]!.url).searchParams.get("tags"), "华语, 流行");
    assert.match(calls[1]!.url, /playlist\/cover\/update/);
    assert.ok(calls[1]!.body instanceof FormData);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
