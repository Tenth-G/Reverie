import { useEffect, useState } from "react";
import type { PlaylistInfo } from "../api/types";
import { useExploreStore } from "../store/exploreStore";

export default function PlaylistEditorModal({
  playlist,
  open,
  onClose,
}: {
  playlist: PlaylistInfo | null;
  open: boolean;
  onClose: () => void;
}) {
  const createPlaylist = useExploreStore((s) => s.createPlaylist);
  const updatePlaylist = useExploreStore((s) => s.updatePlaylist);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privateList, setPrivateList] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(playlist?.name ?? "");
    setDescription(playlist?.description ?? "");
    setPrivateList(playlist?.privacy === 10);
  }, [open, playlist]);

  if (!open) return null;

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const ok = playlist
      ? await updatePlaylist(playlist, name, description)
      : await createPlaylist(name, privateList ? 10 : 0);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal entity-editor" onClick={(e) => e.stopPropagation()}>
        <h2>{playlist ? "编辑歌单" : "创建歌单"}</h2>
        <label className="field-label">
          名称
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field-label">
          描述
          <textarea
            value={description}
            maxLength={1000}
            rows={5}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {!playlist && (
          <label className="check-row">
            <input
              type="checkbox"
              checked={privateList}
              onChange={(e) => setPrivateList(e.target.checked)}
            />
            设为隐私歌单
          </label>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button
            className="btn primary"
            disabled={!name.trim() || saving}
            onClick={save}
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
