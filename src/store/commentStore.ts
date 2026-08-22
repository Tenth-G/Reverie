import { create } from "zustand";
import {
  deleteResourceComment,
  getCommentReplies,
  getResourceComments,
  likeResourceComment,
  sendResourceComment,
} from "../api/comment";
import type {
  CommentInfo,
  CommentResource,
  CommentSort,
  Song,
} from "../api/types";
import { usePlayerStore } from "./playerStore";

const PAGE_SIZE = 30;
let listToken = 0;
const replyTokens = new Map<string, number>();

export interface CommentReplyThread {
  comments: CommentInfo[];
  hasMore: boolean;
  time: number;
  loading: boolean;
  expanded: boolean;
}

interface CommentState {
  resource: CommentResource | null;
  comments: CommentInfo[];
  total: number;
  sort: CommentSort;
  page: number;
  cursor: string;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  submitting: boolean;
  replies: Record<string, CommentReplyThread>;
  openResourceComments: (
    resource: CommentResource,
    navigate?: boolean,
  ) => Promise<void>;
  openSongComments: (song: Song) => Promise<void>;
  setSort: (sort: CommentSort) => Promise<void>;
  loadMore: () => Promise<void>;
  submit: (
    content: string,
    replyTo?: CommentInfo,
    parentId?: number,
  ) => Promise<boolean>;
  toggleLike: (comment: CommentInfo, parentId?: number) => Promise<void>;
  remove: (comment: CommentInfo, parentId?: number) => Promise<void>;
  toggleReplies: (comment: CommentInfo) => Promise<void>;
  loadMoreReplies: (comment: CommentInfo) => Promise<void>;
}

function resourceKey(resource: CommentResource | null) {
  return resource
    ? `${resource.type}:${resource.id}:${resource.threadId ?? ""}`
    : "";
}

function showCommentsView() {
  const player = usePlayerStore.getState();
  const previous = player.activeView;
  player.setPage("browse");
  player.setSearchOpen(false);
  usePlayerStore.setState({
    activeView: "comments",
    prevView: previous === "comments" ? player.prevView : previous,
    showPlayerComments: false,
  });
}

function toastError(message: string) {
  usePlayerStore.getState().toast(message, "error");
}

function mergeUnique(
  current: CommentInfo[],
  incoming: CommentInfo[],
): CommentInfo[] {
  const known = new Set(current.map((comment) => comment.id));
  return [...current, ...incoming.filter((comment) => !known.has(comment.id))];
}

