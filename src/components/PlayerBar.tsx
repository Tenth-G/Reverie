import { usePlayerStore } from '../store/playerStore'
import { formatTime } from '../utils/lyrics'
import type { PlayMode } from '../api/types'
import {
  IconHeart,
  IconLoop,
  IconMute,
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconRepeatOne,
  IconShuffle,
  IconVolume,
} from './icons'

const MODE_LABEL: Record<PlayMode, string> = {
  sequence: '顺序播放',
  loop: '列表循环',
  one: '单曲循环',
  shuffle: '随机播放',
}

function ModeIcon({ mode }: { mode: PlayMode }) {
  if (mode === 'shuffle') return <IconShuffle />
  if (mode === 'one') return <IconRepeatOne />
  return <IconLoop />
}

export default function PlayerBar() {
  const currentSong = usePlayerStore((s) => s.currentSong)
  const playing = usePlayerStore((s) => s.playing)
  const loadingUrl = usePlayerStore((s) => s.loadingUrl)
  const progress = usePlayerStore((s) => s.progress)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const playMode = usePlayerStore((s) => s.playMode)
  const likedIds = usePlayerStore((s) => s.likedIds)

  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const seek = usePlayerStore((s) => s.seek)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleMute = usePlayerStore((s) => s.toggleMute)
  const cyclePlayMode = usePlayerStore((s) => s.cyclePlayMode)
  const setPage = usePlayerStore((s) => s.setPage)
  const toggleLike = usePlayerStore((s) => s.toggleLike)

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0
  const liked = currentSong ? likedIds.includes(currentSong.id) : false

  return (
    <footer className="player-bar">
      <div
        className={`pb-cover ${playing ? 'spinning' : ''}`}
        onClick={() => setPage('nowplaying')}
        title="打开播放页"
        style={{ cursor: 'pointer' }}
      >
        {currentSong ? (
          <img src={currentSong.picUrl} alt="" />
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--bg-3)' }} />
        )}
      </div>

      <div className="pb-info">
        <div className="t">{currentSong?.name ?? '未在播放'}</div>
        <div className="a">{currentSong?.artists ?? '选择一首歌开始播放'}</div>
      </div>

      <div className="pb-controls">
        <button className="icon-btn" onClick={prev} title="上一首">
          <IconPrev />
        </button>
        <button className="icon-btn primary" onClick={togglePlay} title={playing ? '暂停' : '播放'}>
          {loadingUrl ? <span className="spin-dot" /> : playing ? <IconPause /> : <IconPlay />}
        </button>
        <button className="icon-btn" onClick={next} title="下一首">
          <IconNext />
        </button>
        <button className="icon-btn active" onClick={cyclePlayMode} title={MODE_LABEL[playMode]}>
          <ModeIcon mode={playMode} />
        </button>
      </div>

      <div className="pb-progress">
        <span className="time">{formatTime(progress)}</span>
        <input
          className="slider"
          type="range"
          min={0}
          max={duration || 0}
          value={progress}
          style={{ ['--val' as never]: `${pct}%`, flex: 1 }}
          onChange={(e) => seek(Number(e.target.value))}
        />
        <span className="time">{formatTime(duration)}</span>
      </div>

      <div className="pb-extra">
        <button
          className={`icon-btn ${liked ? 'active' : ''}`}
          onClick={toggleLike}
          title={liked ? '取消喜欢' : '喜欢'}
          style={liked ? { color: '#ec4141' } : undefined}
        >
          <IconHeart />
        </button>
        <div className="vol-wrap">
          <button className="icon-btn" onClick={toggleMute} title="静音">
            {muted || volume === 0 ? <IconMute /> : <IconVolume />}
          </button>
          <input
            className="slider"
            type="range"
            min={0}
            max={100}
            value={Math.round((muted ? 0 : volume) * 100)}
            style={{ ['--val' as never]: `${(muted ? 0 : volume) * 100}%` }}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
          />
        </div>
      </div>

      <style>{`
        .spin-dot {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </footer>
  )
}
