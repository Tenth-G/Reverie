import type { ReactNode } from "react";
import { LogIn } from "lucide-react";
import { usePlayerStore } from "../store/playerStore";

export default function LoginGate({ children }: { children: ReactNode }) {
  const authReady = usePlayerStore((s) => s.authReady);
  const loggedIn = usePlayerStore((s) => s.loggedIn);

  if (!authReady) {
    return (
      <div className="session-loading" role="status" aria-live="polite">
        <span className="session-loading-mark">R</span>
        <div>
          <strong>正在恢复会话</strong>
          <span>同步你的音乐与收藏</span>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="login-empty">
        <div className="login-empty-icon">
          <LogIn size={32} />
        </div>
        <h2>登录后开启音乐之旅</h2>
        <p>
          请点击右上角<span className="hint-strong">「登录」</span>进行登录
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
