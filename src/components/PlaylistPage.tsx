import { usePlayerStore } from "../store/playerStore";
import { Page, PageHeader } from "./Page";
import SongList from "./SongList";
import PlaylistEditorModal from "./PlaylistEditorModal";
import BackButton from "./BackButton";
import ConfirmModal from "./ConfirmModal";

export default function PlaylistPage() {
  const playlistSongs = usePlayerStore((s) => s.playlistSongs);
  const playlistName = usePlayerStore((s) => s.playlistName);
  const playlistId = usePlayerStore((s) => s.playlistId);
  const playlistDescription = usePlayerStore((s) => s.playlistDescription);
  const playlistCreatorId = usePlayerStore((s) => s.playlistCreatorId);
  const playlistSubscribed = usePlayerStore((s) => s.playlistSubscribed);
  const playlistLoading = usePlayerStore((s) => s.playlistLoading);
  const uid = usePlayerStore((s) => s.profile?.userId ?? 0);
  const closePlaylist = usePlayerStore((s) => s.closePlaylist);
  const deletePlaylist = useExploreStore((s) => s.deletePlaylist);
  const toggleSubscription = useExploreStore(
    (s) => s.togglePlaylistSubscription,
  );
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const playlist: PlaylistInfo = {
    id: playlistId,
    name: playlistName,
    coverImgUrl: "",
    trackCount: playlistSongs.length,
    description: playlistDescription,
    creatorId: playlistCreatorId,
    subscribed: playlistSubscribed,
  };
  const owned = playlistCreatorId > 0 && playlistCreatorId === uid;

  return (
    <Page>
      <BackButton onClick={closePlaylist} />
      <PageHeader
        title={playlistName || "歌单"}
        subtitle={playlistDescription || `${playlistSongs.length} 首`}
        actions={
          <div className="page-action-row">
            {owned ? (
              <>
                <button className="btn" onClick={() => setEditing(true)}>
                  <Pencil size={14} /> 编辑
                </button>
                <button
                  className="btn danger"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 size={14} /> 删除
                </button>
              </>
            ) : (
              <button
                className={`btn ${playlistSubscribed ? "active" : "primary"}`}
                onClick={() => void toggleSubscription(playlist)}
              >
                <Heart
                  size={14}
                  fill={playlistSubscribed ? "currentColor" : "none"}
                />
                {playlistSubscribed ? "已收藏" : "收藏歌单"}
              </button>
            )}
          </div>
        }
      />
      <SongList
        songs={playlistSongs}
        loading={playlistLoading}
        emptyText="歌单为空"
      />
      <PlaylistEditorModal
        playlist={playlist}
        open={editing}
        onClose={() => setEditing(false)}
      />
      <ConfirmModal
        open={confirmingDelete}
        title="删除歌单"
        message={`确定删除「${playlistName || "这个歌单"}」吗？删除后无法恢复。`}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => deletePlaylist(playlist)}
      />
    </Page>
  );
}
import { useState } from "react";
import { Heart, Pencil, Trash2 } from "lucide-react";
import type { PlaylistInfo } from "../api/types";
import { useExploreStore } from "../store/exploreStore";
