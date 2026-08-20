# 🎵 Reverie — 网易云音乐桌面播放器

> 一款基于 **Electron + React** 的网易云音乐桌面客户端：无边框窗口、透明悬浮播放栏、封面歌词播放页、扫码登录、自动更新。

- 音乐数据接口来自开源项目 [Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)，以**内嵌本地服务**方式集成进客户端，无需额外部署服务器。
- 所有用户数据**仅保存在本机**（localStorage），无任何云端存储与统计追踪。

---

## ✨ 功能特性

### 界面

- **无边框窗口**：自定义标题栏（居中应用名 + 最小化 / 最大化 / 关闭），整条顶栏可拖动。
- **三档主题**：跟随系统 / 浅色 / 深色，启动前预加载、无闪烁；主题选择持久化。
- **顶部导航**：首页 / 排行榜 / 漫游 / 我的歌单；右上角搜索、主题切换、我的喜欢、最近播放、头像菜单。

### 播放

- **透明悬浮播放栏**：底部居中毛玻璃胶囊，红心喜欢、播放控制、进度拖拽、音量、播放模式（顺序 / 单曲 / 随机）。
- **播放页**：专辑封面居中，歌词以纯文字直接附着在封面之上；逐字卡拉 OK、6 套歌词主题、译文开关、字号调节，点击歌词行可跳转。
- **键盘快捷键**：`Space` 播放 / 暂停 · `←/→` 快退 / 快进 · `↑/↓` 音量。

### 数据（本地化）

- 界面设置、最近播放（50 条）、播放队列与当前歌曲、登录 Cookie 全部保存在本机 `localStorage`。
- 重启自动恢复上次会话（队列与歌曲，**不自动播放**）。

### 账号

- **扫码登录**：内置二维码（需网易云音乐 App 扫码），登录态持久化、重启自动恢复。
- **会员信息**：头像下拉展示会员类型 / 等级 / 到期时间与官方动态徽章。

### 更新

- **自动检测更新**：启动后静默检查 GitHub Releases，有新版本自动弹窗提示（含更新日志与下载入口）。
- **手动检查**：设置 → 关于 → 检查更新。

### 关于

- 设置内集成「关于」：版本信息、**检查更新**、**隐私说明**、**免责声明**。

---

## 🧱 技术栈

| 层       | 技术                                                        |
| -------- | ----------------------------------------------------------- |
| 桌面框架 | Electron 43（无边框窗口）                                   |
| 前端     | React 19 + TypeScript + Vite 8                              |
| 状态管理 | Zustand 5                                                   |
| 音乐接口 | NeteaseCloudMusicApi v4.32（内嵌本地服务 `127.0.0.1:3939`） |
| 代码规范 | Prettier                                                    |

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 22.12（推荐 24）
- Windows / macOS / Linux

### 安装依赖

```bash
npm install
```

> Electron 二进制默认从 GitHub 下载，网络受限时可使用镜像：
>
> ```powershell
> $env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
> npm install
> node node_modules/electron/install.js
> ```

### 开发模式

```bash
npm run dev   # Vite 热更新 + Electron 自动启动
```

### 生产模式

```bash
npm start     # 构建后启动
```

### 打包为可执行程序

```bash
npm run dist:win   # 生成安装包 + 便携版，输出到 release/
```

> 打包时下载 Electron / NSIS 资源缓慢，或签名时间戳服务器不可达时：
>
> ```powershell
> $env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
> $env:ELECTRON_BUILDER_BINARIES_MIRROR = "https://npmmirror.com/mirrors/electron-builder-binaries/"
> $env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
> npm run dist:win
> ```

产物：

- `release/Reverie-Setup-<version>-x64.exe` —— NSIS 安装包
- `release/Reverie-Portable-<version>-x64.exe` —— 免安装便携版，双击即用

---

## 🎮 使用说明

