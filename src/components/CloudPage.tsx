import { useEffect, useState } from "react";
import {
  Cloud,
  FileAudio,
  Play,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCloudStore } from "../store/cloudStore";
import { usePlayerStore } from "../store/playerStore";
import type { CloudSong } from "../api/types";
import ConfirmModal from "./ConfirmModal";
import { LoadingState, Page, PageHeader } from "./Page";
import { sizedImage } from "../utils/image";

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "大小未知";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function SongCover({ song }: { song: CloudSong }) {
  const [failed, setFailed] = useState(false);
  if (song.picUrl && !failed) {
    return (
      <img
        className="cloud-song-cover"
        src={sizedImage(song.picUrl, 120)}
        alt=""
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className="cloud-song-cover cloud-song-placeholder"
      aria-hidden="true"
    >
      <FileAudio size={20} />
    </span>
  );
}

function SongRow({ song, songs }: { song: CloudSong; songs: CloudSong[] }) {
  const playSong = usePlayerStore((state) => state.playSong);
  const match = useCloudStore((state) => state.match);
  const matchingId = useCloudStore((state) => state.matchingId);
  const [matchId, setMatchId] = useState(
    song.matchedSongId ? String(song.matchedSongId) : "",
  );
  const busy = matchingId === (song.cloudId || song.id);
  return (
    <article className="cloud-song-row">
      <SongCover song={song} />
      <div className="cloud-song-main">
        <strong title={song.fileName}>{song.name}</strong>
        <span>
          {song.artists} · {song.album}
        </span>
        <small>
          {formatBytes(song.fileSize)}
          {song.bitrate ? ` · ${Math.round(song.bitrate / 1000)} kbps` : ""}
        </small>
      </div>
      <div className="cloud-song-actions">
        <button
          className="icon-action"
          title="播放"
          onClick={() => void playSong(song, songs)}
        >
          <Play size={16} fill="currentColor" />
        </button>
        <div className="cloud-match-control">
          <input
            value={matchId}
            inputMode="numeric"
            aria-label={`为 ${song.name} 输入匹配歌曲 ID`}
            placeholder="匹配歌曲 ID"
            onChange={(event) =>
              setMatchId(event.target.value.replace(/\D/g, ""))
            }
          />
          <button
            className="icon-action"
            title="匹配歌曲"
            disabled={busy || !matchId}
            onClick={() => void match(song, Number(matchId))}
          >
            {busy ? (
              <RefreshCw size={15} className="spin" />
            ) : (
              <RefreshCw size={15} />
            )}
          </button>
        </div>
        <DeleteButton song={song} />
      </div>
    </article>
  );
}

function DeleteButton({ song }: { song: CloudSong }) {
  const remove = useCloudStore((state) => state.remove);
  const deletingId = useCloudStore((state) => state.deletingId);
  const [open, setOpen] = useState(false);
  const busy = deletingId === (song.cloudId || song.id);
  return (
    <>
      <button
        className="icon-action danger"
        title="删除云盘歌曲"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        <Trash2 size={16} />
      </button>
      <ConfirmModal
        open={open}
        title="删除云盘歌曲"
        message={`确定从云盘删除「${song.name}」吗？`}
        onClose={() => setOpen(false)}
        onConfirm={() => remove(song)}
      />
    </>
  );
}

export default function CloudPage() {
  const songs = useCloudStore((state) => state.songs);
  const total = useCloudStore((state) => state.total);
  const loading = useCloudStore((state) => state.loading);
  const loadingMore = useCloudStore((state) => state.loadingMore);
  const hasMore = useCloudStore((state) => state.hasMore);
  const uploadPhase = useCloudStore((state) => state.uploadPhase);
  const uploadName = useCloudStore((state) => state.uploadName);
  const uploadError = useCloudStore((state) => state.uploadError);
  const load = useCloudStore((state) => state.load);
  const loadMore = useCloudStore((state) => state.loadMore);
  const upload = useCloudStore((state) => state.upload);
  const resetUpload = useCloudStore((state) => state.resetUpload);

  useEffect(() => {
    void load(true);
  }, [load]);

  return (
    <Page>
      <PageHeader
        title="云盘"
        subtitle={`${total} 首歌曲`}
        actions={
          <div className="cloud-header-actions">
            <button
              className="btn"
              title="刷新云盘"
              onClick={() => void load(true)}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} /> 刷新
            </button>
            <label className="btn primary cloud-upload-button">
              <Upload size={15} /> 上传歌曲
              <input
                type="file"
                accept="audio/*,.mp3,.flac,.m4a,.wav,.ogg"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";
                  if (file) void upload(file);
                }}
              />
            </label>
          </div>
        }
      />
      {uploadPhase !== "idle" && (
        <div className={`cloud-upload-status ${uploadPhase}`} role="status">
          <Cloud size={17} />
          <span>
            {uploadPhase === "uploading" && `正在上传 ${uploadName}…`}
            {uploadPhase === "success" && `${uploadName} 已上传`}
            {uploadPhase === "error" && (uploadError || "上传失败")}
          </span>
          {uploadPhase !== "uploading" && (
            <button title="关闭上传状态" onClick={resetUpload}>
              <X size={15} />
            </button>
          )}
        </div>
      )}
      {loading && !songs.length ? (
        <LoadingState label="正在加载云盘…" />
      ) : !songs.length ? (
        <div className="empty cloud-empty">
          <Cloud size={28} />
          <strong>云盘暂无歌曲</strong>
          <span>上传本地音乐后，它会出现在这里。</span>
        </div>
      ) : (
        <>
          <div className="cloud-song-list">
            {songs.map((song) => (
              <SongRow
                key={`${song.cloudId}-${song.id}`}
                song={song}
                songs={songs}
              />
            ))}
          </div>
          {hasMore && (
            <button
              className="btn cloud-load-more"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? "加载中…" : "加载更多"}
            </button>
          )}
        </>
      )}
    </Page>
  );
}
