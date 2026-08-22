import test from "node:test";
import assert from "node:assert/strict";
import { getDownloadHistory } from "../src/api/downloadHistory.ts";

test("download history selects category-specific routes and normalizes songs", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return Response.json({
      data: [
        {
          id: 1,
          name: "下载歌曲",
          ar: [{ name: "歌手" }],
          al: { name: "专辑" },
        },
      ],
    });
  };
  try {
    const all = await getDownloadHistory("all");
    const month = await getDownloadHistory("month");
    const purchased = await getDownloadHistory("purchased");
    assert.equal(all[0]?.name, "下载歌曲");
    assert.match(urls[0]!, /song\/downlist/);
    assert.match(urls[1]!, /song\/monthdownlist/);
    assert.match(urls[2]!, /song\/purchased/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
