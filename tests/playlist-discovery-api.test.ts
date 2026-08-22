import test from "node:test";
import assert from "node:assert/strict";
import {
  getHighQualityPlaylists,
  getHighQualityPlaylistTags,
  getHotPlaylistTags,
  getPlaylistCatlist,
  getPlaylistCategoryList,
} from "../src/api/playlistDiscovery.ts";

test("playlist discovery wrappers normalize categories, tags and high quality playlists", async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    paths.push(url.pathname);
    if (url.pathname === "/playlist/category/list") {
      return Response.json({ categories: [{ id: 1, name: "语种", category: 0 }] });
    }
    if (url.pathname === "/playlist/catlist") {
      return Response.json({ categories: { "1000": "流行" } });
    }
    if (url.pathname === "/playlist/hot") {
      return Response.json({ tags: [{ id: 2, name: "华语", hot: true }] });
    }
    if (url.pathname === "/playlist/highquality/tags") {
      return Response.json({ tags: [{ id: 3, name: "电子", hot: true }] });
    }
    return Response.json({
      playlists: [
        {
          id: 9,
          name: "精品歌单",
          coverImgUrl: "cover",
          trackCount: 12,
          creator: { userId: 3, nickname: "创建者" },
        },
      ],
      more: true,
      lasttime: 123,
    });
  };
  try {
    assert.equal((await getPlaylistCategoryList())[0]?.name, "语种");
    assert.equal((await getPlaylistCatlist())[0]?.name, "流行");
    assert.equal((await getHotPlaylistTags())[0]?.hot, true);
    assert.equal((await getHighQualityPlaylistTags())[0]?.name, "电子");
    const page = await getHighQualityPlaylists("华语", 30);
    assert.equal(page.playlists[0]?.creatorName, "创建者");
    assert.equal(page.before, 123);
    assert.equal(page.more, true);
    assert.deepEqual(paths, [
      "/playlist/category/list",
      "/playlist/catlist",
      "/playlist/hot",
      "/playlist/highquality/tags",
      "/top/playlist/highquality",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
