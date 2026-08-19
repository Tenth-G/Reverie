'use strict'

/**
 * Post-build step: strip the "CompanyName" from the packaged Windows
 * executables' version info. electron-builder leaves the Electron binary's
 * original company ("GitHub, Inc.") when package.json has no author, so we
 * explicitly blank it with rcedit.
 */

const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const rcedit = path.join(root, 'node_modules', 'electron-winstaller', 'vendor', 'rcedit.exe')
const releaseDir = path.join(root, 'release')

function clearCompany(exePath) {
  try {
    execFileSync(rcedit, [exePath, '--set-version-string', 'CompanyName', ' '], {
      stdio: 'ignore',
    })
    console.log(`[clear-company] cleared: ${path.basename(exePath)}`)
  } catch (e) {
    console.error(`[clear-company] failed: ${exePath}`, e.message)
  }
}

function main() {
  if (!fs.existsSync(rcedit)) {
    console.error('[clear-company] rcedit.exe not found, skipping.')
    return
  }
  if (!fs.existsSync(releaseDir)) {
    console.error('[clear-company] release dir not found, skipping.')
    return
  }

  // 1. the app executable inside win-unpacked
  const unpackedExe = path.join(releaseDir, 'win-unpacked', 'Reverie.exe')
  if (fs.existsSync(unpackedExe)) clearCompany(unpackedExe)

  // 2. the portable and setup installers
  for (const name of fs.readdirSync(releaseDir)) {
    if (/^Reverie-(Portable|Setup)-.*\.exe$/.test(name)) {
      clearCompany(path.join(releaseDir, name))
    }
  }
}

main()
