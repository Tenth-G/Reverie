import { usePlayerStore } from '../store/playerStore'
import { formatTime } from '../utils/lyrics'
import { IconClose, IconPlay } from './icons'

export default function QueuePanel() {
  const queue = usePlayerStore((s) => s.queue)
  const currentSong = usePlayerStore((s) => s.currentSong)
  const playing = usePlayerStore((s) => s.playing)
  const playQueueAt = usePlayerStore((s) => s.playQueueAt)
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)
  const clearQueue = usePlayerStore((s) => s.clearQueue)

  return (
    <div className="list-panel">
      <div className="list-header">
        <h3>播放队列</h3>
        {queue.length > 0 && (
          <button className="btn" onClick={clearQueue}>
            清空
          </button>
        )}
        <span className="count">{queue.length} 首</span>
      </div>
      <div className="song-list">
        {queue.length === 0 ? (
          <div className="empty">队列为空，去搜索或选歌吧</div>
        ) : (
          queue.map((song, i) => {
            const isCur = currentSong?.id === song.id
            return (
              <div
                key={`${song.id}-${i}`}
                className={`song-item ${isCur ? 'playing' : ''}`}
                onClick={() => playQueueAt(i)}
              >
                <span className="idx">{isCur ? <IconPlay width={13} height={13} /> : i + 1}</span>
                {song.picUrl ? (
                  <img src={song.picUrl} alt="" loading="lazy" />
                ) : (
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 8,
                      background: 'var(--bg-3)',
                      flex: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-faint)',
                    }}
                  >
                    ♪
                  </span>
                )}
                <div className="meta">
                  <div className={`t ${isCur && playing ? 'playing-text' : ''}`}>{song.name}</div>
                  <div className="a">{song.artists}</div>
                </div>
                <span className="dur">{formatTime(song.duration)}</span>
                <button
                  className="rm-btn"
                  title="移除"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromQueue(i)
                  }}
                >
                  <IconClose width={14} height={14} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
