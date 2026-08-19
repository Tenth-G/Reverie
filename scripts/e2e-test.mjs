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
  await win.waitForTimeout(2500)

  /* 1. shell + top nav (no sidebar) */
  record('窗口标题', (await win.title()).includes('NCM Player'), await win.title())
  record('自定义标题栏渲染', (await win.locator('.titlebar').count()) === 1)
  record('窗口控制按钮 (3个)', (await win.locator('.tb-btn').count()) === 3)
  record('顶部导航栏渲染', (await win.locator('.topnav').count()) === 1)
  record('左侧导航已移除', (await win.locator('.sidebar').count()) === 0)
  record('悬浮播放栏渲染', (await win.locator('.player-bar').count()) === 1)

  /* 2. home page */
  const homeSections = await win.locator('.home-section').count()
  record('首页分区渲染', homeSections >= 2, `${homeSections} 个分区`)
  const firstSectionTitle = await win.locator('.home-section .section-title h2').first().textContent()
  record('首页-每日推荐置顶', (firstSectionTitle || '').includes('每日推荐'), firstSectionTitle || '')
  const recCards = await win.locator('.song-card').count()
  record('首页-每日推荐卡片', recCards > 0, `${recCards} 张`)
  const homeCards = await win.locator('.playlist-card').count()
  record('首页-推荐歌单卡片', homeCards > 0, `${homeCards} 张`)
  record('首页不显示 3D 画布', (await win.locator('.visualizer-stage canvas').count()) === 0)
  record('首页不显示歌词', (await win.locator('.lyric-line').count()) === 0)
  await win.screenshot({ path: `${OUT_DIR}/e2e-01-home.png` })

  /* 3. theme */
  await win.locator('button[title="设置"]').click()
  await win.waitForSelector('.modal', { timeout: 5000 })
  await win.locator('.opt-btn').filter({ hasText: '浅色' }).click()
  await win.waitForTimeout(300)
  record('浅色主题生效', (await win.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light')
  await win.locator('.opt-btn').filter({ hasText: '深色' }).click()
  await win.waitForTimeout(300)
  record('深色主题生效', (await win.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark')
  await win.locator('.opt-btn').filter({ hasText: '跟随系统' }).click()
  await win.waitForTimeout(200)
  await win.locator('.modal-backdrop').click({ position: { x: 8, y: 8 } })
  await win.waitForTimeout(300)

  /* 4. search via top-right capsule */
  await win.locator('button[title="搜索"]').click()
  await win.waitForTimeout(300)
  record('搜索胶囊展开', (await win.locator('.search-capsule input').count()) === 1)
  await win.fill('.search-capsule input', '周杰伦')
  await win.press('.search-capsule input', 'Enter')
  await win.waitForSelector('.song-item', { timeout: 20000 })
  const songCount = await win.locator('.song-item').count()
  record('搜索结果展示', songCount > 0, `${songCount} 首`)
  await win.screenshot({ path: `${OUT_DIR}/e2e-02-search.png` })
  // close search
  await win.locator('.search-close').click()
  await win.waitForTimeout(300)
  record('关闭搜索返回首页', (await win.locator('.search-capsule input').count()) === 0)

  /* 5. chart + playback */
  await win.locator('.topnav-item').filter({ hasText: '排行榜' }).click()
  await win.waitForSelector('.song-item', { timeout: 20000 })
  const freeSong = await findFreeSong()
  record('API 找到可免费播放歌曲', !!freeSong, freeSong ? `${freeSong.name} (id=${freeSong.id})` : '无')
  if (freeSong) {
    await win.locator('.song-item').nth(freeSong.index).click()
    await win.waitForTimeout(3500)
    const src = await win.evaluate(() => document.querySelector('audio')?.getAttribute('src') || '')
    const paused = await win.evaluate(() => document.querySelector('audio')?.paused)
    record('audio.src 已设置', src.length > 0, src.slice(0, 60))
    record('音频正在播放', paused === false)
  }

  /* 6. now playing (cover faces screen + lyrics above) */
  await win.locator('.pb-extra .icon-btn').first().click()
  await win.waitForTimeout(900)
  record('播放页打开', (await win.locator('.now-playing').count()) === 1)
  record('播放页-3D 画布渲染', (await win.locator('.now-playing canvas').count()) === 1)
  const npLyric = await win.locator('.now-playing .lyric-line').count()
  record('播放页-歌词附着于封面', npLyric > 0, `${npLyric} 行`)
  const karaoke = await win.locator('.karaoke').count()
  record('逐字卡拉OK', karaoke > 0)
  const lyricsScrollbar = await win.evaluate(() => {
    const el = document.querySelector('.lyrics-scroll')
    return el ? getComputedStyle(el).overflowY : ''
  })
  record('歌词滚动容器存在', lyricsScrollbar === 'auto', `overflowY=${lyricsScrollbar}`)
  await win.screenshot({ path: `${OUT_DIR}/e2e-03-nowplaying.png` })
  await win.locator('.np-topbar .np-btn').first().click()
  await win.waitForTimeout(400)
  record('播放页返回', (await win.locator('.now-playing').count()) === 0)

  /* 7. visualizer modes (4, cover-centric) */
  await win.locator('.pb-extra .icon-btn').first().click()
  await win.waitForTimeout(600)
  const modeChips = await win.locator('.mode-chip').count()
  record('可视化模式按钮 (4个)', modeChips === 4, `${modeChips} 个`)
  for (const m of ['粒子', '波形', '封面']) {
    await win.locator('.mode-chip').filter({ hasText: m }).click()
    await win.waitForTimeout(400)
    record(`切换「${m}」画布仍在`, (await win.locator('.now-playing canvas').count()) === 1)
  }
  await win.locator('.np-topbar .np-btn').first().click()
  await win.waitForTimeout(300)

  /* 8. queue */
  await win.locator('.topnav-item').filter({ hasText: '播放队列' }).click()
  await win.waitForTimeout(400)
  record('播放队列页', (await win.locator('.page-heading h1').filter({ hasText: '播放队列' }).count()) === 1)

  /* 9. immersive lyrics */
  await win.locator('.pb-extra .icon-btn').first().click()
  await win.waitForTimeout(600)
  await win.locator('.np-topbar .np-btn').filter({ hasText: '沉浸歌词' }).click()
  await win.waitForTimeout(400)
  record('沉浸式歌词', (await win.locator('.lyrics-immersive').count()) === 1)
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
