import { FileText, Mic2, X } from "lucide-react";
import type { VoiceItem } from "../api/types.ts";
import { sizedImage } from "../utils/image";
import { formatTime } from "../utils/lyrics";
import { LoadingState } from "./Page";

interface Props {
  voice: VoiceItem;
  lyric: string;
  loading: boolean;
  onClose: () => void;
}

export default function VoiceDetailDialog({
  voice,
  lyric,
  loading,
  onClose,
}: Props) {
  return (
    <div
      className="modal-backdrop voice-detail-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="voice-detail-dialog" role="dialog" aria-modal="true">
        <header className="voice-detail-head">
          {voice.coverUrl ? (
            <img src={sizedImage(voice.coverUrl, 120)} alt="" />
          ) : (
            <span>
              <Mic2 size={22} />
            </span>
          )}
          <div>
            <h2>{voice.name}</h2>
            <small>
              {voice.voiceListName || "声音"} · {formatTime(voice.duration)} ·{" "}
              {voice.playCount.toLocaleString("zh-CN")} 次播放
            </small>
          </div>
          <button className="modal-close" title="关闭" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="voice-detail-content">
          <section>
            <h3>简介</h3>
            <p>{voice.description || "暂无简介"}</p>
          </section>
          <section>
            <h3>
              <FileText size={14} /> 歌词
            </h3>
            {loading ? (
              <LoadingState label="正在加载声音详情…" />
            ) : (
              <pre>{lyric || "暂无歌词"}</pre>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
