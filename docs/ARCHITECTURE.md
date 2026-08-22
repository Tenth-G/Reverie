# 工程结构与命名约定

## 目录职责

- `src/api/`：第三方音乐接口的类型、请求封装和响应归一化。组件不直接拼接 API URL。
- `src/store/`：跨页面状态与业务动作。页面只通过 store 读取状态和调用动作。
- `src/components/`：可复用 UI、布局、播放器和弹窗组件。
- `src/utils/`：无副作用或可独立测试的工具函数，例如歌词、图片 URL、音频分析和性能检测。
- `src-tauri/`：桌面窗口、sidecar 生命周期、打包和更新配置；不放前端业务逻辑。
- `sidecar/`：本地 API 进程入口；`scripts/` 只负责构建和测试辅助。
- `tests/`：Node 原生测试，优先覆盖 API 归一化和纯函数边界。

## 命名规则

- React 组件使用 `PascalCase.tsx`；页面组件以 `Page` 结尾，弹窗以 `Modal` 结尾，抽屉以 `Drawer` 结尾。
- Zustand store 使用 `*Store.ts`，API 模块使用 `client.ts` 或按接口域命名。
- 工具模块使用描述性名词，例如 `image.ts`、`audioAnalyser.ts`；不要使用 `helpers.ts` 这类无法表达职责的名称。
- Rust 文件使用 `snake_case`，脚本使用动作前缀，例如 `build-*`、`test-*`。

## 提交前检查

```bash
npm run lint
npm run format:check
npm test
npm run build:web
cargo check --manifest-path src-tauri/Cargo.toml
```

构建输出 `dist/`、`build/`、`src-tauri/target/` 和本地 sidecar 二进制均为可再生文件，不应提交到版本库。
