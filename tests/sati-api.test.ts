import test from "node:test";
import assert from "node:assert/strict";
import {
  getMoreSatiResources,
  getSatiResources,
  getSatiTags,
  getSatiTimeSceneResources,
  getSubscribedSatiResources,
  subscribeSatiResource,
} from "../src/api/sati.ts";

test("SATI APIs normalize tags and resources", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("tag/list"))
      return Response.json({ data: [{ id: "sleep", name: "睡眠" }] });
    return Response.json({
      data: [{ id: 4, name: "雨声", subscribed: true, playCount: 8 }],
    });
  };
  try {
    assert.equal((await getSatiTags())[0]?.name, "睡眠");
    assert.equal((await getSatiResources("sleep"))[0]?.id, 4);
    assert.equal((await getMoreSatiResources(4))[0]?.subscribed, true);
    assert.equal((await getSatiTimeSceneResources())[0]?.name, "雨声");
    assert.equal((await getSubscribedSatiResources())[0]?.id, 4);
    assert.match(urls[0]!, /sati\/tag\/list/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("SATI subscription mutation forwards cancel state", async () => {
  const originalFetch = globalThis.fetch;
  let call: { url: string; init?: RequestInit } | undefined;
  globalThis.fetch = async (input, init) => {
    call = { url: String(input), init };
    return Response.json({ code: 200 });
  };
  try {
    await subscribeSatiResource(4, true);
    assert.equal(new URL(call!.url).pathname, "/sati/resource/sub");
    assert.equal(new URL(call!.url).searchParams.get("cancel"), "true");
    assert.equal(call!.init?.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
