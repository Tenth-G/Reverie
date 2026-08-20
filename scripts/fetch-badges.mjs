import { writeFileSync, mkdirSync } from 'node:fs'

const targets = [
  ['vip', 'https://s2.music.126.net/style/web2/img/ie6/icn_vip.png'],
  ['svip', 'http://s4.music.126.net/style/web2/img/top_bubble_svip_card.png'],
]

function pngDim(buf) {
  if (buf.length < 24 || buf[0] !== 0x89) return 'n/a'
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  return `${w}x${h}`
}

mkdirSync('src/assets', { recursive: true })
for (const [name, url] of targets) {
  const r = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'Mozilla/5.0' } })
  const buf = Buffer.from(await r.arrayBuffer())
  const out = `src/assets/badge-${name}.png`
  writeFileSync(out, buf)
  console.log(name, r.status, buf.length, 'bytes', pngDim(buf), '->', out)
}
