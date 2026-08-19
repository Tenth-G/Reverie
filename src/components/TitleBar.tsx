import { useEffect, useState } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { IconClose, IconMaximize, IconMinimize, IconRestore, IconSettings } from './icons'

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)
  const setShowSettings = usePlayerStore((s) => s.setShowSettings)

  useEffect(() => {
    if (!window.ncm) return
    window.ncm
      .isMaximized()
      .then(setMaximized)
      .catch(() => {})
    return window.ncm.onMaximized(setMaximized)
  }, [])

  return (
    <header className="titlebar">
      <div className="titlebar-drag" />
      <div className="titlebar-name">Reverie</div>
      <div className="titlebar-controls">
        <button className="tb-btn" onClick={() => setShowSettings(true)} title="设置">
          <IconSettings width={15} height={15} />
        </button>
        <button className="tb-btn" onClick={() => window.ncm?.minimize()} title="最小化">
          <IconMinimize width={15} height={15} />
        </button>
        <button
          className="tb-btn"
          onClick={() => window.ncm?.maximize()}
          title={maximized ? '还原' : '最大化'}
        >
          {maximized ? (
            <IconRestore width={13} height={13} />
          ) : (
            <IconMaximize width={13} height={13} />
          )}
        </button>
        <button className="tb-btn tb-close" onClick={() => window.ncm?.close()} title="关闭">
          <IconClose width={15} height={15} />
        </button>
      </div>
    </header>
  )
}
