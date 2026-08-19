'use strict'

const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')

const API_PORT = 3939
const API_HOST = '127.0.0.1'

/** @type {import('http').Server | null} */
let apiServer = null

/**
 * Start the embedded NeteaseCloudMusicApi server in-process.
 * The renderer talks to http://127.0.0.1:3939 directly.
 */
async function startApi() {
  const { serveNcmApi } = require('NeteaseCloudMusicApi')
  const expressApp = await serveNcmApi({
    port: API_PORT,
    host: API_HOST,
    checkVersion: false,
  })
  apiServer = expressApp.server
  console.log(`[main] NCM API server listening @ http://${API_HOST}:${API_PORT}`)
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 1080,
    minHeight: 680,
    frame: false,
    backgroundColor: '#0a0a12',
    title: 'NCM Player',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  })

  win.once('ready-to-show', () => win.show())

  // Forward maximize state to the renderer for the custom title bar.
  win.on('maximize', () => win.webContents.send('win:maximized', true))
  win.on('unmaximize', () => win.webContents.send('win:maximized', false))

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    win.loadURL(devUrl)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // Forward renderer console to main stdout (useful for headless diagnostics)
  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`)
  })
  win.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error(`[main] did-fail-load: ${code} ${desc}`)
  })
  win.webContents.on('render-process-gone', (_e, details) => {
    console.error(`[main] render-process-gone: ${details.reason}`)
  })

  // Headless smoke-test: capture a screenshot then quit.
  if (process.env.NCM_SMOKE_TEST === '1') {
    const outDir = process.env.NCM_SMOKE_OUT || path.join(__dirname, '..', 'test-results')
    win.webContents.once('did-finish-load', async () => {
      await new Promise((r) => setTimeout(r, Number(process.env.NCM_SMOKE_DELAY || 4000)))
      try {
        const fs = require('fs')
        fs.mkdirSync(outDir, { recursive: true })
        const image = await win.webContents.capturePage()
        const png = image.toPNG()
        const file = path.join(outDir, `smoke-${process.platform}.png`)
        fs.writeFileSync(file, png)
        console.log(`[smoke] screenshot saved: ${file} (${png.length} bytes)`)
      } catch (e) {
        console.error('[smoke] capture failed:', e)
      }
      app.quit()
    })
  }

  // Open external links (e.g. qrurl) in the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}

// Window control IPC (frameless-safe; harmless with native frame)
ipcMain.on('win:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
ipcMain.on('win:maximize', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (!w) return
  w.isMaximized() ? w.unmaximize() : w.maximize()
})
ipcMain.on('win:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close())
ipcMain.handle('win:isMaximized', (e) => BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false)

app.whenReady().then(async () => {
  try {
    await startApi()
  } catch (err) {
    console.error('[main] Failed to start NCM API:', err)
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (apiServer) {
    try {
      apiServer.close()
    } catch (_) {
      /* noop */
    }
  }
})