1. **登录**：点击右上角「登录」，使用网易云音乐 App 扫码。未登录时首页 / 排行榜不返回数据，搜索显示登录引导。
2. **首页**：登录后展示「每日推荐 / 推荐歌单 / 排行榜 · 飙升榜」三大板块，并伴有随机歌词问候。
3. **选歌播放**：通过搜索、首页卡片、排行榜、漫游、我的歌单选歌，单击即播。
4. **播放页**：点击播放栏封面进入；歌词附着在封面之上，点击任意歌词行跳转到对应时间。
5. **设置**：右上角设置按钮 → 主题 / 播放模式 / 歌词主题与字号 / 译文开关 / 最近播放 / 账号 / 关于（更新、隐私、免责声明）。

---

## 🔄 更新机制说明

- 应用启动约 6 秒后请求 `https://api.github.com/repos/Tenth-G/Reverie/releases/latest`，将 Release 的 `tag_name` 与当前版本号比较，**存在更新时弹窗提示**。
- **发布新版本**：在 GitHub 仓库创建 Release，标签按 `v<版本号>` 命名（如 `v1.1.0`），并在正文中填写更新日志；应用即会自动检测到并提示下载。
- 检查失败（网络异常 / 接口限流）时自动静默，不影响使用；手动检查会给出对应提示。
- 测试 / CI 可通过环境变量 `REVERIE_SKIP_UPDATE=1` 或 localStorage `reverie_skip_update=1` 跳过检查。

---

## 🔒 数据与隐私

| 数据                              | 存储位置       | 说明                                                      |
| --------------------------------- | -------------- | --------------------------------------------------------- |
| 主题 / 音量 / 播放模式 / 歌词设置 | localStorage   | `reverie_*` 键，随设置实时写入                            |
| 最近播放（50 条）                 | localStorage   | `reverie_recent`                                          |
| 播放队列 / 当前歌曲               | localStorage   | `reverie_session`，重启恢复但不自动播放                   |
| 登录 Cookie                       | localStorage   | `ncm_player_cookie`，仅随网易云接口请求发送，用于身份认证 |
| 首页城市问候                      | 第三方 IP 服务 | myip.ipip.net / ipinfo.io，仅用于展示，不存储不上传       |

- 本应用**不收集任何统计数据、不做任何形式的追踪**，所有数据仅保存在本机。

---

## 📁 项目结构

```
ncm-player/
├─ electron/                  # 主进程：无边框窗口、内嵌 NCM API、窗口控制 IPC
│  ├─ main.cjs
│  └─ preload.cjs
├─ src/
│  ├─ api/                    # API 客户端与类型定义
│  ├─ components/             # 标题栏 / 导航 / 各功能页 / 播放栏 / 播放页 / 歌词 / 登录 / 设置 / 更新弹窗
│  ├─ store/                  # Zustand 状态管理（含会话持久化、更新检查）
│  ├─ utils/                  # 歌词解析、更新检查
│  ├─ global.d.ts             # 全局类型（窗口桥接、版本常量）
│  └─ index.css               # 主题变量 + 全部样式
├─ scripts/
│  ├─ test-api.cjs            # 后端接口自动化测试
│  └─ e2e-test.mjs            # 端到端 UI 自动化测试（Playwright）
├─ electron-builder.config.cjs
├─ vite.config.ts
└─ package.json
```

---

## 🧪 测试

```bash
npm run typecheck   # TypeScript 类型检查
npm run format      # Prettier 代码格式化
npm run test:api    # 后端接口测试
npm run test:e2e    # 端到端 UI 测试（需先 npm run build）
```

---

## ⚠️ 免责声明

- Reverie 仅供**个人学习与交流**使用，请勿用于商业用途。
- 音乐数据来源于开源项目 [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)，歌曲版权归各版权方所有。
- 本应用与网易云音乐及其关联公司**无任何隶属或合作关系**，不提供任何付费内容的破解或绕过。
- 若本应用侵犯了您的合法权益，请联系移除相关数据；使用本应用产生的任何后果由使用者自行承担。

---

## 📄 License

[MIT](./LICENSE) © 2026 Tenth-G
