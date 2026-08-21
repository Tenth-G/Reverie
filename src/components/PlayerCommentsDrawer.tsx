import { useEffect, useRef, useState } from "react";
import { Disc3, Heart, MessageCircle, Send, Trash2, X } from "lucide-react";
import { useExploreStore } from "../store/exploreStore";
import { usePlayerStore } from "../store/playerStore";
import { sizedImage } from "../utils/image";

export default function PlayerCommentsDrawer() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const setOpen = usePlayerStore((s) => s.setShowPlayerComments);
  const uid = usePlayerStore((s) => s.profile?.userId ?? 0);
  const song = useExploreStore((s) => s.commentSong);
  const comments = useExploreStore((s) => s.comments);
  const total = useExploreStore((s) => s.commentTotal);
  const sort = useExploreStore((s) => s.commentSort);
  const hasMore = useExploreStore((s) => s.commentHasMore);
  const loading = useExploreStore((s) => s.loading);
  const openComments = useExploreStore((s) => s.openComments);
  const setSort = useExploreStore((s) => s.setCommentSort);
  const loadMore = useExploreStore((s) => s.loadMoreComments);
  const submit = useExploreStore((s) => s.submitComment);
  const toggleLike = useExploreStore((s) => s.toggleCommentLike);
  const remove = useExploreStore((s) => s.removeComment);
  const loadedSongId = useRef(0);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!currentSong || loadedSongId.current === currentSong.id) return;
    loadedSongId.current = currentSong.id;
    setContent("");
    void openComments(currentSong);
  }, [currentSong, openComments]);

  if (!currentSong) return null;

  return (
    <>
      <button
        className="player-comments-scrim"
        onClick={() => setOpen(false)}
        aria-label="关闭评论"
      />
      <section className="player-comments-drawer" aria-label="歌曲评论">
        <header className="player-comments-header">
          <div className="player-comments-title">
            {currentSong.picUrl ? (
              <img src={sizedImage(currentSong.picUrl, 96)} alt="" />
            ) : (
              <span className="player-comments-cover-ph">
                <Disc3 size={18} />
              </span>
            )}
            <div>
              <span>歌曲评论</span>
              <strong>{currentSong.name}</strong>
              <small>
                {song?.id === currentSong.id ? `${total} 条` : "加载中"}
              </small>
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={() => setOpen(false)}
            title="关闭评论"
          >
            <X size={18} />
          </button>
        </header>

        <div className="player-comments-toolbar">
          <div className="segmented">
            <button
              className={sort === "hot" ? "active" : ""}
              onClick={() => void setSort("hot")}
            >
              热门
            </button>
            <button
              className={sort === "new" ? "active" : ""}
              onClick={() => void setSort("new")}
            >
              最新
            </button>
          </div>
          <MessageCircle size={16} />
        </div>

        <div className="player-comments-list">
          {comments.map((comment) => (
            <article className="comment-row" key={comment.id}>
              <img src={sizedImage(comment.avatarUrl, 80)} alt="" />
              <div className="comment-body">
                <div className="comment-head">
                  <strong>{comment.nickname}</strong>
                  <time>{new Date(comment.time).toLocaleString()}</time>
                </div>
                <p>{comment.content}</p>
                <div className="comment-actions">
                  <button
                    className={comment.liked ? "active" : ""}
                    onClick={() => void toggleLike(comment)}
                  >
                    <Heart
                      size={14}
                      fill={comment.liked ? "currentColor" : "none"}
                    />
                    {comment.likedCount}
                  </button>
                  {comment.userId === uid && (
                    <button onClick={() => void remove(comment)}>
                      <Trash2 size={14} /> 删除
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!comments.length && (
            <div className="empty">
              {loading ? "正在加载评论…" : "还没有评论"}
            </div>
          )}
          {hasMore && (
            <button
              className="btn load-more"
              disabled={loading}
              onClick={() => void loadMore()}
            >
              {loading ? "加载中…" : "加载更多"}
            </button>
          )}
        </div>

        <div className="player-comment-editor">
          <textarea
            rows={2}
            maxLength={140}
            placeholder="写下此刻的感受"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <span>{content.length}/140</span>
          <button
            className="btn primary"
            disabled={!content.trim()}
            onClick={async () => {
              if (await submit(content)) setContent("");
            }}
          >
            <Send size={14} /> 发布
          </button>
        </div>
      </section>
    </>
  );
}
