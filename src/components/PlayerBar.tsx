import { useEffect, useState } from "react";
import { getIntelligentPlaylist } from "../api/playback";
import { checkSongAvailability, getDynamicSongCover, getSongLikeStatus } from "../api/songStatus";
import { usePlayerStore } from "../store/playerStore";
import { formatTime } from "../utils/lyrics";
import { sizedImage } from "../utils/image";
import { captureCoverOrigin } from "../utils/sharedCoverTransition";
import type { PlayMode } from "../api/types";
import SongSheetDialog from "./SongSheetDialog";
import ShareResourceDialog from "./ShareResourceDialog";
import {
  Disc3,
  Heart,
  ListMusic,
  MessageCircle,
  Pause,
  Play,
  Radio,
  Repeat1,
  Shuffle,
  Sparkles,
  Music2,
  BadgeCheck,
  Share2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";

const MODE_LABEL: Record<PlayMode, string> = {
  sequence: "顺序播放",
  one: "单曲循环",
  shuffle: "随机播放",
};

function ModeIcon({ mode }: { mode: PlayMode }) {
  if (mode === "shuffle") return <Shuffle size={18} />;
  if (mode === "one") return <Repeat1 size={18} />;
  return <ListMusic size={18} />;
}

export default function PlayerBar() {
  const [failedCover, setFailedCover] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dynamicCover, setDynamicCover] = useState("");
  const [remoteLiked, setRemoteLiked] = useState<boolean | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const playing = usePlayerStore((s) => s.playing);
  const loadingUrl = usePlayerStore((s) => s.loadingUrl);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const playMode = usePlayerStore((s) => s.playMode);
  const likedIds = usePlayerStore((s) => s.likedIds);
  const queueSource = usePlayerStore((s) => s.queueSource);
  const coverQuality = usePlayerStore((s) => s.coverQuality);
  const showPlayerComments = usePlayerStore((s) => s.showPlayerComments);

  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const cyclePlayMode = usePlayerStore((s) => s.cyclePlayMode);
  const setPage = usePlayerStore((s) => s.setPage);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const loadPersonalFm = usePlayerStore((s) => s.loadPersonalFm);
  const setShowPlayerComments = usePlayerStore((s) => s.setShowPlayerComments);
  const toast = usePlayerStore((s) => s.toast);
  const playSong = usePlayerStore((s) => s.playSong);
  const playlistId = usePlayerStore((s) => s.playlistId);
  const loggedIn = usePlayerStore((s) => s.loggedIn);

  useEffect(() => {
    let alive = true;
    setDynamicCover("");
    setRemoteLiked(null);
    if (!currentSong) return;
    void getDynamicSongCover(currentSong.id)
      .then((url) => { if (alive && url) setDynamicCover(url); })
      .catch(() => {});
    if (loggedIn) {
      void getSongLikeStatus([currentSong.id])
        .then((status) => { if (alive && currentSong.id in status) setRemoteLiked(status[currentSong.id]!); })
        .catch(() => {});
    }
    return () => { alive = false; };
  }, [currentSong?.id, loggedIn]);

  const checkAvailability = async () => {
    if (!currentSong || availabilityLoading) {
      if (!currentSong) toast("请先播放一首歌曲", "info");
      return;
    }
    setAvailabilityLoading(true);
    try {
      const result = await checkSongAvailability(currentSong.id);
      toast(result.available ? "歌曲当前可播放" : result.message || "暂无版权", result.available ? "success" : "info");
    } catch {
      toast("歌曲可用性检查失败", "error");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const startIntelligentPlayback = async () => {
    if (!currentSong || smartLoading) {
      if (!currentSong) toast("请先播放一首歌曲", "info");
      return;
    }
    setSmartLoading(true);
    try {
      const songs = await getIntelligentPlaylist(currentSong.id, {
        playlistId: playlistId || undefined,
        count: 8,
      });
      if (!songs.length) {
        toast("暂无智能推荐歌曲", "info");
        return;
      }
      await playSong(songs[0]!, songs, "list");
      toast(`已载入 ${songs.length} 首智能推荐`, "success");
    } catch {
      toast("智能播放加载失败", "error");
    } finally {
      setSmartLoading(false);
    }
  };

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;
  const liked = currentSong ? remoteLiked ?? likedIds.includes(currentSong.id) : false;
  const coverUrl = dynamicCover || currentSong?.picUrl || "";
  const showCover = Boolean(
    currentSong && coverUrl && failedCover !== coverUrl,
  );

  return (
    <footer className="player-bar">
      {/* progress row inside the pill, with time at both ends */}
      <div className="pb-progress">
        <span className="pb-time">{formatTime(progress)}</span>
        <input
          className="slider pb-slider"
          type="range"
          min={0}
          max={duration || 0}
          value={progress}
          style={{ ["--val" as never]: `${pct}%` }}
          onChange={(e) => seek(Number(e.target.value))}
        />
        <span className="pb-time">{formatTime(duration)}</span>
      </div>

      <div className="pb-row">
        <div className="pb-left">
          <div
            className={`pb-cover ${playing ? "spinning" : "paused"}`}
            onPointerEnter={() => {
              void import("./NowPlayingView");
              if (coverQuality !== "image") void import("./ParticleAlbumCover");
            }}
            onClick={(event) => {
              captureCoverOrigin(event.currentTarget);
              setPage("nowplaying");
            }}
            title="打开播放页"
            style={{ cursor: "pointer" }}
          >
            {showCover && currentSong ? (
              <img
                key={currentSong.id}
                src={sizedImage(coverUrl, 120)}
                alt=""
                onError={() => setFailedCover(coverUrl)}
              />
            ) : (
              <div className="pb-cover-ph">
                <Disc3 size={21} />
              </div>
            )}
          </div>
          <div className="pb-info">
            <div className="t">{currentSong?.name ?? "未在播放"}</div>
            <div className="a">
              {currentSong?.artists ?? "选择一首歌开始播放"}
            </div>
          </div>
        </div>

        <div className="pb-controls">
          <button className="icon-btn" onClick={prev} title="上一首">
            <SkipBack size={19} />
          </button>
          <button
            className="icon-btn primary"
            onClick={togglePlay}
            title={playing ? "暂停" : "播放"}
          >
            {loadingUrl ? (
              <span className="spin-dot" />
            ) : playing ? (
              <Pause size={19} fill="currentColor" />
            ) : (
              <Play size={19} fill="currentColor" />
            )}
          </button>
          <button className="icon-btn" onClick={next} title="下一首">
            <SkipForward size={19} />
          </button>
          <button
            className="icon-btn active"
            onClick={cyclePlayMode}
            title={MODE_LABEL[playMode]}
          >
            <ModeIcon mode={playMode} />
          </button>
        </div>

        <div className="pb-right">
          <button
            className={`icon-btn ${queueSource === "fm" ? "active" : ""}`}
            onClick={() => void loadPersonalFm()}
            title="私人漫游"
          >
            <Radio size={17} />
          </button>
          <button
            className={`icon-btn ${smartLoading ? "active" : ""}`}
            onClick={() => void startIntelligentPlayback()}
            title="智能播放"
            disabled={smartLoading}
          >
            {smartLoading ? <span className="spin-dot" /> : <Sparkles size={17} />}
          </button>
          <button
            className={`icon-btn ${showPlayerComments ? "active" : ""}`}
            onPointerEnter={() => void import("./PlayerCommentsDrawer")}
            onClick={() => {
              if (!currentSong) {
                toast("请先播放一首歌曲", "info");
                return;
              }
              setShowPlayerComments(!showPlayerComments);
            }}
            title="歌曲评论"
          >
            <MessageCircle size={17} />
          </button>
          <button
            className={`icon-btn ${sheetOpen ? "active" : ""}`}
            onClick={() => {
              if (!currentSong) {
                toast("请先播放一首歌曲", "info");
                return;
              }
              setSheetOpen(true);
            }}
            title="查看乐谱"
          >
            <Music2 size={17} />
          </button>
          <button
            className={`icon-btn ${shareOpen ? "active" : ""}`}
            onClick={() => {
              if (!currentSong) { toast("请先播放一首歌曲", "info"); return; }
              setShareOpen(true);
            }}
            title="分享歌曲"
          >
            <Share2 size={17} />
          </button>
          <button
            className={`icon-btn ${liked ? "active" : ""}`}
            onClick={() => {
              setRemoteLiked(!liked);
              void toggleLike();
            }}
            title={liked ? "取消喜欢" : "喜欢"}
            style={liked ? { color: "#ec4141" } : undefined}
          >
            <Heart size={18} fill={liked ? "currentColor" : "none"} />
          </button>
          <button
            className={`icon-btn ${availabilityLoading ? "active" : ""}`}
            onClick={() => void checkAvailability()}
            disabled={availabilityLoading}
            title="检查歌曲可用性"
          >
            {availabilityLoading ? <span className="spin-dot" /> : <BadgeCheck size={17} />}
          </button>
          <div
            className="vol-wrap"
            onWheel={(e) => {
              e.preventDefault();
              const current = muted ? 0 : volume;
              setVolume(current + (e.deltaY < 0 ? 0.02 : -0.02));
            }}
          >
            <button className="icon-btn" onClick={toggleMute} title="静音">
              {muted || volume === 0 ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
            <div className="volume-popover" aria-label="音量调节">
              <span className="volume-value">
                {Math.round((muted ? 0 : volume) * 100)}
              </span>
              <input
                className="slider volume-slider"
                type="range"
                min={0}
                max={100}
                value={Math.round((muted ? 0 : volume) * 100)}
                style={{
                  ["--val" as never]: `${(muted ? 0 : volume) * 100}%`,
                }}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .spin-dot {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }
      `}</style>
      <SongSheetDialog
        song={currentSong}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
      <ShareResourceDialog
        song={currentSong}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </footer>
  );
}
