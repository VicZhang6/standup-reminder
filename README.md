# 站立提醒

一款轻量桌面应用，按设定间隔提醒你**站起来活动**，减轻久坐带来的不适。基于 **Tauri 2**，常驻系统托盘，到点弹出全屏提醒。

![platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey)
![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?logo=tauri)
![license](https://img.shields.io/github/license/VicZhang6/standup-reminder?label=License)

## 功能概览

| 能力 | 说明 |
|------|------|
| **计时与提醒** | 默认可设间隔（如 20 分钟），到时全屏提醒，确认后进入下一轮 |
| **主面板** | 圆形倒计时、开始 / 暂停 / 继续、间隔调节；**空格键**与主按钮同效（主界面下，设置页或编辑时间时不触发） |
| **桌面悬浮窗** | 可选在角落显示迷你计时，便于扫一眼 |
| **系统托盘** | 左键打开主窗口，右键菜单控制计时与退出 |
| **外观** | 支持浅色 / 深色 / 跟随系统；深色为黑灰风格，可关悬浮窗等 |
| **多窗口** | 主控制页、全屏提醒、悬浮窗与菜单等独立 WebView，由 Tauri 统一调度 |

## 下载安装

预编译包见 **[GitHub Releases](https://github.com/VicZhang6/standup-reminder/releases)**。

| 平台 | 常见格式 |
|------|-----------|
| Windows x64 | NSIS 安装程序（`.exe`）、中文 MSI |
| macOS Apple Silicon | DMG（**aarch64**；由 CI 在 Apple Silicon runner 上构建） |

> **macOS 提示**：公开构建一般为**未公证**包，首次打开若被拦截，请在「系统设置 → 隐私与安全性」中按需允许。

## 从源码运行

### 环境

- **Node.js** 20+
- **Rust**（`rustup`，1.77+ 与 `Cargo.toml` 中 `rust-version` 一致即可）
- **Windows**：需安装带 **C++ 桌面开发** 工作负载的 Visual Studio 或 Build Tools（供 `webview2` 等链接使用）

### 开发

```bash
npm install
npm run dev
```

会并行启动 Vite 前端开发服务与 Tauri 桌面壳。若只验证前端打包：

```bash
npm run build:web
```

输出目录为 `dist-web/`（已在 `.gitignore` 中）。

### 本地打包

```bash
npm run build
```

先执行 `build:web`，再执行 `tauri build`。Windows 下安装包位于 `src-tauri/target/release/bundle/`（NSIS / MSI 等）。

**macOS ARM 安装包**：在 Windows 上无法交叉编译出可用的 macOS 产物；仓库提供 [`.github/workflows/build-macos-arm64.yml`](.github/workflows/build-macos-arm64.yml)，可在 **Actions** 里手动运行 workflow，在云端 macOS（Apple Silicon）上构建 DMG。

## 仓库结构（节选）

```text
├── control.html / control-renderer.js   # 主窗口：计时、设置、托盘逻辑
├── reminder.html / renderer.js          # 全屏提醒
├── floating.html / floating-menu.html   # 悬浮窗与托盘菜单
├── app-shared.js                        # 主题与共享状态
├── vite.config.mjs                      # 多页面前端构建
├── scripts/run-tauri.mjs                # Windows 下调用 MSVC 环境的 Tauri 封装
├── scripts/upload-release-assets.ps1    # 向 GitHub Release 上传附件（需 TOKEN）
└── src-tauri/                           # Rust 壳、Tauri 配置与图标
```

## 技术栈

| 项目 | 用途 |
|------|------|
| Tauri 2 | 桌面壳、托盘、多窗口 |
| Vite 8 | 多 HTML 入口与资源打包 |
| 原生 HTML / CSS / JS | UI 与业务逻辑 |

## 开源协议

本项目以 **[MIT License](LICENSE)** 发布。

---

**作者**：Vic Zhang · 仓库：[github.com/VicZhang6/standup-reminder](https://github.com/VicZhang6/standup-reminder)
