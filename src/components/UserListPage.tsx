import { usePlayerStore } from "../store/playerStore";
import { Page, PageHeader } from "./Page";
import PlaylistGrid from "./PlaylistGrid";
import PlaylistEditorModal from "./PlaylistEditorModal";
import ConfirmModal from "./ConfirmModal";

export default function UserListPage() {
  const userPlaylists = usePlayerStore((s) => s.userPlaylists);
  const openPlaylist = usePlayerStore((s) => s.openPlaylist);
  const userPlaylistsLoading = usePlayerStore((s) => s.userPlaylistsLoading);
  const uid = usePlayerStore((s) => s.profile?.userId ?? 0);
  const deletePlaylist = useExploreStore((s) => s.deletePlaylist);
  const toggleSubscription = useExploreStore(
    (s) => s.togglePlaylistSubscription,
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PlaylistInfo | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PlaylistInfo | null>(null);

  return (
    <Page>
      <PageHeader
        title="我的歌单"
        subtitle="管理我创建和收藏的歌单"
        actions={
          <button
            className="btn primary"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus size={15} /> 创建歌单
          </button>
        }
      />
      <PlaylistGrid
        playlists={userPlaylists}
        onOpen={openPlaylist}
        loading={userPlaylistsLoading}
        emptyText="登录后查看「我创建 / 收藏的歌单」"
        renderActions={(playlist) =>
          playlist.creatorId === uid ? (
            <>
              <button
                className="icon-action"
                title="编辑歌单"
                onClick={() => {
                  setEditing(playlist);
                  setEditorOpen(true);
                }}
              >
                <Pencil size={15} />
              </button>
              <button
                className="icon-action danger"
                title="删除歌单"
                onClick={() => setPendingDelete(playlist)}
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            <button
              className={`icon-action ${playlist.subscribed ? "active" : ""}`}
              title={playlist.subscribed ? "取消收藏" : "收藏歌单"}
              onClick={() => void toggleSubscription(playlist)}
            >
              <Heart
                size={15}
                fill={playlist.subscribed ? "currentColor" : "none"}
              />
            </button>
          )
        }
      />
      <PlaylistEditorModal
        playlist={editing}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
      <ConfirmModal
        open={pendingDelete !== null}
        title="删除歌单"
        message={`确定删除「${pendingDelete?.name ?? "这个歌单"}」吗？删除后无法恢复。`}
        onClose={() => setPendingDelete(null)}
        onConfirm={() =>
          pendingDelete ? deletePlaylist(pendingDelete) : false
        }
      />
    </Page>
  );
}
import { useState } from "react";
import { Pencil, Plus, Trash2, Heart } from "lucide-react";
import type { PlaylistInfo } from "../api/types";
import { useExploreStore } from "../store/exploreStore";
