import { usePlayerStore } from "../store/playerStore";

export default function UpdateModal() {
  const showUpdate = usePlayerStore((s) => s.showUpdate);
  const updateInfo = usePlayerStore((s) => s.updateInfo);
  const dismissUpdate = usePlayerStore((s) => s.dismissUpdate);

  if (!showUpdate || !updateInfo) return null;

  return (
    <div className="modal-backdrop" onClick={dismissUpdate}>
      <div className="modal update-modal" onClick={(e) => e.stopPropagation()}>
        <h2>发现新版本</h2>
        <p className="sub">Reverie 有新版本可用，点击下载体验吧</p>
        <div className="update-versions">
          <span className="ver-old">v{__APP_VERSION__}</span>
          <span className="ver-arrow">→</span>
          <span className="ver-new">v{updateInfo.version}</span>
        </div>
        {updateInfo.notes && (
          <div className="update-notes">{updateInfo.notes}</div>
        )}
        <div className="update-actions">
          <button className="btn" onClick={dismissUpdate}>
            稍后再说
          </button>
          <button
            className="btn primary"
            onClick={() => window.open(updateInfo.url, "_blank")}
          >
            前往下载
          </button>
        </div>
      </div>
    </div>
  );
}
