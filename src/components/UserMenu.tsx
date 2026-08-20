import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../store/playerStore'
import badgeVip from '../assets/badge-vip.png'
import badgeSvip from '../assets/badge-svip.png'

function vipLabel(vipType?: number): string {
  if (!vipType || vipType === 0) return '普通用户'
  if (vipType === 11) return '黑胶 SVIP'
  if (vipType === 10) return '黑胶 VIP'
  return 'VIP 会员'
}

function remainingDays(expireTime?: number): string {
  if (!expireTime || expireTime <= 0) return ''
  const days = Math.ceil((expireTime - Date.now()) / 86400000)
  if (days <= 0) return '已过期'
  return `剩余 ${days} 天`
}

function formatExpire(expireTime?: number): string {
  if (!expireTime || expireTime <= 0) return '—'
  try {
    return new Date(expireTime).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const profile = usePlayerStore((s) => s.profile)
  const vipInfo = usePlayerStore((s) => s.vipInfo)
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
    setOpen(false)
    setShowLogin(true)
  }

  const vipType = Number(vipInfo?.vipType ?? profile?.vipType ?? 0)
  const vipLevel = Number(vipInfo?.vipLevel ?? 0)
  const expireTime = Number(vipInfo?.expireTime ?? 0)
  const isVip = vipType > 0 || vipLevel > 0 || expireTime > 0
  const days = remainingDays(expireTime)

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="topnav-user"
        onClick={() => setOpen(!open)}
        title={profile?.nickname}
      >
        {profile?.avatarUrl ? (
          <img className="user-avatar" src={profile.avatarUrl} alt="" />
        ) : (
          <span className="user-avatar user-avatar-ph">♪</span>
        )}
        {isVip &&
          (vipType === 11 ? (
            <span className="user-badge-dyn svip">
              <img src={badgeSvip} alt="黑胶SVIP" />
            </span>
          ) : (
            <span className="user-badge-dyn">
              <img src={badgeVip} alt="黑胶VIP" />
            </span>
          ))}
      </button>
      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-head">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" />
            ) : (
              <span className="user-avatar-ph-lg">♪</span>
            )}
            <div className="uh-info">
              <div className="nm">{profile?.nickname}</div>
              <div className="vip">{vipLabel(vipType)}</div>
            </div>
          </div>
          <div className="user-dropdown-row">
            <span>会员类型</span>
            <span>{vipLabel(vipType)}</span>
          </div>
          <div className="user-dropdown-row">
            <span>会员等级</span>
            <span>{vipLevel > 0 ? `Lv.${vipLevel}` : '—'}</span>
          </div>
          <div className="user-dropdown-row">
            <span>会员到期</span>
            <span>{isVip ? formatExpire(expireTime) : '—'}</span>
          </div>
          <div className="user-dropdown-row">
            <span>会员状态</span>
            <span>{isVip ? days || '生效中' : '普通用户'}</span>
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
