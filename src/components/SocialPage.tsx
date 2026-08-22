import { useEffect } from "react";
import { Heart, MessageCircle, UserMinus, UserPlus } from "lucide-react";
import type { SocialUser } from "../api/types";
import { useCommentStore } from "../store/commentStore";
import { useExploreStore } from "../store/exploreStore";
import { sizedImage } from "../utils/image";
import { LoadingState, Page, PageHeader } from "./Page";

function UserList({ users }: { users: SocialUser[] }) {
  const toggleFollow = useExploreStore((s) => s.toggleFollow);
  return (
    <div className="social-user-list">
      {users.map((user) => (
        <article className="social-user" key={user.userId}>
          <img src={sizedImage(user.avatarUrl, 100)} alt="" />
          <div>
            <strong>{user.nickname}</strong>
            <p>{user.signature || "这个人很安静，还没有留下简介"}</p>
          </div>
          <button
            className={`btn ${user.followed ? "" : "primary"}`}
            onClick={() => void toggleFollow(user)}
          >
            {user.followed ? <UserMinus size={14} /> : <UserPlus size={14} />}
            {user.followed ? "取消关注" : "关注"}
          </button>
        </article>
      ))}
      {!users.length && <div className="empty">暂无用户</div>}
    </div>
  );
}

export default function SocialPage() {
  const tab = useExploreStore((s) => s.socialTab);
  const events = useExploreStore((s) => s.events);
  const follows = useExploreStore((s) => s.follows);
  const followers = useExploreStore((s) => s.followers);
  const loading = useExploreStore((s) => s.loading);
  const setTab = useExploreStore((s) => s.setSocialTab);
  const loadSocial = useExploreStore((s) => s.loadSocial);
  const openAlbum = useExploreStore((s) => s.openAlbum);
  const openComments = useCommentStore((s) => s.openResourceComments);
  const toggleEventLike = useExploreStore((s) => s.toggleEventLike);

  useEffect(() => {
    void loadSocial();
  }, [loadSocial]);

  return (
    <Page>
      <PageHeader
        title="动态与关注"
        subtitle="查看关注用户的动态、关注列表和粉丝"
      />
      <div className="segmented social-tabs">
        <button
          className={tab === "events" ? "active" : ""}
          onClick={() => setTab("events")}
        >
          动态
        </button>
        <button
          className={tab === "follows" ? "active" : ""}
          onClick={() => setTab("follows")}
        >
          关注 {follows.length}
        </button>
        <button
          className={tab === "followers" ? "active" : ""}
          onClick={() => setTab("followers")}
        >
          粉丝 {followers.length}
        </button>
      </div>
      {tab === "follows" ? (
        <UserList users={follows} />
      ) : tab === "followers" ? (
        <UserList users={followers} />
      ) : (
        <div className="event-list">
          {events.map((event) => (
            <article className="event-row" key={event.id}>
              <img src={sizedImage(event.user.avatarUrl, 100)} alt="" />
              <div className="event-body">
                <div className="event-head">
                  <strong>{event.user.nickname}</strong>
                  <time>{new Date(event.time).toLocaleString()}</time>
                </div>
                <p>{event.text || "分享了一条动态"}</p>
                {event.resourceTitle && (
                  <button
                    className="event-resource"
                    disabled={
                      event.resourceType !== "album" || !event.resourceId
                    }
                    onClick={() =>
                      event.resourceId &&
                      event.resourceType === "album" &&
                      void openAlbum(event.resourceId)
                    }
                  >
                    {event.resourceTitle}
                  </button>
                )}
                <div className="event-stats">
                  <button
                    className={`event-like-button ${event.liked ? "active" : ""}`}
                    onClick={() => void toggleEventLike(event)}
                  >
                    <Heart size={13} /> {event.likedCount}
                  </button>
                  <button
                    className="event-comment-button"
                    disabled={!event.threadId}
                    onClick={() =>
                      event.threadId &&
                      void openComments(
                        {
                          type: "event",
                          id: String(event.id),
                          threadId: event.threadId,
                          title: `${event.user.nickname} 的动态`,
                          subtitle: event.resourceTitle,
                        },
                        true,
                      )
                    }
                  >
                    <MessageCircle size={13} /> 评论 {event.commentCount}
                  </button>
                  <span>转发 {event.forwardCount}</span>
                </div>
              </div>
            </article>
          ))}
          {!events.length &&
            (loading ? (
              <LoadingState label="正在加载动态…" />
            ) : (
              <div className="empty">暂无动态</div>
            ))}
        </div>
      )}
    </Page>
  );
}
