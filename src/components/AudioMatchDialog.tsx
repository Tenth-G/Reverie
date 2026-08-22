import { useState } from "react";
import { Fingerprint, X } from "lucide-react";
import { matchAudioFingerprint } from "../api/audioMatch.ts";
import type { Song } from "../api/types.ts";
import { usePlayerStore } from "../store/playerStore";
import SongList from "./SongList";

export default function AudioMatchDialog({ onClose }: { onClose: () => void }) {
  const [audioFP, setAudioFP] = useState("");
  const [duration, setDuration] = useState("180000");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      setSongs(await matchAudioFingerprint(audioFP, Number(duration)));
    } catch {
      setSongs([]);
      usePlayerStore.getState().toast("音频识别失败", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal audio-match-dialog" role="dialog" aria-modal="true">
        <header className="modal-heading">
          <h2><Fingerprint size={18} /> 音频识别</h2>
          <button className="modal-close" title="关闭" onClick={onClose}><X size={18} /></button>
        </header>
        <label className="field-label">
          音频指纹
          <textarea value={audioFP} rows={4} placeholder="粘贴 audioFP" onChange={(event) => setAudioFP(event.target.value)} />
        </label>
        <label className="field-label">
          时长（毫秒）
          <input type="number" min={1} value={duration} onChange={(event) => setDuration(event.target.value)} />
        </label>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>关闭</button>
          <button className="btn primary" disabled={!audioFP.trim() || Number(duration) <= 0 || loading} onClick={() => void submit()}>
            {loading ? "识别中…" : "开始识别"}
          </button>
        </div>
        {(loading || songs.length > 0) && <SongList songs={songs} loading={loading} title="识别结果" emptyText="未匹配到歌曲" />}
      </div>
    </div>
  );
}
