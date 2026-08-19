# Reverie — 网易云音乐桌面播放器

一个基于 **Electron + React** 的网易云音乐桌面客户端：顶部导航、透明悬浮播放栏、歌曲封面 + 歌词的沉浸播放页。

> 数据接口来自开源项目 [Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)，本项目将其作为内嵌服务直接集成进客户端，无需额外部署服务器。

---

## ✨ 功能特性

- **无边框窗口**：自定义标题栏居中显示英文名「Reverie」，右上角最小化/最大化/关闭，整条顶栏可拖动。
- **顶部导航栏**：首页 / 排行榜 / 私人FM / 我的歌单；右上角搜索图标（展开胶囊搜索框 + 下拉结果）、主题切换、设置、头像下拉。
- **未登录体验**：未登录首页不显示任何数据，只显示登录引导；登录按钮仅「登录」二字。
- **头像下拉菜单**：登录后点击头像弹出下拉，含会员信息、切换账号、退出登录。
- **透明悬浮播放栏**：底部居中悬浮胶囊（高透毛玻璃），含红心喜欢、播放控制、进度、音量、进入播放页。
- **播放页（整页）**：整页显示「歌词在上 + 歌曲封面在下」，封面正对屏幕；歌词逐字卡拉 OK、6 套主题、翻译、无滚动条。
- **主题系统**：跟随系统 / 浅色 / 深色 三档主题，启动预加载无闪烁；音量、播放模式、歌词设置等持久化。
- **扫码登录**：内置二维码登录，登录态持久化、重启自动恢复。
- **更多网易云接口**：红心/取消红心（`/like`）、喜欢列表（`/likelist`）。
- **键盘快捷键**：空格 播放/暂停 · ←→ 快退/快进 · ↑↓ 音量。

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

### 运行（开发模式）

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

- `release/Reverie-Setup-1.0.0-x64.exe` —— NSIS 安装包。
- `release/Reverie-Portable-1.0.0-x64.exe` —— 免安装便携版，双击即用。

---

## 🎮 使用说明

1. **登录**：点击右上角「登录」，用网易云音乐 App 扫码（可选，未登录首页显示登录引导）。
2. **首页**：登录后显示「每日推荐 / 推荐歌单 / 排行榜」三大板块。
3. **播放**：搜索（右上角胶囊搜索框）或从首页/排行榜/私人FM/我的歌单选歌，单击即可播放；底部透明悬浮播放栏可切歌、调进度、调音量、切换播放模式、红心喜欢。
4. **播放页**：点击播放栏封面或「展开」进入整页播放页，上方歌词、下方封面。
5. **账号**：登录后点击右上角头像，下拉可查看会员信息、切换账号、退出登录。
6. **主题**：右上角主题按钮一键切换 跟随系统/浅色/深色。

---

## 🧱 技术栈

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron 43（无边框窗口） |
| 前端 | React 19 + TypeScript + Vite 8 |
| 状态管理 | Zustand 5 |
| 音乐接口 | NeteaseCloudMusicApi v4.32（内嵌本地服务 `127.0.0.1:3939`） |

## 📁 项目结构

```
ncm-player/
├─ electron/            # 主进程（无边框窗口、内嵌 API、窗口控制 IPC）
├─ src/
│  ├─ api/              # API 客户端与类型
│  ├─ store/            # Zustand 状态管理
│  ├─ components/       # 标题栏/顶部导航/各功能页/播放栏/播放页/歌词/登录/设置
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
npm run test:e2e     # 端到端 UI 测试（30 项，需先 npm run build）
```

详细测试报告见 [TEST-REPORT.md](./TEST-REPORT.md)。

## ⚠️ 免责声明

本播放器（Reverie）仅用于**学习交流**，**不隶属于**网易云音乐或任何平台，**不提供任何违法或侵权内容**。所有音乐版权归相关权利人所有，接口数据来自开源项目 [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)，请勿用于商业用途。
