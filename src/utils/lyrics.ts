import type { LyricLine } from '../api/types'

const TIME_TAG = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

interface RawLine {
  time: number
  text: string
}

function parsePlain(lrc: string): RawLine[] {
  const lines: RawLine[] = []
  for (const raw of lrc.split(/\r?\n/)) {
    const times: number[] = []
    TIME_TAG.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = TIME_TAG.exec(raw))) {
      const mm = Number(m[1])
      const ss = Number(m[2])
      const frac = String(m[3] ?? '0').padEnd(3, '0').slice(0, 3)
      times.push(mm * 60000 + ss * 1000 + Number(frac))
    }
    const text = raw.replace(TIME_TAG, '').replace(/^\s+|\s+$/g, '')
    if (!times.length) continue
    for (const t of times) lines.push({ time: t, text })
  }
  lines.sort((a, b) => a.time - b.time)
  return lines
}

/**
 * Parse LRC + optional translation (TLyric) into a merged lyric line list.
 * Translation lines are matched to original lines by timestamp.
 */
export function parseLyrics(lrc: string, tlyric = ''): LyricLine[] {
  const originals = parsePlain(lrc)
  const translations = parsePlain(tlyric)

  // Build a lookup for translations by exact timestamp (first wins).
  const transByTime = new Map<number, string>()
  for (const t of translations) {
    if (!transByTime.has(t.time)) transByTime.set(t.time, t.text)
  }

  // Deduplicate original timestamps (keep the first text per timestamp).
  const seen = new Map<number, LyricLine>()
  for (const o of originals) {
    if (seen.has(o.time)) continue
    const line: LyricLine = { time: o.time, text: o.text }
    const tr = transByTime.get(o.time)
    if (tr && tr !== o.text) line.translation = tr
    seen.set(o.time, line)
  }

  const result = Array.from(seen.values()).sort((a, b) => a.time - b.time)

  // If no lyrics at all, synthesize a single placeholder.
  if (!result.length) {
    return [{ time: 0, text: '纯音乐，请欣赏' }]
  }

  return result
}

/** Format milliseconds as m:ss or h:mm:ss. */
export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
