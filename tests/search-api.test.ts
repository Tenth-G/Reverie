import assert from "node:assert/strict";
import test from "node:test";
import {
  getHotSearchTerms,
  getDefaultSearchKeyword,
  getSearchSuggestions,
  getSearchMediaUrl,
  searchContent,
} from "../src/api/search.ts";

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("searchContent maps all search categories to the documented type values", async () => {
  const originalFetch = globalThis.fetch;
  const requestedTypes: string[] = [];
  try {
    globalThis.fetch = (async (input) => {
      const url = new URL(String(input));
      requestedTypes.push(url.searchParams.get("type") ?? "");
      return json({ result: {} });
    }) as typeof fetch;

    for (const category of [
      "songs",
      "lyrics",
      "albums",
      "artists",
      "playlists",
      "users",
      "mvs",
      "radios",
      "videos",
    ] as const) {
      await searchContent("测试", category);
    }

    assert.deepEqual(requestedTypes, [
      "1",
      "1006",
      "10",
      "100",
      "1000",
      "1002",
      "1004",
      "1009",
      "1014",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("searchContent normalizes domain and video result shapes", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async (input) => {
      const type = new URL(String(input)).searchParams.get("type");
      if (type === "10") {
        return json({
          result: {
            albumCount: 1,
            albums: [
              {
                id: 8,
                name: "专辑",
                picUrl: "cover.jpg",
                artist: { id: 7, name: "歌手" },
                size: 12,
              },
            ],
          },
        });
      }
      return json({
        result: {
          videoCount: 1,
          videos: [
            {
              vid: "abc",
              title: "现场视频",
              coverUrl: "video.jpg",
              creator: { nickname: "创作者" },
              durationms: 90000,
              playTime: 12345,
            },
          ],
        },
      });
    }) as typeof fetch;

    const albums = await searchContent("专辑", "albums");
    assert.deepEqual(albums.albums[0], {
      id: 8,
      name: "专辑",
      picUrl: "cover.jpg",
      artistNames: "歌手",
      artistIds: [7],
      description: "",
      publishTime: 0,
      size: 12,
      subscribed: false,
    });
    assert.equal(albums.total, 1);

    const videos = await searchContent("现场", "videos");
    assert.deepEqual(videos.media[0], {
      id: "abc",
      name: "现场视频",
      coverUrl: "video.jpg",
      creatorName: "创作者",
      duration: 90000,
      playCount: 12345,
      kind: "video",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("hot search and media URL helpers parse API responses", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async (input) => {
      const path = new URL(String(input)).pathname;
      if (path === "/search/hot/detail") {
        return json({
          data: [{ searchWord: "热门一" }, { searchWord: "热门二" }],
        });
      }
      if (path === "/mv/url") return json({ data: { url: "https://mv" } });
      return json({ urls: [{ url: "https://video" }] });
    }) as typeof fetch;

    assert.deepEqual(await getHotSearchTerms(), ["热门一", "热门二"]);
    assert.equal(
      await getSearchMediaUrl({
        id: "1",
        name: "MV",
        coverUrl: "",
        creatorName: "",
        duration: 0,
        playCount: 0,
        kind: "mv",
      }),
      "https://mv",
    );
    assert.equal(
      await getSearchMediaUrl({
        id: "video-id",
        name: "视频",
        coverUrl: "",
        creatorName: "",
        duration: 0,
        playCount: 0,
        kind: "video",
      }),
      "https://video",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("search defaults and suggestions normalize web search responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/search/default") return json({ data: { showKeyword: "默认歌曲" } });
    assert.equal(url.pathname, "/search/suggest");
    assert.equal(url.searchParams.get("keywords"), "周杰伦");
    assert.equal(url.searchParams.get("type"), "web");
    return json({ result: { allMatch: [{ keyword: "周杰伦", type: "歌手", source: "华语" }] } });
  };
  try {
    assert.equal(await getDefaultSearchKeyword(), "默认歌曲");
    assert.deepEqual(await getSearchSuggestions("周杰伦"), [
      { keyword: "周杰伦", type: "歌手", source: "华语" },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
