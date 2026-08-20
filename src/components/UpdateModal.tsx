import { usePlayerStore } from "../store/playerStore";

export default function UpdateModal() {
  const showUpdate = usePlayerStore((s) => s.showUpdate);
  const updatePhase = usePlayerStore((s) => s.updatePhase);
  const updateVersion = usePlayerStore((s) => s.updateVersion);
  const updateNotes = usePlayerStore((s) => s.updateNotes);
  const updateProgress = usePlayerStore((s) => s.updateProgress);
  const installUpdate = usePlayerStore((s) => s.installUpdate);
  const dismissUpdate = usePlayerStore((s) => s.dismissUpdate);

  if (!showUpdate) return null;

  const downloaded = updatePhase === "downloaded";

  return (
    <div className="modal-backdrop" onClick={dismissUpdate}>
      <div className="modal update-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{downloaded ? "更新已就绪" : "发现新版本"}</h2>
        <p className="sub">
          {downloaded
            ? "新版本已下载完成，重启应用即可完成安装。"
            : `Reverie v${updateVersion} 已发布，正在为您下载。`}
        </p>

        {!downloaded && (
          <div className="update-versions">
            <span className="ver-old">v{__APP_VERSION__}</span>
            <span className="ver-arrow">→</span>
            <span className="ver-new">v{updateVersion}</span>
          </div>
        )}

        {!downloaded && updatePhase === "downloading" && (
          <div className="update-progress">
            <div className="update-progress-bar">
              <i style={{ width: `${Math.max(2, updateProgress)}%` }} />
            </div>
            <span>{updateProgress}%</span>
          </div>
        )}

        {updateNotes && <div className="update-notes">{updateNotes}</div>}

        <div className="update-actions">
          <button className="btn" onClick={dismissUpdate}>
            {downloaded ? "稍后再说" : "后台下载"}
          </button>
          {downloaded && (
            <button className="btn primary" onClick={installUpdate}>
              立即重启安装
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
