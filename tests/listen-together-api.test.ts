import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptListenTogetherInvitation,
  checkListenTogetherRoom,
  createListenTogetherRoom,
  endListenTogetherRoom,
  getListenTogetherPlaylist,
  getListenTogetherStatus,
  sendListenTogetherCommand,
  sendListenTogetherHeartbeat,
} from "../src/api/listenTogether.ts";

test("listen together wrappers normalize room, status and playlist responses", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("room/create")) {
      return Response.json({
        data: { roomId: "room-1", ownerId: 8, memberNum: 1 },
      });
    }
    if (url.includes("status")) {
      return Response.json({
        data: {
          room: { roomId: "room-1", memberCount: 2 },
          songId: 12,
          playStatus: true,
          progress: 1234,
          playlist: [
            {
              id: 12,
              name: "同步歌曲",
              ar: [{ name: "歌手" }],
              al: { name: "专辑" },
            },
          ],
        },
      });
    }
    return Response.json({
      data: { songs: [{ id: 13, name: "歌单歌曲", ar: [{ name: "歌手" }] }] },
    });
  };
  try {
    const room = await createListenTogetherRoom();
    assert.equal(room.roomId, "room-1");
    assert.equal(room.memberCount, 1);
    const status = await getListenTogetherStatus();
    assert.equal(status.currentSongId, 12);
    assert.equal(status.playing, true);
    assert.equal(status.playlist[0]?.name, "同步歌曲");
    const playlist = await getListenTogetherPlaylist("room-1");
    assert.equal(playlist[0]?.id, 13);
    assert.match(urls[0]!, /\/listentogether\/room\/create/);
    assert.match(urls[1]!, /\/listentogether\/status/);
    assert.match(urls[2]!, /roomId=room-1/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("listen together mutations use expected routes, methods and parameters", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; method?: string }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), method: init?.method });
    if (String(input).includes("room/check")) {
      return Response.json({
        data: { roomId: "r-2", ownerId: 7, memberCount: 1 },
      });
    }
    return Response.json({ code: 200, data: {} });
  };
  try {
    await checkListenTogetherRoom("r-2");
    await endListenTogetherRoom("r-2");
    await acceptListenTogetherInvitation("r-2", 7);
    await sendListenTogetherHeartbeat({
      roomId: "r-2",
      songId: 12,
      playStatus: true,
      progress: 400,
    });
    await sendListenTogetherCommand({
      roomId: "r-2",
      commandType: "play",
      progress: 400,
      playStatus: true,
      clientSeq: 3,
    });
    assert.equal(new URL(calls[0]!.url).pathname, "/listentogether/room/check");
    assert.equal(new URL(calls[0]!.url).searchParams.get("roomId"), "r-2");
    assert.equal(calls[0]!.method, "GET");
    assert.equal(new URL(calls[1]!.url).pathname, "/listentogether/end");
    assert.equal(calls[1]!.method, "POST");
    assert.equal(new URL(calls[2]!.url).pathname, "/listentogether/accept");
    assert.equal(new URL(calls[2]!.url).searchParams.get("inviterId"), "7");
    assert.equal(calls[2]!.method, "POST");
    assert.equal(new URL(calls[3]!.url).pathname, "/listentogether/heatbeat");
    assert.equal(new URL(calls[3]!.url).searchParams.get("progress"), "400");
    assert.equal(calls[3]!.method, "POST");
    assert.equal(
      new URL(calls[4]!.url).pathname,
      "/listentogether/play/command",
    );
    assert.equal(new URL(calls[4]!.url).searchParams.get("clientSeq"), "3");
    assert.equal(calls[4]!.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