export const useCommentStore = create<CommentState>()((set, get) => ({
  resource: null,
  comments: [],
  total: 0,
  sort: "recommended",
  page: 1,
  cursor: "",
  hasMore: false,
  loading: false,
  loadingMore: false,
  submitting: false,
  replies: {},

  openResourceComments: async (resource, navigate = false) => {
    if (!resource.id) return;
    if (navigate) showCommentsView();
    const token = ++listToken;
    const key = resourceKey(resource);
    set({
      resource,
      comments: [],
      total: 0,
      sort: "recommended",
      page: 1,
      cursor: "",
      hasMore: false,
      loading: true,
      loadingMore: false,
      submitting: false,
      replies: {},
    });
    try {
      const result = await getResourceComments(
        resource,
        1,
        "recommended",
        "",
        PAGE_SIZE,
      );
      if (token !== listToken || resourceKey(get().resource) !== key) return;
      set({
        comments: result.comments,
        total: result.total,
        hasMore: result.hasMore,
        cursor: result.cursor,
        loading: false,
      });
    } catch {
      if (token !== listToken || resourceKey(get().resource) !== key) return;
      set({ loading: false });
      toastError("加载评论失败");
    }
  },

  openSongComments: async (song) => {
    await get().openResourceComments(
      {
        type: song.programId ? "program" : "song",
        id: String(song.programId ?? song.id),
        title: song.name,
        subtitle: song.programId ? song.album : song.artists,
        coverUrl: song.picUrl,
      },
      false,
    );
  },

  setSort: async (sort) => {
    const resource = get().resource;
    if (!resource || sort === get().sort) return;
    const token = ++listToken;
    const key = resourceKey(resource);
    set({
      sort,
      page: 1,
      cursor: "",
      comments: [],
      hasMore: false,
      loading: true,
      loadingMore: false,
      replies: {},
    });
    try {
      const result = await getResourceComments(
        resource,
        1,
        sort,
        "",
        PAGE_SIZE,
      );
      if (token !== listToken || resourceKey(get().resource) !== key) return;
      set({
        comments: result.comments,
        total: result.total,
        hasMore: result.hasMore,
        cursor: result.cursor,
        loading: false,
      });
    } catch {
      if (token !== listToken || resourceKey(get().resource) !== key) return;
      set({ loading: false });
      toastError("切换评论排序失败");
    }
  },

  loadMore: async () => {
    const state = get();
    const resource = state.resource;
    if (!resource || !state.hasMore || state.loading || state.loadingMore)
      return;
    const token = listToken;
    const key = resourceKey(resource);
    const nextPage = state.page + 1;
    set({ loadingMore: true });
    try {
      const result = await getResourceComments(
        resource,
        nextPage,
        state.sort,
        state.cursor,
        PAGE_SIZE,
      );
      if (token !== listToken || resourceKey(get().resource) !== key) return;
      set((current) => ({
        comments: mergeUnique(current.comments, result.comments),
        total: result.total,
        page: nextPage,
        cursor: result.cursor,
        hasMore: result.hasMore,
        loadingMore: false,
      }));
    } catch {
      if (token !== listToken || resourceKey(get().resource) !== key) return;
      set({ loadingMore: false });
      toastError("加载更多评论失败");
    }
  },

  submit: async (content, replyTo, parentId) => {
    const state = get();
    const resource = state.resource;
    const message = content.trim();
    if (!resource || !message || state.submitting) return false;
    const key = resourceKey(resource);
    set({ submitting: true });
    try {
      await sendResourceComment(resource, message, replyTo?.id);
      if (resourceKey(get().resource) !== key) return true;
      if (replyTo) {
        const rootId = parentId ?? replyTo.id;
        const result = await getCommentReplies(resource, rootId);
        if (resourceKey(get().resource) === key) {
          set((current) => ({
            comments: current.comments.map((comment) =>
              comment.id === rootId
                ? { ...comment, replyCount: comment.replyCount + 1 }
                : comment,
            ),
            replies: {
              ...current.replies,
              [rootId]: {
                comments: result.comments,
                hasMore: result.hasMore,
                time: result.time,
                loading: false,
                expanded: true,
              },
            },
          }));
        }
      } else {
        const current = get();
        const result = await getResourceComments(resource, 1, current.sort);
        if (resourceKey(get().resource) === key) {
          set({
            comments: result.comments,
            total: result.total,
            page: 1,
            cursor: result.cursor,
            hasMore: result.hasMore,
            replies: {},
          });
        }
      }
      usePlayerStore
        .getState()
        .toast(replyTo ? "回复已发布" : "评论已发布", "success");
      return true;
    } catch {
      toastError(replyTo ? "回复评论失败" : "发布评论失败");
      return false;
    } finally {
      if (resourceKey(get().resource) === key) set({ submitting: false });
    }
  },

  toggleLike: async (comment, parentId) => {
    const resource = get().resource;
    if (!resource) return;
    const key = resourceKey(resource);
    const next = !comment.liked;
    try {
      await likeResourceComment(resource, comment.id, next);
      if (resourceKey(get().resource) !== key) return;
      const update = (item: CommentInfo) =>
        item.id === comment.id
          ? {
              ...item,
              liked: next,
              likedCount: Math.max(0, item.likedCount + (next ? 1 : -1)),
            }
          : item;
      set((state) =>
        parentId
          ? {
              replies: {
                ...state.replies,
                [parentId]: {
                  ...state.replies[parentId],
                  comments: (state.replies[parentId]?.comments ?? []).map(
                    update,
                  ),
                } as CommentReplyThread,
              },
            }
          : { comments: state.comments.map(update) },
      );
    } catch {
      toastError("评论点赞失败");
    }
  },

  remove: async (comment, parentId) => {
    const resource = get().resource;
    if (!resource) return;
    const key = resourceKey(resource);
    try {
      await deleteResourceComment(resource, comment.id);
      if (resourceKey(get().resource) !== key) return;
      set((state) => {
        if (!parentId) {
          return {
            comments: state.comments.filter((item) => item.id !== comment.id),
            total: Math.max(0, state.total - 1),
          };
        }
        const thread = state.replies[parentId];
        return {
          comments: state.comments.map((item) =>
            item.id === parentId
              ? { ...item, replyCount: Math.max(0, item.replyCount - 1) }
              : item,
          ),
          replies: thread
            ? {
                ...state.replies,
                [parentId]: {
                  ...thread,
                  comments: thread.comments.filter(
                    (item) => item.id !== comment.id,
                  ),
                },
              }
            : state.replies,
        };
      });
      usePlayerStore.getState().toast("评论已删除", "success");
    } catch {
      toastError("删除评论失败");
    }
  },

  toggleReplies: async (comment) => {
    const resource = get().resource;
    if (!resource || comment.replyCount <= 0) return;
    const existing = get().replies[comment.id];
    if (existing?.comments.length) {
      set((state) => ({
        replies: {
          ...state.replies,
          [comment.id]: { ...existing, expanded: !existing.expanded },
        },
      }));
      return;
    }
    const key = `${resourceKey(resource)}:${comment.id}`;
    const token = (replyTokens.get(key) ?? 0) + 1;
    replyTokens.set(key, token);
    set((state) => ({
      replies: {
        ...state.replies,
        [comment.id]: {
          comments: [],
          hasMore: false,
          time: -1,
          loading: true,
          expanded: true,
        },
      },
    }));
    try {
      const result = await getCommentReplies(resource, comment.id);
      if (
        replyTokens.get(key) !== token ||
        resourceKey(get().resource) !== resourceKey(resource)
      )
        return;
      set((state) => ({
        replies: {
          ...state.replies,
          [comment.id]: {
            comments: result.comments,
            hasMore: result.hasMore,
            time: result.time,
            loading: false,
            expanded: true,
          },
        },
      }));
    } catch {
      if (replyTokens.get(key) !== token) return;
      set((state) => ({
        replies: {
          ...state.replies,
          [comment.id]: {
            ...(state.replies[comment.id] ?? {
              comments: [],
              hasMore: false,
              time: -1,
              expanded: true,
            }),
            loading: false,
          },
        },
      }));
      toastError("加载评论回复失败");
    }
  },

  loadMoreReplies: async (comment) => {
    const resource = get().resource;
    const thread = get().replies[comment.id];
    if (!resource || !thread?.hasMore || thread.loading) return;
    const key = `${resourceKey(resource)}:${comment.id}`;
    const token = (replyTokens.get(key) ?? 0) + 1;
    replyTokens.set(key, token);
    set((state) => ({
      replies: {
        ...state.replies,
        [comment.id]: { ...thread, loading: true },
      },
    }));
    try {
      const result = await getCommentReplies(resource, comment.id, thread.time);
      if (
        replyTokens.get(key) !== token ||
        resourceKey(get().resource) !== resourceKey(resource)
      )
        return;
      set((state) => ({
        replies: {
          ...state.replies,
          [comment.id]: {
            comments: mergeUnique(thread.comments, result.comments),
            hasMore: result.hasMore,
            time: result.time,
            loading: false,
            expanded: true,
          },
        },
      }));
    } catch {
      if (replyTokens.get(key) !== token) return;
      set((state) => ({
        replies: {
          ...state.replies,
          [comment.id]: { ...thread, loading: false },
        },
      }));
      toastError("加载更多回复失败");
    }
  },
}));
