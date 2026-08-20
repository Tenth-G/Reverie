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
    // --- size optimizations: drop files never needed at runtime ---
    // API demo/test UI pages (the embedded API is called as JSON only)
    "!node_modules/NeteaseCloudMusicApi/public/**",
    // Browser-only UMD builds & dev variants (Electron uses cjs production)
    "!node_modules/**/umd/**",
    "!node_modules/**/*.development.js",
    "!node_modules/react-dom/server/**",
    "!node_modules/react-dom/profiling/**",
    // source maps / docs / tests / fixtures inside dependencies
    "!**/*.map",
    "!node_modules/**/*.md",
    "!node_modules/**/{test,tests,__tests__,test-assets,example,examples,doc,docs,benchmark,benchmarks,fixtures}/**",
  ],
  asar: true,
  compression: "maximum",
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
