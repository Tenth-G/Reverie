import { usePlayerStore } from "../store/playerStore";
import { renderReleaseNotes } from "../utils/notes";

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return mb >= 100 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}

export default function UpdateModal() {
  const showUpdate = usePlayerStore((s) => s.showUpdate);
  const updatePhase = usePlayerStore((s) => s.updatePhase);
  const updateVersion = usePlayerStore((s) => s.updateVersion);
  const updateNotes = usePlayerStore((s) => s.updateNotes);
  const updateProgress = usePlayerStore((s) => s.updateProgress);
  const updateTransferred = usePlayerStore((s) => s.updateTransferred);
  const updateTotal = usePlayerStore((s) => s.updateTotal);
  const updateSpeed = usePlayerStore((s) => s.updateSpeed);
  const startUpdate = usePlayerStore((s) => s.startUpdate);
  const installUpdate = usePlayerStore((s) => s.installUpdate);
  const dismissUpdate = usePlayerStore((s) => s.dismissUpdate);

  if (!showUpdate) return null;

  const downloading = updatePhase === "downloading";
  const downloaded = updatePhase === "downloaded";

  return (
    <div
      className="modal-backdrop"
      onClick={downloaded ? undefined : dismissUpdate}
    >
      <div className="modal update-modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          {downloaded
            ? "更新已就绪"
            : downloading
              ? "正在下载更新"
              : "发现新版本"}
        </h2>

        <div className="update-versions">
          <span className="ver-old">v{__APP_VERSION__}</span>
          <span className="ver-arrow">→</span>
          <span className="ver-new">v{updateVersion}</span>
        </div>

        {updateNotes ? (
          <div
            className="update-notes"
            dangerouslySetInnerHTML={{
              __html: renderReleaseNotes(updateNotes),
            }}
          />
        ) : (
          <p className="sub">新版本已发布，点击「更新」即可下载安装。</p>
        )}

        {downloading && (
          <div className="update-progress">
            <div className="update-progress-bar">
              <i style={{ width: `${Math.max(2, updateProgress)}%` }} />
            </div>
            <div className="update-progress-meta">
              <span>{updateProgress}%</span>
              <span>
                {formatSize(updateTransferred)} / {formatSize(updateTotal)}
              </span>
              {updateSpeed > 0 && <span>{formatSize(updateSpeed)}/s</span>}
            </div>
          </div>
        )}

        <div className="update-actions">
          {downloaded ? (
            <>
              <button className="btn" onClick={dismissUpdate}>
                稍后再说
              </button>
              <button className="btn primary" onClick={installUpdate}>
                立即重启安装
              </button>
            </>
          ) : downloading ? (
            <button className="btn" onClick={dismissUpdate}>
              后台下载
            </button>
          ) : (
            <>
              <button className="btn" onClick={dismissUpdate}>
                取消
              </button>
              <button className="btn primary" onClick={startUpdate}>
                更新
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
