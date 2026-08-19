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

  /* 1. shell + title bar + top nav */
  record('窗口标题含 Reverie', (await win.title()).includes('Reverie'), await win.title())
  record('自定义标题栏渲染', (await win.locator('.titlebar').count()) === 1)
  record('标题栏居中显示 Reverie', (await win.locator('.titlebar-name').textContent()) === 'Reverie')
  record('窗口控制按钮 (3个)', (await win.locator('.tb-btn').count()) === 3)
  record('顶部导航栏渲染', (await win.locator('.topnav').count()) === 1)
  record('左侧导航已移除', (await win.locator('.sidebar').count()) === 0)
  record('悬浮播放栏渲染', (await win.locator('.player-bar').count()) === 1)

  /* 2. not-logged-in home */
  record('未登录首页不显示数据', (await win.locator('.login-empty').count()) === 1)
  record('未登录首页无分区', (await win.locator('.home-section').count()) === 0)
  const loginText = await win.locator('.topnav-login').textContent()
  const loginSvg = await win.locator('.topnav-login svg').count()
  record('登录按钮仅显示"登录"二字', (loginText || '').trim() === '登录' && loginSvg === 0, `text="${loginText}" icon=${loginSvg}`)
  await win.screenshot({ path: `${OUT_DIR}/e2e-01-home-notlogged.png` })

  /* 2b. not-logged-in chart should show no data */
  await win.locator('.topnav-item').filter({ hasText: '排行榜' }).click()
  await win.waitForTimeout(500)
  record('未登录排行榜无数据', (await win.locator('.login-empty').count()) === 1 && (await win.locator('.song-item').count()) === 0)
  await win.locator('.topnav-item').filter({ hasText: '首页' }).click()
  await win.waitForTimeout(300)

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

  /* 4. search dropdown (not a page) */
  await win.locator('button[title="搜索"]').click()
  await win.waitForTimeout(300)
  record('搜索胶囊展开', (await win.locator('.search-capsule input').count()) === 1)
  await win.fill('.search-capsule input', '周杰伦')
  await win.press('.search-capsule input', 'Enter')
  await win.waitForSelector('.search-dropdown-item', { timeout: 20000 })
  const ddCount = await win.locator('.search-dropdown-item').count()
  record('搜索下拉结果', ddCount > 0, `${ddCount} 条`)
  const pageStillHome = await win.locator('.page-heading h1').count() === 0
  record('搜索不跳转页面（无独立搜索页）', pageStillHome)
  await win.screenshot({ path: `${OUT_DIR}/e2e-02-search-dropdown.png` })
  await win.locator('.search-close').click()
  await win.waitForTimeout(300)

  /* 5. playback via search dropdown (free song plays without login) */
  const freeSong = await findFreeSong()
  record('API 找到可免费播放歌曲', !!freeSong, freeSong ? `${freeSong.name} (id=${freeSong.id})` : '无')
  if (freeSong) {
    await win.locator('button[title="搜索"]').click()
    await win.waitForTimeout(300)
    await win.fill('.search-capsule input', freeSong.name)
    await win.press('.search-capsule input', 'Enter')
    await win.waitForSelector('.search-dropdown-item', { timeout: 20000 })
    await win.locator('.search-dropdown-item').first().click()
    await win.waitForTimeout(3500)
    const src = await win.evaluate(() => document.querySelector('audio')?.getAttribute('src') || '')
    const paused = await win.evaluate(() => document.querySelector('audio')?.paused)
    record('audio.src 已设置', src.length > 0, src.slice(0, 60))
    record('音频正在播放', paused === false)
  }

  /* 6. now playing (full page, 2D cover + lyrics, no 3D) */
  await win.locator('button[title="打开播放页"]').click()
  await win.waitForTimeout(700)
  record('播放页打开（整页）', (await win.locator('.now-playing').count()) === 1)
  record('播放页隐藏顶部导航', (await win.locator('.topnav').count()) === 0)
  record('播放页封面图片显示', (await win.locator('.np-cover img').count()) === 1)
  const npLyric = await win.locator('.now-playing .lyric-line').count()
  record('播放页歌词在封面上方', npLyric > 0, `${npLyric} 行`)
  record('无 3D 画布', (await win.locator('canvas').count()) === 0)
  await win.screenshot({ path: `${OUT_DIR}/e2e-03-nowplaying.png` })
  await win.locator('.np-back').click()
  await win.waitForTimeout(400)
  record('播放页返回', (await win.locator('.now-playing').count()) === 0 && (await win.locator('.topnav').count()) === 1)

  /* 7. user menu (not logged in -> no avatar, only 登录) */
  record('未登录无头像下拉', (await win.locator('.user-menu').count()) === 0)

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
