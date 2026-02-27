# 站立提醒 (Standup Reminder)

一款轻量的桌面应用，每隔一段时间提醒你站起来活动，远离久坐危害。

基于 Electron 构建，常驻系统状态栏，到时间后弹出全屏遮罩提醒。

![macOS](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)
![Windows](https://img.shields.io/badge/platform-Windows-blue?logo=windows)
![Electron](https://img.shields.io/badge/electron-33-blue?logo=electron)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ 功能特性

- **定时提醒** — 默认每 20 分钟弹出全屏提醒，提示你站起来活动
- **自定义间隔** — 通过控制面板或状态栏菜单调整提醒间隔（5 ~ 120 分钟）
- **系统状态栏常驻** — 自绘时钟图标 + 倒计时文字实时显示剩余时间
- **圆形进度环** — 控制面板中直观展示倒计时进度
- **优雅弹窗** — 毛玻璃遮罩 + 卡片动画，一键确认已站立
- **macOS 原生体验** — 无边框窗口、透明背景、Dock 栏隐藏，不打扰日常使用

## 📸 预览

| 控制面板 | 提醒弹窗 |
|:---:|:---:|
| 圆形进度环 + 间隔调节 | 全屏毛玻璃 + 确认按钮 |

## 🚀 快速开始

### 下载安装

前往 [Releases](https://github.com/VicZhang6/standup-reminder/releases) 下载最新安装包：

| 平台 | 文件 | 架构 |
|---|---|---|
| macOS | `.dmg` | Apple Silicon (arm64) |
| Windows | `.exe` | x64 |

> **macOS 注意：** 由于未签名，首次打开可能需要在「系统设置 → 隐私与安全性」中允许运行。

### 从源码运行

```bash
# 克隆仓库
git clone https://github.com/VicZhang6/standup-reminder.git
cd standup-reminder

# 安装依赖
npm install

# 启动应用
npm start

# 或以开发模式启动（DevTools）
npm run dev
```

### 构建安装包

```bash
# macOS DMG (arm64)
npm run build:dmg

# Windows EXE (x64)
npm run build:win
```

构建产物在 `dist/` 目录下。

## 🛠 技术栈

| 技术 | 用途 |
|---|---|
| **Electron 33** | 跨平台桌面应用框架 |
| **electron-builder** | 打包 & 生成 DMG |
| **原生 HTML/CSS/JS** | 界面渲染，无额外 UI 框架 |
| **Canvas NativeImage** | 程序化绘制状态栏时钟图标 |

## 📂 项目结构

```
standup-reminder/
├── main.js              # Electron 主进程（托盘、窗口、定时器）
├── preload.js           # 预加载脚本（IPC 桥接）
├── control.html         # 控制面板界面
├── control-renderer.js  # 控制面板渲染逻辑
├── reminder.html        # 提醒弹窗界面
├── renderer.js          # 提醒弹窗渲染逻辑
├── package.json         # 项目配置 & 构建脚本
└── assets/              # 静态资源
```

## 📄 License

[MIT](LICENSE)

---

> 久坐有害健康，起来伸个懒腰、喝杯水吧 ☕
