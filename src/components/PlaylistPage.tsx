import { useEffect, useState } from "react";
import { Heart, ListPlus, MessageCircle, Pencil, Trash2 } from "lucide-react";
import type { PlaylistInfo } from "../api/types";
import type { Song } from "../api/types";
import { getPlaylistDetail } from "../api/client";
import {
  getPlaylistDynamicStats,
  manipulatePlaylistTracks,
  updatePlaylistOrder,
} from "../api/playlist";
import { useExploreStore } from "../store/exploreStore";
import { usePlayerStore } from "../store/playerStore";
import { useCommentStore } from "../store/commentStore";
import type { PlaylistDynamicStats } from "../api/types";
import { Page, PageHeader } from "./Page";
import SongList from "./SongList";
import PlaylistEditorModal from "./PlaylistEditorModal";
import BackButton from "./BackButton";
import ConfirmModal from "./ConfirmModal";
import PlaylistTrackPicker from "./PlaylistTrackPicker";

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
  const openComments = useCommentStore((s) => s.openResourceComments);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [dynamicStats, setDynamicStats] = useState<PlaylistDynamicStats | null>(null);

  useEffect(() => {
    let alive = true;
    setDynamicStats(null);
    if (!playlistId) return;
    void getPlaylistDynamicStats(playlistId)
      .then((stats) => {
        if (alive) setDynamicStats(stats);
      })
      .catch(() => {
        if (alive) setDynamicStats(null);
      });
    return () => {
      alive = false;
    };
  }, [playlistId]);

  const refreshSongs = async () => {
    const detail = await getPlaylistDetail(playlistId);
    usePlayerStore.setState({
      playlistSongs: detail.songs,
      playlistName: detail.name,
      playlistDescription: detail.description,
      playlistCreatorId: detail.creatorId,
      playlistSubscribed: detail.subscribed,
    });
  };

  const addSongs = async (songs: Song[]) => {
    setMutating(true);
    try {
      await manipulatePlaylistTracks(
        playlistId,
        "add",
        songs.map((song) => song.id),
      );
      await refreshSongs();
      usePlayerStore
        .getState()
        .toast(`已添加 ${songs.length} 首歌曲`, "success");
      return true;
    } catch {
      usePlayerStore.getState().toast("添加歌曲失败", "error");
      return false;
    } finally {
      setMutating(false);
    }
  };

  const removeSong = async (song: Song) => {
    if (mutating) return;
    setMutating(true);
    try {
      await manipulatePlaylistTracks(playlistId, "del", [song.id]);
      usePlayerStore.setState({
        playlistSongs: playlistSongs.filter((item) => item.id !== song.id),
      });
      usePlayerStore.getState().toast("已从歌单移除", "success");
    } catch {
      usePlayerStore.getState().toast("移除歌曲失败", "error");
    } finally {
      setMutating(false);
    }
  };

  const moveSong = async (song: Song, index: number, direction: -1 | 1) => {
    if (mutating) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= playlistSongs.length) return;
    const reordered = [...playlistSongs];
    const [item] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, item!);
    usePlayerStore.setState({ playlistSongs: reordered });
    setMutating(true);
    try {
      await updatePlaylistOrder(
        playlistId,
        reordered.map((entry) => entry.id),
      );
    } catch {
      usePlayerStore.setState({ playlistSongs });
      usePlayerStore.getState().toast(`调整「${song.name}」顺序失败`, "error");
    } finally {
      setMutating(false);
    }
  };
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
            <button
              className="btn"
              onClick={() =>
                void openComments(
                  {
                    type: "playlist",
                    id: String(playlistId),
                    title: playlistName || "歌单",
                    subtitle: `${playlistSongs.length} 首歌曲`,
                  },
                  true,
                )
              }
            >
              <MessageCircle size={14} /> 评论
            </button>
            {owned ? (
              <>
                <button
                  className="btn primary"
                  onClick={() => setPickerOpen(true)}
                  disabled={mutating}
                >
                  <ListPlus size={14} /> 添加歌曲
                </button>
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
      {dynamicStats && (
        <div className="playlist-dynamic-stats" aria-label="歌单动态统计">
          <span>播放 {dynamicStats.playCount.toLocaleString("zh-CN")}</span>
          <span>收藏 {dynamicStats.subscribedCount.toLocaleString("zh-CN")}</span>
          <span>评论 {dynamicStats.commentCount.toLocaleString("zh-CN")}</span>
          <span>分享 {dynamicStats.shareCount.toLocaleString("zh-CN")}</span>
        </div>
      )}
      <SongList
        songs={playlistSongs}
        loading={playlistLoading}
        emptyText="歌单为空"
        onRemove={owned ? (song) => void removeSong(song) : undefined}
        onMove={
          owned
            ? (song, index, direction) => void moveSong(song, index, direction)
            : undefined
        }
      />
      <PlaylistTrackPicker
        open={pickerOpen}
        existingIds={new Set(playlistSongs.map((song) => song.id))}
        onClose={() => setPickerOpen(false)}
        onSubmit={addSongs}
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
