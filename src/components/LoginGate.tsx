import type { ReactNode } from 'react'
import { usePlayerStore } from '../store/playerStore'

export default function LoginGate({ children }: { children: ReactNode }) {
  const loggedIn = usePlayerStore((s) => s.loggedIn)
  const setShowLogin = usePlayerStore((s) => s.setShowLogin)

  if (!loggedIn) {
    return (
      <div className="login-empty">
        <div className="login-empty-icon">♪</div>
        <h2>登录后开启音乐之旅</h2>
        <p>扫码登录网易云音乐，畅享每日推荐、私人FM、我的歌单</p>
        <button className="btn primary" onClick={() => setShowLogin(true)}>
          登录
        </button>
      </div>
    )
  }

  return <>{children}</>
}
