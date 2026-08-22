import { request } from "./client.ts";
import type { UserCommentHistoryItem } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export async function getUserCommentHistory(
  uid: number,
  limit = 30,
  time = 0,
): Promise<UserCommentHistoryItem[]> {
  const response = await request<Obj>(
    "/user/comment/history",
    { uid, limit, time },
    false,
  );
  return arr(response.data ?? response.comments ?? response.list)
    .map((raw) => {
      const value = obj(raw);
      const comment = obj(value.comment ?? value);
      const resource = obj(
        value.resource ?? value.resourceInfo ?? value.target,
      );
      return {
        id: Number(comment.commentId ?? comment.id ?? value.id ?? 0),
        content: String(comment.content ?? value.content ?? ""),
        time: Number(comment.time ?? value.time ?? 0),
        resourceTitle: String(
          resource.name ?? resource.title ?? value.resourceName ?? "评论内容",
        ),
        resourceType:
          String(resource.type ?? value.resourceType ?? "") || undefined,
        resourceId: Number(resource.id ?? value.resourceId ?? 0) || undefined,
      } satisfies UserCommentHistoryItem;
    })
    .filter((item) => item.id > 0 && item.content);
}
