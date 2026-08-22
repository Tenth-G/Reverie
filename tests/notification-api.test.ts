import test from "node:test";
import assert from "node:assert/strict";
import {
  getNotifications,
  getPrivateConversations,
  getPrivateHistory,
  sendPrivateMessage,
} from "../src/api/notification.ts";

test("private conversation and history responses are normalized", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/msg/private/history")) {
      return Response.json({
        msgs: [
          {
            id: 9,
            fromUser: { userId: 2, nickname: "朋友" },
            toUser: { userId: 1, nickname: "我" },
            msg: JSON.stringify({
              msg: "你好",
              song: { id: 10, name: "歌曲" },
            }),
            time: 20,
          },
        ],
        more: false,
      });
    }
    if (url.includes("/msg/recentcontact")) {
      return Response.json({
        data: { follow: [{ userId: 3, nickname: "最近联系人" }] },
      });
    }
    return Response.json({
      msgs: [
        {
          fromUser: { userId: 2, nickname: "朋友" },
          toUser: { userId: 1, nickname: "我" },
          lastMsg: JSON.stringify({ msg: "上一条消息" }),
          lastMsgTime: 10,
          newMsgCount: 2,
        },
      ],
      more: false,
    });
  };
  try {
    const conversations = await getPrivateConversations(1);
    assert.equal(conversations.conversations.length, 2);
    assert.equal(conversations.conversations[0]?.user.nickname, "朋友");
    assert.equal(conversations.conversations[0]?.unreadCount, 2);
    const history = await getPrivateHistory(2);
    assert.equal(history.messages[0]?.content, "你好");
    assert.equal(history.messages[0]?.resourceTitle, "歌曲");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("comment, mention and notice feeds map their response fields", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/msg/comments")) {
      return Response.json({
        comments: [
          {
            commentId: 1,
            comment: {
              content: "回复内容",
              user: { userId: 2, nickname: "评论者" },
              time: 30,
            },
            resourceInfo: { name: "歌曲资源" },
          },
        ],
      });
    }
    if (url.includes("/msg/forwards")) {
      return Response.json({
        forwards: [
          {
            id: 2,
            user: { userId: 3, nickname: "提及者" },
            json: JSON.stringify({ msg: "提到了你" }),
            time: 40,
          },
        ],
      });
    }
    return Response.json({
      notices: [
        {
          id: 3,
          notice: JSON.stringify({ title: "系统消息", msg: "通知内容" }),
          time: 50,
        },
      ],
    });
  };
  try {
    assert.equal(
      (await getNotifications("comments", 1)).items[0]?.content,
      "回复内容",
    );
    assert.equal(
      (await getNotifications("mentions", 1)).items[0]?.title,
      "提及者 提到了你",
    );
    assert.equal(
      (await getNotifications("notices", 1)).items[0]?.title,
      "系统消息",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("sendPrivateMessage uses text and resource-specific routes", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input) => {
    requests.push(String(input));
    return Response.json({ code: 200 });
  };
  try {
    await sendPrivateMessage(2, "文字");
    await sendPrivateMessage(2, "歌曲", { type: "song", id: 10, title: "歌" });
    await sendPrivateMessage(2, "歌单", {
      type: "playlist",
      id: 11,
      title: "单",
    });
    await sendPrivateMessage(2, "专辑", { type: "album", id: 12, title: "辑" });
    assert.match(requests[0], /send\/text/);
    assert.match(requests[1], /send\/song/);
    assert.match(requests[2], /send\/playlist/);
    assert.match(requests[2], /playlist=11/);
    assert.match(requests[3], /send\/album/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("message APIs reject an explicit non-success business code", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ code: 301 });
  try {
    await assert.rejects(() => getPrivateHistory(2), /业务码 301/);
    await assert.rejects(
      () => sendPrivateMessage(2, "登录已失效"),
      /业务码 301/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
