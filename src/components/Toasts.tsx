import { usePlayerStore } from "../store/playerStore";
import { BadgeCheck, CircleAlert, Info, X } from "lucide-react";

const META = {
  info: <Info size={17} />,
  success: <BadgeCheck size={17} />,
  error: <CircleAlert size={17} />,
};

export default function Toasts() {
  const toasts = usePlayerStore((s) => s.toasts);
  const dismissToast = usePlayerStore((s) => s.dismissToast);
  if (!toasts.length) return null;
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} role="status">
          <span className="toast-icon">{META[t.type]}</span>
          <div className="toast-copy">
            <span>{t.text}</span>
          </div>
          <button
            className="toast-close"
            onClick={() => dismissToast(t.id)}
            title="关闭通知"
          >
            <X size={14} />
          </button>
          <i className="toast-life" />
        </div>
      ))}
    </div>
  );
}
