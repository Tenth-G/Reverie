import type { ReactNode } from "react";
import { usePlayerStore } from "../store/playerStore";

export default function LoginGate({ children }: { children: ReactNode }) {
  const loggedIn = usePlayerStore((s) => s.loggedIn);

  if (!loggedIn) {
    return (
      <div className="login-empty">
        <div className="login-empty-icon">♪</div>
        <h2>登录后开启音乐之旅</h2>
        <p>
          请点击右上角<span className="hint-strong">「登录」</span>进行登录
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
