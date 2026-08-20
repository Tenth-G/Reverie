"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rcedit = path.join(
  __dirname,
  "node_modules",
  "electron-winstaller",
  "vendor",
  "rcedit.exe",
);

// App icon: put your icon at build/icon.ico (Windows, preferred) or
// build/icon.png (≥256×256, auto-converted to ICO at build time). Picked up
// automatically here; falls back to the Electron default while absent, so a
// build never breaks just because the icon file has not been added yet.
const winIcon =
  (fs.existsSync(path.join(__dirname, "build", "icon.ico")) &&
    "build/icon.ico") ||
  (fs.existsSync(path.join(__dirname, "build", "icon.png")) &&
    "build/icon.png") ||
  undefined;

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: "com.reverie.player",
  productName: "Reverie",
  directories: {
    output: "release",
  },
  files: [
    "dist/index.html",
    "dist/assets/**/*",
    "electron/**/*",
    "package.json",
  ],
  asar: true,
  publish: {
    provider: "github",
    owner: "Tenth-G",
    repo: "Reverie",
  },
  win: {
    target: ["nsis", "portable"],
    icon: winIcon,
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Reverie",
    artifactName: "${productName}-Setup-${version}-${arch}.${ext}",
  },
  portable: {
    artifactName: "${productName}-Portable-${version}-${arch}.${ext}",
  },
  // Clear the CompanyName of the packaged app exe. This runs BEFORE the
  // installers are built, so the installers bundle the fixed exe and their
  // own NSIS integrity checks are never broken by post-build edits.
  afterPack: async (context) => {
    const exe = path.join(
      context.appOutDir,
      `${context.packager.appInfo.productName}.exe`,
    );
    try {
      execFileSync(rcedit, [exe, "--set-version-string", "CompanyName", " "], {
        stdio: "ignore",
      });
      console.log("[afterPack] cleared CompanyName:", exe);
    } catch (e) {
      console.error("[afterPack] rcedit failed:", e.message);
    }
  },
};
