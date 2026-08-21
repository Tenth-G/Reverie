import { ArrowLeft } from "lucide-react";
import { usePlayerStore } from "../store/playerStore";

export default function BackButton({ onClick }: { onClick?: () => void }) {
  const prevView = usePlayerStore((s) => s.prevView);
  const setActiveView = usePlayerStore((s) => s.setActiveView);
  return (
    <button
      className="btn detail-back"
      onClick={onClick ?? (() => setActiveView(prevView || "home"))}
      title="返回"
    >
      <ArrowLeft size={14} /> 返回
    </button>
  );
}
