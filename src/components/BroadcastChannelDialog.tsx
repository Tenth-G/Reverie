import { Info, Play, Radio, X } from "lucide-react";
import type { BroadcastChannel } from "../api/types.ts";
import { usePlayerStore } from "../store/playerStore.ts";
import { sizedImage } from "../utils/image";
import { LoadingState } from "./Page";

interface Props {
  channel: BroadcastChannel;
  loading: boolean;
  onClose: () => void;
}

export default function BroadcastChannelDialog({
  channel,
  loading,
  onClose,
}: Props) {
  const playSong = usePlayerStore((state) => state.playSong);
  return (
    <div
      className="modal-backdrop broadcast-detail-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="broadcast-detail-dialog"
        role="dialog"
        aria-modal="true"
      >
        <header className="broadcast-detail-head">
          {channel.coverUrl ? (
            <img src={sizedImage(channel.coverUrl, 160)} alt="" />
          ) : (
            <span>
              <Radio size={24} />
            </span>
          )}
          <div>
            <span className="broadcast-detail-kicker">
              <Info size={13} /> 广播频道
            </span>
            <h2>{channel.name}</h2>
            <small>
              {channel.categoryName || channel.regionName || "广播频道"}
            </small>
          </div>
          <button className="modal-close" title="关闭" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {loading ? (
          <LoadingState label="正在加载频道信息…" />
        ) : (
          <div className="broadcast-detail-content">
            <p>{channel.description || "暂无频道简介"}</p>
            {channel.currentSong ? (
              <div className="broadcast-current-song">
                <div>
                  <strong>{channel.currentSong.name}</strong>
                  <span>{channel.currentSong.artists}</span>
                </div>
                <button
                  className="primary-button"
                  onClick={() =>
                    void playSong(channel.currentSong!, [channel.currentSong!])
                  }
                >
                  <Play size={14} fill="currentColor" /> 播放
                </button>
              </div>
            ) : (
              <div className="broadcast-detail-empty">暂无当前节目</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
