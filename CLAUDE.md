# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Tauri 2 desktop app (站立提醒 / "Standup Reminder") that reminds users to stand up at configurable intervals. It runs in the system tray and shows a fullscreen reminder when the timer expires. The UI is written in plain HTML/CSS/JS (no framework), and the desktop shell is Rust via Tauri.

## Build & Run Commands

```bash
npm install              # install JS dependencies (Rust/Cargo deps install automatically)
npm run dev              # launch Vite dev server + Tauri desktop shell together
npm run dev:web          # Vite dev server only (no Tauri shell, for frontend-only work)
npm run build            # full production build (Vite + Tauri bundling)
npm run build:web        # Vite build only → outputs to dist-web/
```

**Prerequisites:** Node.js 20+, Rust 1.77+. On Windows, Visual Studio Build Tools with C++ workload is required.

## Architecture

### Multi-window design

The app has four HTML entry points, each a separate Tauri WebView window:

- **control.html** — Main window: circular countdown timer, start/pause/resume, interval settings, theme toggle, tray menu logic. This is the largest file and central orchestrator.
- **reminder.html** — Fullscreen reminder overlay shown when the timer expires.
- **floating.html** — Small always-on-top floating window showing the countdown.
- **floating-menu.html** — Context menu for the floating window.

### Shared state via localStorage

Windows communicate through `localStorage` (not Tauri IPC). `app-shared.js` exports all shared storage keys (`STORAGE_KEYS`), timer state helpers (`createTimerState`, `getStoredTimerState`), theme utilities, and a command-dispatch mechanism (`issueTimerCommand`/`getStoredTimerCommand`).

### Rust backend (src-tauri/)

Minimal — only exposes a `quit_app` Tauri command. All business logic lives in the JS frontend. `tauri.conf.json` defines the window configuration, and `scripts/run-tauri.mjs` wraps the `tauri` CLI to set up MSVC environment on Windows.

### Vite config

`vite.config.mjs` uses Rollup's multi-page input to build all four HTML files into `dist-web/`.

## Language

The app UI and user-facing strings are in **Chinese (Simplified)**. Code comments and variable names are in English.
