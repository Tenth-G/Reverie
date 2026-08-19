import { usePlayerStore } from '../store/playerStore'
import LyricsPanel from './LyricsPanel'
import { IconChevronDown } from './icons'

export default function NowPlayingView() {
  const currentSong = usePlayerStore((s) => s.currentSong)
  const setPage = usePlayerStore((s) => s.setPage)

  return (
    <div className="now-playing">
      <button className="np-btn np-back" onClick={() => setPage('browse')} title="返回">
        <IconChevronDown width={20} height={20} />
      </button>

      {/* lyrics overlay ON the album cover */}
      <div className="np-stage">
        <div className="np-cover">
          {currentSong?.picUrl ? (
            <img src={currentSong.picUrl} alt="" />
          ) : (
            <div className="np-cover-ph">♪</div>
          )}
        </div>
        <div className="np-lyrics">
          <LyricsPanel />
        </div>
      </div>
    </div>
  )
}
