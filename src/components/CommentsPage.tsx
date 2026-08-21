import { useState } from "react";
import { Heart, Send, Trash2 } from "lucide-react";
import { useExploreStore } from "../store/exploreStore";
import { usePlayerStore } from "../store/playerStore";
import { sizedImage } from "../utils/image";
import { Page, PageHeader } from "./Page";
import BackButton from "./BackButton";

export default function CommentsPage() {
  const song = useExploreStore((s) => s.commentSong);
  const comments = useExploreStore((s) => s.comments);
  const total = useExploreStore((s) => s.commentTotal);
  const sort = useExploreStore((s) => s.commentSort);
  const hasMore = useExploreStore((s) => s.commentHasMore);
  const loading = useExploreStore((s) => s.loading);
  const setSort = useExploreStore((s) => s.setCommentSort);
  const loadMore = useExploreStore((s) => s.loadMoreComments);
  const submit = useExploreStore((s) => s.submitComment);
  const toggleLike = useExploreStore((s) => s.toggleCommentLike);
  const remove = useExploreStore((s) => s.removeComment);
  const uid = usePlayerStore((s) => s.profile?.userId ?? 0);
  const [content, setContent] = useState("");

  return (
    <Page>
      <BackButton />
      <PageHeader
        title={song ? `《${song.name}》的评论` : "歌曲评论"}
        subtitle={`${total} 条评论`}
      />
      <div className="comment-editor">
        <textarea
          rows={3}
          maxLength={140}
          placeholder="分享你对这首歌的感受"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div>
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
      </div>
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
      <div className="comment-list">
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
                  />{" "}
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
          <div className="empty">{loading ? "正在加载评论…" : "暂无评论"}</div>
        )}
      </div>
      {hasMore && (
        <button
          className="btn load-more"
          disabled={loading}
          onClick={() => void loadMore()}
        >
          {loading ? "加载中…" : "加载更多"}
        </button>
      )}
    </Page>
  );
}
