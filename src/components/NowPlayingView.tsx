import { usePlayerStore } from '../store/playerStore'
import LyricsPanel from './LyricsPanel'
import { IconChevronDown } from './icons'

export default function NowPlayingView() {
  const currentSong = usePlayerStore((s) => s.currentSong)
  const setPage = usePlayerStore((s) => s.setPage)

  return (
    <div className="now-playing">
      <button className="np-btn np-back" onClick={() => setPage('browse')} title="返回">
        <IconChevronDown width={18} height={18} />
        <span>返回</span>
      </button>

      <div className="np-lyrics">
        <LyricsPanel />
      </div>

      <div className="np-cover">
        {currentSong?.picUrl ? (
          <img src={currentSong.picUrl} alt="" />
        ) : (
          <div className="np-cover-ph">♪</div>
        )}
      </div>
    </div>
  )
}
