import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../store/playerStore'

function vipLabel(vipType?: number): string {
  if (!vipType || vipType === 0) return '普通用户'
  if (vipType === 11) return '黑胶 SVIP'
  if (vipType === 10) return '黑胶 VIP'
  return 'VIP 会员'
}

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const profile = usePlayerStore((s) => s.profile)
  const logout = usePlayerStore((s) => s.logout)
  const setShowLogin = usePlayerStore((s) => s.setShowLogin)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const switchAccount = () => {
    logout()
    setOpen(false)
    setShowLogin(true)
  }

  return (
    <div className="user-menu" ref={ref}>
      <button className="topnav-user" onClick={() => setOpen(!open)} title={profile?.nickname}>
        <img src={profile?.avatarUrl} alt="" />
      </button>
      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-head">
            <img src={profile?.avatarUrl} alt="" />
            <div className="uh-info">
              <div className="nm">{profile?.nickname}</div>
              <div className="vip">{vipLabel(profile?.vipType)}</div>
            </div>
          </div>
          <div className="user-dropdown-row">
            <span>会员信息</span>
            <span>{vipLabel(profile?.vipType)}</span>
          </div>
          <button className="user-dropdown-item" onClick={switchAccount}>
            切换账号
          </button>
          <button
            className="user-dropdown-item danger"
            onClick={() => {
              logout()
              setOpen(false)
            }}
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}
