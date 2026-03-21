# 站立提醒 (Standup Reminder)

一款轻量的桌面应用，每隔一段时间提醒你站起来活动，远离久坐危害。

现在基于 Tauri 2 构建，常驻系统托盘，到时间后弹出全屏提醒。

![macOS](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)
![Windows](https://img.shields.io/badge/platform-Windows-blue?logo=windows)
![Tauri](https://img.shields.io/badge/tauri-2.x-24c8db?logo=tauri)
![License](https://img.shields.io/badge/license-MIT-green)

## 功能特性

- 定时提醒：默认每 20 分钟弹出全屏提醒，提示你站起来活动
- 自定义间隔：通过主界面或托盘菜单调整提醒间隔
- 单窗口设置页：设置面板已经合并进主窗口，通过页面切换进入
- 系统托盘常驻：左键打开主面板，右键控制计时和退出
- 优雅弹窗：到点后显示全屏提醒卡片，一键确认后自动开始下一轮
- 轻量架构：桌面壳切换到 Tauri，显著减少 Electron runtime 负担

## 从源码运行

### 环境要求

- Node.js 20+
- Rust 1.77+
- Windows 下需要安装带 C++ 工具链的 Visual Studio Build Tools

### 开发模式

```bash
npm install
npm run dev
```

`npm run dev` 会同时启动：

- Vite 静态前端开发服务
- Tauri 桌面壳

如果你只想验证前端构建，可以单独运行：

```bash
npm run build:web
```

### 构建安装包

```bash
npm run build
```

这会先构建 `dist-web/`，再由 Tauri 打包桌面应用。

## 项目结构

```text
standup-reminder/
├── control.html         # 主界面 / 设置页
├── control-renderer.js  # 主窗口逻辑（计时器、托盘、提醒窗口控制）
├── reminder.html        # 全屏提醒弹窗
├── renderer.js          # 提醒窗口逻辑
├── app-shared.js        # 共享状态与主题工具
├── vite.config.mjs      # 多页面前端构建配置
├── src-tauri/           # Tauri 原生壳与能力配置
└── assets/              # 图标等静态资源
```

## 技术栈

| 技术 | 用途 |
|---|---|
| Tauri 2 | 桌面应用壳 |
| Vite | 多页面静态前端构建 |
| 原生 HTML/CSS/JS | 界面渲染 |
| Tauri JS API | 托盘、窗口、多页面控制 |

## 说明

- 当前仓库默认使用 Tauri 能力配置来开放窗口控制、拖拽和多窗口创建权限。

## License

[MIT](LICENSE)
