import { useEffect, useState } from 'react'
import { IconClose, IconMaximize, IconMinimize, IconRestore } from './icons'

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)

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
      <div className="titlebar-drag" />
      <div className="titlebar-controls">
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
