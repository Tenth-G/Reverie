import { useEffect, useRef } from 'react'
import type { LyricLine } from '../api/types'
import { usePlayerStore } from '../store/playerStore'
import { IconClose } from './icons'

export default function LyricsPanel() {
  const lyricLines = usePlayerStore((s) => s.lyricLines)
  const progress = usePlayerStore((s) => s.progress)
  const showTranslation = usePlayerStore((s) => s.showTranslation)
  const lyricTheme = usePlayerStore((s) => s.lyricTheme)
  const lyricFontSize = usePlayerStore((s) => s.lyricFontSize)
  const lyricsMode = usePlayerStore((s) => s.lyricsMode)
  const showLyrics = usePlayerStore((s) => s.showLyrics)
  const seek = usePlayerStore((s) => s.seek)
  const setLyricsMode = usePlayerStore((s) => s.setLyricsMode)

  const scrollRef = useRef<HTMLDivElement>(null)
  const active = findActiveIndex(lyricLines, progress)
  const prevActive = useRef(-1)

  useEffect(() => {
    if (active === prevActive.current) return
    prevActive.current = active
    const el = scrollRef.current
    if (!el) return
    const lineEl = el.querySelector<HTMLElement>(`[data-line="${active}"]`)
    if (lineEl) {
      const target = lineEl.offsetTop - el.clientHeight / 2 + lineEl.clientHeight / 2
      el.scrollTo({ top: target, behavior: 'smooth' })
    }
  }, [active])

  if (!showLyrics) return null

  if (!lyricLines.length) {
    const empty = <div className="empty" style={{ padding: 0 }}>暂无歌词</div>
    return lyricsMode === 'immersive' ? (
      <div className="lyrics-immersive">{empty}</div>
    ) : (
      <div className="lyrics-overlay">{empty}</div>
    )
  }

  const sungFrac = computeSungFraction(lyricLines, active, progress)

  const content = (
    <div className="lyrics-scroll" ref={scrollRef}>
      {lyricLines.map((line, i) => {
        const isCur = i === active
        return (
          <div
            key={i}
            data-line={i}
            className={`lyric-line ${isCur ? 'current' : 'dim'}`}
            style={{ fontSize: lyricFontSize }}
            onClick={() => seek(line.time)}
          >
            <div className="l">
              {isCur && line.text ? renderKaraoke(line.text, sungFrac) : line.text || '…'}
            </div>
            {showTranslation && line.translation && (
              <div className="tr">{line.translation}</div>
            )}
          </div>
        )
      })}
    </div>
  )

  return lyricsMode === 'immersive' ? (
    <div className={`lyrics-immersive theme-${lyricTheme}`}>
      <button
        className="icon-btn immersive-exit"
        onClick={() => setLyricsMode('overlay')}
        title="退出沉浸式歌词"
      >
        <IconClose />
      </button>
      {content}
    </div>
  ) : (
    <div className={`lyrics-overlay theme-${lyricTheme}`}>{content}</div>
  )
}

function renderKaraoke(text: string, frac: number) {
  const chars = Array.from(text)
  const total = chars.length || 1
  const sungCount = Math.round(frac * total)
  return (
    <span className="karaoke">
      {chars.map((ch, i) => (
        <span key={i} className={i < sungCount ? 'sung' : ''}>
          {ch}
        </span>
      ))}
    </span>
  )
}

function computeSungFraction(lines: LyricLine[], active: number, progress: number): number {
  if (active < 0 || active >= lines.length) return 0
  const line = lines[active]
  const next = lines[active + 1]
  const end = next ? next.time : line.time + 4000
  const dur = Math.max(end - line.time, 800)
  return Math.min(1, Math.max(0, (progress - line.time) / dur))
}

function findActiveIndex(lines: Array<{ time: number }>, progress: number): number {
  if (!lines.length) return -1
  let idx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= progress) idx = i
    else break
  }
  return idx
}
