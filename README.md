# NCM Player — 网易云音乐桌面播放器

一个基于 **Electron + React + Three.js** 的网易云音乐桌面客户端，无边框窗口、深浅色主题、3D 可视化、逐字卡拉 OK 歌词。

> 数据接口来自开源项目 [Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)，本项目将其作为内嵌服务直接集成进客户端，无需额外部署服务器。

---

## ✨ 功能特性

- **无边框窗口**：自定义标题栏与界面融为一体，无左上角图标/文字，右上角最小化/最大化/关闭，整条顶栏可拖动。
- **独立播放页**：点击播放条封面或「展开」按钮进入全屏播放页（3D 舞台 + 歌词 + 返回/歌词模式切换），与浏览页分离。
- **主题系统**：跟随系统 / 浅色 / 深色 三档主题，全界面 CSS 变量驱动，可实时切换并持久化（启动时预加载，无闪烁）。
- **扫码登录**：内置网易云音乐二维码登录，登录态持久化、重启自动恢复。
- **核心播放**：搜索、排行榜、热门歌单、每日推荐、私人 FM、我的歌单、播放队列；顺序 / 列表循环 / 单曲循环 / 随机播放。
- **3D 可视化**（UnrealBloom 辉光 + Web Audio 实时频谱）：
  - 🎛️ 频谱环 · 🎇 粒子球 · 🌊 波形 · 💿 黑胶唱片 · 🌀 星系 · 🚇 隧道（共 6 种模式）。
- **歌词特效**：
  - 逐字卡拉 OK（当前句按进度逐字点亮）。
  - 沉浸式歌词（全屏大字号 + 背景毛玻璃模糊）。
  - 中文翻译对照、6 套歌词主题（经典/霓虹/火焰/极光/薄荷/玫瑰）、字号可调、点击跳转进度。
- **键盘快捷键**：空格 播放/暂停 · ←→ 快退/快进 · ↑↓ 音量。
- 播放条：进度拖动、音量、静音、封面旋转动画、歌词开关、队列入口。

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 22.12（推荐 24）
- Windows / macOS / Linux

### 安装依赖

```bash
npm install
```

> 注：Electron 二进制默认从 GitHub 下载；若网络受限，可在安装前设置镜像：
> ```bash
> # PowerShell
> $env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
> npm install
> node node_modules/electron/install.js
> ```

### 运行（开发模式，带热更新）

```bash
npm run dev
```

### 运行（生产模式）

```bash
npm start        # 构建后启动
```

### 打包为可执行程序

```bash
npm run dist     # 生成安装包 + 便携版，输出到 release/
```

- `release/NCM Player-Setup-1.2.0-x64.exe` —— NSIS 安装包（可自定义目录，创建桌面/开始菜单快捷方式）。
- `release/NCM Player-Portable-1.2.0-x64.exe` —— 免安装便携版，双击即用。

> 打包时如遇 GitHub 下载慢，可设置：
> ```bash
> $env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
> $env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
> npm run dist:win
> ```

---

## 🎮 使用说明

1. **登录**：点击左下角「扫码登录」，用网易云音乐 App 扫码（可选，不登录也能搜索/播放免费歌曲）。
2. **选歌**：右上搜索框输入关键词回车；或从「排行榜 / 推荐歌单 / 每日推荐 / 私人FM / 我的歌单」进入。
3. **播放**：单击/双击歌曲即可播放；底部控制条可切歌、调进度、调音量、切换播放模式、开关歌词。
4. **3D 效果**：舞台左上角可切换 6 种可视化模式。
5. **歌词**：点「设置」切换主题/字号/翻译/沉浸式歌词；点歌词跳转进度。
6. **主题**：左下角「主题」按钮一键切换 跟随系统/浅色/深色；或在设置中精确选择。

---

## 🧱 技术栈

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron 43（无边框窗口） |
| 前端 | React 19 + TypeScript + Vite 8 |
| 状态管理 | Zustand 5 |
| 3D | Three.js + UnrealBloomPass 辉光 + Web Audio API 频谱 |
| 音乐接口 | NeteaseCloudMusicApi v4.32（内嵌本地服务 `127.0.0.1:3939`） |

## 📁 项目结构

```
ncm-player/
├─ electron/            # 主进程（无边框窗口、内嵌 API、窗口控制 IPC）
├─ src/
│  ├─ api/              # API 客户端与类型
│  ├─ store/            # Zustand 状态管理
│  ├─ components/       # 标题栏/侧边栏/歌词/可视化/播放条/队列/登录/设置
│  ├─ utils/            # 歌词解析
│  └─ index.css         # 主题变量 + 全部样式
├─ scripts/
│  ├─ test-api.cjs      # 后端接口自动化测试
│  └─ e2e-test.mjs      # 端到端 UI 自动化测试（Playwright）
├─ test-results/        # 测试截图与报告
└─ release/             # 打包产物
```

## 🧪 测试

```bash
npm run typecheck    # TypeScript 类型检查
npm run test:api     # 后端接口测试（13 项）
npm run test:e2e     # 端到端 UI 测试（25 项，需先 npm run build）
```

详细测试报告见 [TEST-REPORT.md](./TEST-REPORT.md)。

## ⚠️ 免责声明

本项目仅供学习交流，音乐版权归网易云音乐及相关权利人所有。请勿用于商业用途。
