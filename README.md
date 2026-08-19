# 云律 YunLyu — 网易云音乐桌面播放器

一个基于 **Electron + React + Three.js** 的网易云音乐桌面客户端：无边框窗口、圆润悬浮播放栏、分页面布局、以专辑封面为核心的 3D 舞台与歌词。

> 数据接口来自开源项目 [Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)，本项目将其作为内嵌服务直接集成进客户端，无需额外部署服务器。

---

## ✨ 功能特性

- **无边框窗口**：自定义标题栏与界面融为一体，无左上角图标/文字，右上角最小化/最大化/关闭，整条顶栏可拖动。
- **顶部导航栏**：取消左侧导航，改为顶部横向导航（首页/排行榜/推荐歌单/每日推荐/私人FM/我的歌单/播放队列），右上角搜索/主题/设置/登录。
- **胶囊搜索**：右上角搜索图标点击后向左展开胶囊形态搜索框，回车即出结果，无需独立搜索页。
- **首页聚合**：每日推荐（置顶、卡片横滑）→ 推荐歌单（卡片网格）→ 排行榜（列表），纯内容浏览、无 3D 无歌词。
- **悬浮椭圆播放栏**：底部居中悬浮胶囊形态，封面点击或「展开」进入播放页。
- **播放页（封面正对屏幕）**：专辑封面以竖版卡片正对屏幕，微幅摆动/悬浮 + 辉光渲染；**歌词附着在封面上方**（居中渐隐、无滚动条），支持逐字卡拉 OK、沉浸式歌词、6 套歌词主题、字号、翻译。
- **主题系统**：跟随系统 / 浅色 / 深色 三档主题，启动预加载无闪烁。
- **扫码登录**：内置二维码登录，登录态持久化、重启自动恢复。
- **播放**：搜索、排行榜、歌单、每日推荐、私人 FM、队列；顺序 / 列表循环 / 单曲循环 / 随机播放。
- **键盘快捷键**：空格 播放/暂停 · ←→ 快退/快进 · ↑↓ 音量。
- **整体 UI 圆润**：全界面大圆角卡片、按钮、歌单封面与胶囊播放栏。

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

- `release/YunLyu-Setup-1.4.0-x64.exe` —— NSIS 安装包。
- `release/YunLyu-Portable-1.4.0-x64.exe` —— 免安装便携版，双击即用。

---

## 🎮 使用说明

1. **登录**：左下角「扫码登录」，用网易云音乐 App 扫码（可选）。
2. **首页**：启动即见「推荐歌单 / 排行榜 / 每日推荐」，点击任意板块可进入对应完整页面。
3. **播放**：单击歌曲即可播放；底部悬浮播放栏可切歌、调进度、调音量、切换播放模式。
4. **播放页**：点击播放栏封面或「展开」进入；左上角可切换 3D 模式（唱片/频谱/粒子/波形）与歌词模式。
5. **主题**：左下角「主题」按钮一键切换 跟随系统/浅色/深色。

---

## 🧱 技术栈

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron 43（无边框窗口） |
| 前端 | React 19 + TypeScript + Vite 8 |
| 状态管理 | Zustand 5 |
| 3D | Three.js + UnrealBloomPass 辉光 + Web Audio API |
| 音乐接口 | NeteaseCloudMusicApi v4.32（内嵌本地服务 `127.0.0.1:3939`） |

## 📁 项目结构

```
ncm-player/
├─ electron/            # 主进程（无边框窗口、内嵌 API、窗口控制 IPC）
├─ src/
│  ├─ api/              # API 客户端与类型
│  ├─ store/            # Zustand 状态管理
│  ├─ components/       # 标题栏/侧边栏/各功能页/播放栏/播放页/3D/歌词/登录/设置
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

本项目仅供学习交流，音乐版权归网易云音乐及相关权利人所有。请勿用于商业用途。
