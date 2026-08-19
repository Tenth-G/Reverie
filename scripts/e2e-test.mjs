import { _electron as electron } from 'playwright-core'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const API_BASE = 'http://127.0.0.1:3939'
const OUT_DIR = 'test-results'

const results = []
function record(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}${detail ? '  ->  ' + detail : ''}`)
}

async function findFreeSong(limit = 40) {
  const res = await fetch(`${API_BASE}/top/song?type=0&timestamp=${Date.now()}`)
  const json = await res.json()
  const songs = (json.data || []).slice(0, limit)
  for (let i = 0; i < songs.length; i++) {
    const u = await fetch(
      `${API_BASE}/song/url/v1?id=${songs[i].id}&level=standard&timestamp=${Date.now()}`,
    )
    const uj = await u.json()
    if (uj.data?.[0]?.url) return { id: songs[i].id, name: songs[i].name, index: i }
  }
  return null
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const electronPath = require('electron')
  const app = await electron.launch({ args: ['.'], executablePath: electronPath })
  const win = await app.firstWindow()

  const rendererErrors = []
  win.on('console', (msg) => {
    if (msg.type() === 'error') rendererErrors.push(msg.text())
  })

  await win.waitForLoadState('domcontentloaded')
  await win.waitForTimeout(2000)

  /* 1. shell + frameless title bar */
  record('窗口标题', (await win.title()).includes('NCM Player'), await win.title())
  record('自定义标题栏渲染', (await win.locator('.titlebar').count()) === 1)
  record('窗口控制按钮 (3个)', (await win.locator('.tb-btn').count()) === 3)
  record('侧边栏渲染', (await win.locator('.sidebar').count()) === 1)
  record('播放条渲染', (await win.locator('.player-bar').count()) === 1)
  record('3D 画布渲染 (含辉光)', (await win.locator('.visualizer-stage canvas').count()) === 1)
  record('搜索框渲染', (await win.locator('.search-box input').count()) === 1)
  await win.screenshot({ path: `${OUT_DIR}/e2e-01-home.png` })

  /* 2. theme system */
  const themeBefore = await win.evaluate(() => document.documentElement.getAttribute('data-theme'))
  await win.locator('.nav-item').filter({ hasText: '设置' }).click()
  await win.waitForSelector('.modal', { timeout: 5000 })
  await win.locator('.opt-btn').filter({ hasText: '浅色' }).click()
  await win.waitForTimeout(300)
  const themeLight = await win.evaluate(() => document.documentElement.getAttribute('data-theme'))
  record('浅色主题生效', themeLight === 'light', `data-theme=${themeLight}`)
  await win.screenshot({ path: `${OUT_DIR}/e2e-02-light.png` })
  await win.locator('.opt-btn').filter({ hasText: '深色' }).click()
  await win.waitForTimeout(300)
  const themeDark = await win.evaluate(() => document.documentElement.getAttribute('data-theme'))
  record('深色主题生效', themeDark === 'dark', `data-theme=${themeDark}`)
  await win.locator('.opt-btn').filter({ hasText: '跟随系统' }).click()
  await win.waitForTimeout(300)
  record('跟随系统主题', ['light', 'dark'].includes(await win.evaluate(() => document.documentElement.getAttribute('data-theme'))))

  /* 3. search */
  await win.locator('.modal-backdrop').click({ position: { x: 8, y: 8 } })
  await win.waitForTimeout(300)
  await win.fill('.search-box input', '周杰伦')
  await win.press('.search-box input', 'Enter')
  await win.waitForSelector('.song-item', { timeout: 20000 })
  const songCount = await win.locator('.song-item').count()
  record('搜索返回结果', songCount > 0, `${songCount} 首`)
  await win.screenshot({ path: `${OUT_DIR}/e2e-03-search.png` })

  /* 4. playback + lyrics */
  const freeSong = await findFreeSong()
  record('API 找到可免费播放歌曲', !!freeSong, freeSong ? `${freeSong.name} (id=${freeSong.id})` : '无')
  if (freeSong) {
    await win.locator('.nav-item').filter({ hasText: '排行榜' }).click()
    await win.waitForSelector('.song-item', { timeout: 20000 })
    await win.waitForTimeout(600)
    await win.locator('.song-item').nth(freeSong.index).click()
    await win.waitForTimeout(3500)
    const src = await win.evaluate(() => document.querySelector('audio')?.getAttribute('src') || '')
    const paused = await win.evaluate(() => document.querySelector('audio')?.paused)
    record('audio.src 已设置', src.length > 0, src.slice(0, 60))
    record('音频正在播放', paused === false)
    const lyricCount = await win.locator('.lyric-line').count()
    record('歌词渲染', lyricCount > 0, `${lyricCount} 行`)
    const karaoke = await win.locator('.karaoke').count()
    record('逐字卡拉OK生效', karaoke > 0, `${karaoke} 处`)
    await win.screenshot({ path: `${OUT_DIR}/e2e-04-playing.png` })
  }

  /* 4b. now playing page */
  await win.locator('.pb-extra .icon-btn').first().click() // expand to now playing
  await win.waitForTimeout(800)
  record('播放页打开', (await win.locator('.now-playing').count()) === 1)
  record('播放页-返回按钮', (await win.locator('.np-topbar .np-btn').first().count()) === 1)
  const npLyric = await win.locator('.now-playing .lyric-line').count()
  record('播放页-歌词可见', npLyric > 0, `${npLyric} 行`)
  await win.screenshot({ path: `${OUT_DIR}/e2e-04b-nowplaying.png` })
  await win.locator('.np-topbar .np-btn').first().click() // back to browse
  await win.waitForTimeout(400)
  record('播放页返回浏览页', (await win.locator('.now-playing').count()) === 0 && (await win.locator('.app-body').count()) === 1)

  /* 5. QR login */
  await win.locator('.nav-item').filter({ hasText: '扫码登录' }).count().then(async (n) => {
    if (n === 0) {
      record('已登录状态（跳过二维码）', true, '已存在登录态')
      return
    }
    await win.locator('.nav-item').filter({ hasText: '扫码登录' }).click()
    await win.waitForSelector('.qr-box img', { timeout: 20000 })
    const qrSrc = await win.locator('.qr-box img').getAttribute('src')
    record('登录二维码生成', (qrSrc || '').startsWith('data:image'), (qrSrc || '').slice(0, 40))
    await win.screenshot({ path: `${OUT_DIR}/e2e-05-login.png` })
    await win.locator('.modal-backdrop').click({ position: { x: 8, y: 8 } })
  })

  /* 6. visualizer modes */
  const modeChips = await win.locator('.mode-chip').count()
  record('可视化模式按钮', modeChips === 6, `${modeChips} 个`)
  for (const m of ['粒子', '星系', '隧道']) {
    await win.locator('.mode-chip').filter({ hasText: m }).click()
    await win.waitForTimeout(500)
    const c = await win.locator('.visualizer-stage canvas').count()
    record(`切换「${m}」模式画布仍在`, c === 1)
  }
  await win.screenshot({ path: `${OUT_DIR}/e2e-06-visualizer.png` })

  /* 7. queue view */
  await win.locator('.nav-item').filter({ hasText: '播放队列' }).click()
  await win.waitForTimeout(400)
  record('播放队列面板', (await win.locator('.list-panel h3').filter({ hasText: '播放队列' }).count()) === 1)

  /* 8. immersive lyrics */
  await win.locator('.nav-item').filter({ hasText: '设置' }).click()
  await win.waitForSelector('.modal', { timeout: 5000 })
  await win.locator('.opt-btn').filter({ hasText: '沉浸式' }).click()
  await win.locator('.modal-backdrop').click({ position: { x: 8, y: 8 } })
  await win.waitForTimeout(400)
  record('沉浸式歌词', (await win.locator('.lyrics-immersive').count()) === 1)
  await win.screenshot({ path: `${OUT_DIR}/e2e-07-immersive.png` })
  await win.locator('.immersive-exit').click()
  await win.waitForTimeout(300)
  record('退出沉浸式歌词', (await win.locator('.lyrics-immersive').count()) === 0)

  record('无渲染进程错误', rendererErrors.length === 0, rendererErrors.slice(0, 3).join(' || ') || 'clean')

  const passed = results.filter((r) => r.pass).length
  const failed = results.filter((r) => !r.pass)
  console.log(`\n===== E2E 测试结果: ${passed}/${results.length} 通过 =====`)
  if (failed.length) {
    console.log('未通过项:')
    failed.forEach((f) => console.log('  -', f.name))
  }

  writeFileSync(
    `${OUT_DIR}/e2e-report.json`,
    JSON.stringify(
      { timestamp: new Date().toISOString(), total: results.length, passed, failed: failed.map((f) => f.name), details: results, rendererErrors },
      null,
      2,
    ),
  )

  await app.close()
  process.exit(failed.length ? 1 : 0)
}

main().catch(async (e) => {
  console.error('E2E 测试异常:', e)
  process.exit(2)
})
