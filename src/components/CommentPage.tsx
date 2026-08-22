import { MessageCircle } from "lucide-react";
import { useCommentStore } from "../store/commentStore";
import { sizedImage } from "../utils/image";
import BackButton from "./BackButton";
import CommentPanel from "./CommentPanel";
import { Page, PageHeader } from "./Page";

const RESOURCE_LABELS = {
  song: "歌曲",
  mv: "MV",
  playlist: "歌单",
  album: "专辑",
  program: "播客节目",
  video: "视频",
  event: "动态",
} as const;

export default function CommentPage() {
  const resource = useCommentStore((state) => state.resource);
  if (!resource) {
    return (
      <Page>
        <BackButton />
        <div className="empty">未选择评论资源</div>
      </Page>
    );
  }
  return (
    <Page>
      <BackButton />
      <div className="comment-page-heading">
        {resource.coverUrl ? (
          <img src={sizedImage(resource.coverUrl, 180)} alt="" />
        ) : (
          <span className="comment-resource-placeholder">
            <MessageCircle size={24} />
          </span>
        )}
        <PageHeader
          title={resource.title}
          subtitle={`${RESOURCE_LABELS[resource.type]}评论${resource.subtitle ? ` · ${resource.subtitle}` : ""}`}
        />
      </div>
      <CommentPanel />
    </Page>
  );
}
