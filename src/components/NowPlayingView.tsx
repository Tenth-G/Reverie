import { usePlayerStore } from '../store/playerStore'
import Visualizer from './Visualizer'
import LyricsPanel from './LyricsPanel'
import { IconChevronDown, IconLyrics } from './icons'

export default function NowPlayingView() {
  const setPage = usePlayerStore((s) => s.setPage)
  const lyricsMode = usePlayerStore((s) => s.lyricsMode)
  const setLyricsMode = usePlayerStore((s) => s.setLyricsMode)

  return (
    <div className="now-playing">
      <Visualizer />
      <LyricsPanel />
      <div className="np-topbar">
        <button className="np-btn" onClick={() => setPage('browse')} title="返回浏览页">
          <IconChevronDown width={18} height={18} />
          <span>返回</span>
        </button>
        <button
          className="np-btn"
          onClick={() => setLyricsMode(lyricsMode === 'immersive' ? 'overlay' : 'immersive')}
          title="切换歌词模式"
        >
          <IconLyrics width={15} height={15} />
          <span>{lyricsMode === 'immersive' ? '收起歌词' : '沉浸歌词'}</span>
        </button>
      </div>
    </div>
  )
}
