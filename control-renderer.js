import { defaultWindowIcon } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon } from '@tauri-apps/api/tray';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { LogicalPosition } from '@tauri-apps/api/dpi';
import { currentMonitor, getCurrentWindow } from '@tauri-apps/api/window';
import {
  STORAGE_KEYS,
  applyTheme,
  clampInterval,
  detectPlatform,
  getStoredInterval,
  getStoredShowFloating,
  getStoredShowTrayTime,
  getStoredTimerCommand,
  getStoredTheme,
  getThemeStatusText,
  setStoredInterval,
  setStoredTimerState,
  setStoredShowFloating,
  setStoredShowTrayTime,
  setStoredTheme
} from './app-shared.js';
import { checkForUpdate, dismissUpdate, isDismissed } from './update-checker.js';

const currentWindow = getCurrentWindow();
const platform = detectPlatform();
const CIRCUMFERENCE = 2 * Math.PI * 78;
const TRAY_ID = 'standup-reminder-tray';
const FLOATING_MENU_LABEL = 'floating-menu';
const FLOATING_MENU_SIZE = {
  width: 216,
  height: 320
};

// DOM 元素 - 主界面
const progressCircle = document.getElementById('progressCircle');
const timeDisplay = document.getElementById('timeDisplay');
const timeInput = document.getElementById('timeInput');
const timeLabel = document.getElementById('timeLabel');
const toggleBtn = document.getElementById('toggleBtn');
const toggleText = document.getElementById('toggleText');
const intervalValue = document.getElementById('intervalValue');
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');
const resetBtn = document.getElementById('resetBtn');
const timerControls = document.querySelector('.timer-controls');

// DOM 元素 - 页面切换
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const settingsBtn = document.getElementById('settingsBtn');
const backBtn = document.getElementById('backBtn');
const titlebar = document.querySelector('.titlebar');

// DOM 元素 - 主题设置
const themeSystem = document.getElementById('themeSystem');
const themeLight = document.getElementById('themeLight');
const themeDark = document.getElementById('themeDark');
const currentThemeStatus = document.getElementById('currentThemeStatus');
const showFloatingToggle = document.getElementById('showFloatingToggle');
const releaseDownloadBtn = document.getElementById('releaseDownloadBtn');
const updateBanner = document.getElementById('updateBanner');
const updateVersionText = document.getElementById('updateVersionText');
const updateDownloadBtn = document.getElementById('updateDownloadBtn');
const updateDismissBtn = document.getElementById('updateDismissBtn');
const updateDot = document.getElementById('updateDot');

const RELEASE_LATEST_URL =
  'https://github.com/VicZhang6/standup-reminder/releases/latest';
const CURRENT_VERSION = '1.5.1';

let tray = null;
let currentInterval = getStoredInterval(20);
let showFloating = getStoredShowFloating(true);
let showTrayTime = getStoredShowTrayTime(true);
let isEditing = false;
let currentTheme = getStoredTheme();
let timerRunning = false;
let elapsedSeconds = 0;
let tickInterval = null;
let lastReminderDismissedAt = localStorage.getItem(STORAGE_KEYS.reminderDismissedAt) || '';
let lastTimerCommandId = getStoredTimerCommand()?.id || '';

document.body.classList.add(`platform-${platform}`);

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatTrayTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function getState() {
  const total = currentInterval * 60;
  const remaining = Math.max(0, total - elapsedSeconds);

  return {
    running: timerRunning,
    intervalMinutes: currentInterval,
    elapsed: elapsedSeconds,
    remaining,
    total
  };
}

function syncTimerState(data = getState()) {
  setStoredTimerState({
    running: data.running,
    intervalMinutes: data.intervalMinutes,
    elapsed: data.elapsed,
    updatedAt: Date.now()
  });
}

function shouldStartFresh() {
  return elapsedSeconds === 0 || elapsedSeconds >= currentInterval * 60;
}

function updateThemeOptions() {
  themeSystem?.classList.toggle('selected', currentTheme === 'system');
  themeLight?.classList.toggle('selected', currentTheme === 'light');
  themeDark?.classList.toggle('selected', currentTheme === 'dark');
}

function updateThemeStatus() {
  if (currentThemeStatus) {
    currentThemeStatus.textContent = getThemeStatusText(currentTheme);
  }
}

function syncTheme() {
  applyTheme(currentTheme);
  updateThemeOptions();
  updateThemeStatus();
}

function showMainView() {
  mainView.classList.add('active');
  settingsView.classList.remove('active');
}

function updateFloatingToggleUI() {
  if (showFloatingToggle) {
    showFloatingToggle.checked = showFloating;
  }
}

function showSettingsView() {
  settingsView.classList.add('active');
  mainView.classList.remove('active');
  updateThemeStatus();
  updateFloatingToggleUI();
}

function updateUI(data = getState()) {
  if (!isEditing) {
    timeDisplay.textContent = formatTime(data.remaining);
  }

  const progress = data.total === 0 ? 0 : data.elapsed / data.total;
  const offset = CIRCUMFERENCE * (1 - progress);
  progressCircle.style.strokeDashoffset = String(offset);

  if (data.running) {
    if (!isEditing) {
      timeLabel.textContent = '剩余时间';
    }

    toggleBtn.className = 'btn-primary is-running';
    toggleText.textContent = '暂停计时';
    toggleBtn.querySelector('svg').innerHTML =
      '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';
  } else {
    const pausedWithProgress = data.elapsed > 0;

    if (!isEditing) {
      timeLabel.textContent = pausedWithProgress ? '剩余时间' : '准备就绪';
    }

    toggleBtn.className = 'btn-primary';
    toggleText.textContent = pausedWithProgress ? '继续计时' : '开始计时';
    toggleBtn.querySelector('svg').innerHTML = '<polygon points="5,3 19,12 5,21"/>';
  }

  intervalValue.textContent = `${currentInterval} 分钟`;
  timerControls?.classList.toggle('has-reset', !data.running && data.elapsed > 0);
}

async function updateTrayTitle() {
  if (!tray) return;

  if (!showTrayTime || !timerRunning) {
    await tray.setTitle(null);
    return;
  }

  await tray.setTitle(` ${formatTrayTime(getState().remaining)}`);
}

async function showControlWindow() {
  await currentWindow.show();
  await currentWindow.unminimize();
  await currentWindow.setFocus();
}

async function hideControlWindow() {
  await currentWindow.hide();
}

async function getFloatingWindow() {
  return WebviewWindow.getByLabel('floating');
}

async function getFloatingMenuWindow() {
  return WebviewWindow.getByLabel(FLOATING_MENU_LABEL);
}

async function isFloatingWindowVisible() {
  const floatingWindow = await getFloatingWindow();
  if (!floatingWindow) return false;

  try {
    return await floatingWindow.isVisible();
  } catch {
    return false;
  }
}

async function createFloatingWindow() {
  const existingWindow = await getFloatingWindow();
  if (existingWindow) {
    await existingWindow.setShadow(false).catch(() => { });
    return existingWindow;
  }

  const monitor = await currentMonitor();
  const size = monitor?.size || { width: 1440, height: 900 };
  const position = monitor?.position || { x: 0, y: 0 };
  const width = 140;
  const height = 44;
  const x = position.x + size.width - width - 16;
  const y = position.y + Math.max(48, Math.round(size.height * 0.12));

  return new Promise((resolve, reject) => {
    const floatingWindow = new WebviewWindow('floating', {
      url: 'floating.html',
      title: '站立提醒悬浮窗',
      width,
      height,
      minWidth: width,
      minHeight: height,
      maxWidth: width,
      maxHeight: height,
      x,
      y,
      decorations: false,
      shadow: false,
      resizable: false,
      maximizable: false,
      minimizable: false,
      closable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      focus: false,
      visible: true,
      transparent: true
    });

    floatingWindow.once('tauri://created', () => resolve(floatingWindow));
    floatingWindow.once('tauri://error', reject);
  });
}

async function showFloatingWindow() {
  const floatingWindow = await createFloatingWindow();
  await floatingWindow.show();
}

async function closeFloatingMenuWindow() {
  const floatingMenuWindow = await getFloatingMenuWindow();
  if (!floatingMenuWindow) return;

  await floatingMenuWindow.hide().catch(() => { });
}

async function destroyFloatingMenuWindow() {
  const floatingMenuWindow = await getFloatingMenuWindow();
  if (!floatingMenuWindow) return;

  await floatingMenuWindow.close().catch(() => { });
}

async function showFloatingMenuWindow(anchor = {}) {
  const monitor = await currentMonitor();
  const size = monitor?.size || { width: 1440, height: 900 };
  const position = monitor?.position || { x: 0, y: 0 };
  const margin = 12;
  const requestedX = Math.round(Number(anchor.x) || position.x + size.width / 2);
  const requestedY = Math.round(Number(anchor.y) || position.y + size.height / 2);
  const x = Math.max(
    position.x + margin,
    Math.min(requestedX, position.x + size.width - FLOATING_MENU_SIZE.width - margin)
  );
  const y = Math.max(
    position.y + margin,
    Math.min(requestedY, position.y + size.height - FLOATING_MENU_SIZE.height - margin)
  );

  const existingWindow = await getFloatingMenuWindow();
  if (existingWindow) {
    await existingWindow.setPosition(new LogicalPosition(x, y)).catch(() => { });
    await existingWindow.show().catch(() => { });
    await existingWindow.setFocus().catch(() => { });
    return existingWindow;
  }

  return new Promise((resolve, reject) => {
    const floatingMenuWindow = new WebviewWindow(FLOATING_MENU_LABEL, {
      url: 'floating-menu.html',
      title: '站立提醒菜单',
      width: FLOATING_MENU_SIZE.width,
      height: FLOATING_MENU_SIZE.height,
      x,
      y,
      decorations: false,
      shadow: false,
      resizable: false,
      maximizable: false,
      minimizable: false,
      closable: true,
      skipTaskbar: true,
      alwaysOnTop: true,
      focus: true,
      visible: true,
      transparent: true
    });

    floatingMenuWindow.once('tauri://created', () => resolve(floatingMenuWindow));
    floatingMenuWindow.once('tauri://error', reject);
  });
}

async function hideFloatingWindow() {
  await closeFloatingMenuWindow();

  const floatingWindow = await getFloatingWindow();
  if (!floatingWindow) return;
  await floatingWindow.hide();
}

async function quitApp() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }

  const reminderWindow = await WebviewWindow.getByLabel('reminder');
  if (reminderWindow) {
    await reminderWindow.close().catch(() => { });
  }

  const floatingWindow = await getFloatingWindow();
  if (floatingWindow) {
    await floatingWindow.close().catch(() => { });
  }

  await destroyFloatingMenuWindow();

  if (tray) {
    await TrayIcon.removeById(TRAY_ID).catch(() => { });
  }

  await invoke('quit_app');
}

async function rebuildTrayMenu() {
  if (!tray) return;
  const floatingWindowVisible = await isFloatingWindowVisible();

  const menu = await Menu.new({
    items: [
      {
        id: 'open',
        text: '打开主面板',
        action: () => {
          void showControlWindow();
        }
      },
      {
        id: 'toggle-floating',
        text: floatingWindowVisible ? '隐藏悬浮窗' : '显示悬浮窗',
        action: () => {
          void (async () => {
            if (floatingWindowVisible) {
              showFloating = false;
              setStoredShowFloating(false);
              await hideFloatingWindow();
            } else {
              showFloating = true;
              setStoredShowFloating(true);
              await showFloatingWindow();
            }
            updateFloatingToggleUI();
            void rebuildTrayMenu();
          })();
        }
      },
      { item: 'Separator' },
      {
        id: 'toggle-timer',
        text: timerRunning ? '暂停计时' : '开始计时',
        action: () => {
          void toggleTimer();
        }
      },
      { item: 'Separator' },
      {
        id: 'toggle-tray-time',
        text: showTrayTime ? '隐藏剩余时间' : '显示剩余时间',
        action: () => {
          showTrayTime = !showTrayTime;
          setStoredShowTrayTime(showTrayTime);
          void updateTrayTitle();
          void rebuildTrayMenu();
        }
      },
      { item: 'Separator' },
      {
        id: 'quit',
        text: '退出',
        action: () => {
          void quitApp();
        }
      }
    ]
  });

  await tray.setMenu(menu);
}

async function createTray() {
  const existingTray = await TrayIcon.getById(TRAY_ID);
  if (existingTray) {
    await TrayIcon.removeById(TRAY_ID).catch(() => { });
  }

  tray = await TrayIcon.new({
    id: TRAY_ID,
    icon: await defaultWindowIcon(),
    tooltip: '站立提醒',
    iconAsTemplate: platform === 'darwin',
    showMenuOnLeftClick: false,
    action: (event) => {
      if (event.type === 'Click' && event.button === 'Left' && event.buttonState === 'Up') {
        void showControlWindow();
      }
    }
  });

  await rebuildTrayMenu();
  await updateTrayTitle();
}

function stopTimer() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }

  timerRunning = false;
  updateUI();
  syncTimerState();
  void rebuildTrayMenu();
  void updateTrayTitle();
}

function resetTimer() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }

  timerRunning = false;
  elapsedSeconds = 0;
  updateUI();
  syncTimerState();
  void rebuildTrayMenu();
  void updateTrayTitle();
}

async function createReminderWindow() {
  const existingWindow = await WebviewWindow.getByLabel('reminder');
  if (existingWindow) {
    return existingWindow;
  }

  const monitor = await currentMonitor();
  const size = monitor?.size || { width: 1440, height: 900 };
  const position = monitor?.position || { x: 0, y: 0 };

  return new Promise((resolve, reject) => {
    const reminderWindow = new WebviewWindow('reminder', {
      url: 'reminder.html',
      title: '站立提醒',
      width: size.width,
      height: size.height,
      x: position.x,
      y: position.y,
      decorations: false,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      visible: false,
      focus: true,
      transparent: platform === 'darwin'
    });

    reminderWindow.once('tauri://created', () => resolve(reminderWindow));
    reminderWindow.once('tauri://error', reject);
  });
}

async function showReminder() {
  localStorage.setItem(STORAGE_KEYS.intervalMinutes, String(currentInterval));

  const reminderWindow = await createReminderWindow();
  await reminderWindow.show();
  await reminderWindow.setFocus().catch(() => { });
}

function startTimer({ resetElapsed = false } = {}) {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }

  timerRunning = true;
  if (resetElapsed) {
    elapsedSeconds = 0;
  }

  updateUI();
  syncTimerState();
  void rebuildTrayMenu();
  void updateTrayTitle();

  tickInterval = window.setInterval(async () => {
    elapsedSeconds += 1;
    updateUI();
    syncTimerState();
    void updateTrayTitle();

    if (elapsedSeconds >= currentInterval * 60) {
      await showReminder();
      stopTimer();
    }
  }, 1000);
}

async function toggleTimer() {
  if (timerRunning) {
    stopTimer();
  } else {
    startTimer({ resetElapsed: shouldStartFresh() });
  }
}

function setIntervalMinutes(minutes) {
  currentInterval = clampInterval(minutes);
  setStoredInterval(currentInterval);

  if (timerRunning) {
    startTimer({ resetElapsed: true });
  } else {
    elapsedSeconds = Math.min(elapsedSeconds, currentInterval * 60);
    updateUI();
    syncTimerState();
    void updateTrayTitle();
  }
}

function selectTheme(theme) {
  currentTheme = theme;
  setStoredTheme(theme);
  syncTheme();
}

function parseTimeInput(value) {
  if (value.includes(':')) {
    const [minutesText, secondsText] = value.split(':');
    const minutes = Number.parseInt(minutesText, 10);
    const seconds = Number.parseInt(secondsText, 10);

    if (Number.isFinite(minutes) && Number.isFinite(seconds) && minutes >= 0 && seconds >= 0 && seconds < 60) {
      return minutes * 60 + seconds;
    }

    return null;
  }

  const minutes = Number.parseInt(value, 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : null;
}

function enterEditMode() {
  if (isEditing) return;

  isEditing = true;
  timeInput.value = timeDisplay.textContent;
  timeDisplay.classList.add('hidden');
  timeInput.classList.add('active');
  timeLabel.textContent = '输入分钟数 或 MM:SS';
  timeLabel.classList.add('editing');
  timeInput.focus();
  timeInput.select();
}

function exitEditMode(shouldApply) {
  if (!isEditing) return;

  isEditing = false;

  if (shouldApply) {
    const totalSeconds = parseTimeInput(timeInput.value.trim());
    if (totalSeconds !== null && totalSeconds > 0) {
      setIntervalMinutes(Math.ceil(totalSeconds / 60));
    }
  }

  timeInput.classList.remove('active');
  timeDisplay.classList.remove('hidden');
  timeLabel.classList.remove('editing');
}

async function handleTimerCommand(command) {
  switch (command.type) {
    case 'toggle-timer':
      await toggleTimer();
      break;
    case 'start-timer':
      if (!timerRunning) {
        startTimer({ resetElapsed: shouldStartFresh() });
      }
      break;
    case 'pause-timer':
      if (timerRunning) {
        stopTimer();
      }
      break;
    case 'reset-timer':
      resetTimer();
      break;
    case 'show-main':
      await closeFloatingMenuWindow();
      await showControlWindow();
      break;
    case 'show-floating':
      showFloating = true;
      setStoredShowFloating(true);
      await closeFloatingMenuWindow();
      await showFloatingWindow();
      break;
    case 'hide-floating':
      showFloating = false;
      setStoredShowFloating(false);
      await hideFloatingWindow();
      break;
    case 'show-floating-menu':
      await showFloatingMenuWindow(command.payload);
      break;
    case 'hide-floating-menu':
      await closeFloatingMenuWindow();
      break;
    case 'quit-app':
      await quitApp();
      break;
    default:
      break;
  }

  if (['show-floating', 'hide-floating'].includes(command.type)) {
    updateFloatingToggleUI();
    void rebuildTrayMenu();
  }
}

function handleStorageChange(event) {
  if (event.key === STORAGE_KEYS.theme) {
    currentTheme = getStoredTheme();
    syncTheme();
    return;
  }

  if (event.key === STORAGE_KEYS.intervalMinutes) {
    currentInterval = getStoredInterval(currentInterval);
    updateUI();
    syncTimerState();
    return;
  }

  if (event.key === STORAGE_KEYS.showFloating) {
    showFloating = getStoredShowFloating(true);
    updateFloatingToggleUI();
    return;
  }

  if (event.key === STORAGE_KEYS.reminderDismissedAt && event.newValue && event.newValue !== lastReminderDismissedAt) {
    lastReminderDismissedAt = event.newValue;
    startTimer({ resetElapsed: true });
    return;
  }

  if (event.key === STORAGE_KEYS.timerCommand && event.newValue) {
    const command = getStoredTimerCommand();
    if (!command?.id || command.id === lastTimerCommandId) {
      return;
    }

    lastTimerCommandId = command.id;
    void handleTimerCommand(command);
  }
}

function setupWindowControls() {
  document.querySelector('.win-btn-minimize')?.addEventListener('click', (event) => {
    event.stopPropagation();
    void currentWindow.minimize();
  });

  document.querySelector('.win-btn-close')?.addEventListener('click', (event) => {
    event.stopPropagation();
    void hideControlWindow();
  });

  settingsBtn?.addEventListener('click', (event) => {
    event.stopPropagation();
    showSettingsView();
  });

  titlebar?.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    if (event.target.closest('.window-controls')) return;
    void currentWindow.startDragging();
  });
}

function disableContextMenu() {
  window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
}

function showUpdateBanner(release) {
  if (!updateBanner || !release || isDismissed(release.version)) return;

  updateVersionText.textContent = `${CURRENT_VERSION} → ${release.version}`;
  updateBanner.classList.add('visible');
  updateDot?.classList.add('visible');

  updateDownloadBtn?.addEventListener('click', async () => {
    try {
      await openUrl(release.url);
    } catch {
      window.open(release.url, '_blank', 'noopener,noreferrer');
    }
  }, { once: true });

  updateDismissBtn?.addEventListener('click', () => {
    dismissUpdate(release.version);
    updateBanner.classList.remove('visible');
    updateDot?.classList.remove('visible');
  }, { once: true });
}

async function runUpdateCheck() {
  try {
    const release = await checkForUpdate(CURRENT_VERSION);
    if (release) {
      showUpdateBanner(release);
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}

function shouldHandleToggleShortcut(event) {
  const isSpaceKey = event.code === 'Space' || event.key === ' ';
  if (!isSpaceKey || event.repeat) {
    return false;
  }

  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return false;
  }

  if (!mainView.classList.contains('active') || settingsView.classList.contains('active') || isEditing) {
    return false;
  }

  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return false;
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    return false;
  }

  return true;
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (event) => {
    if (!shouldHandleToggleShortcut(event)) {
      return;
    }

    event.preventDefault();
    void toggleTimer();
  });
}

async function init() {
  syncTheme();
  updateUI();
  syncTimerState();
  setupWindowControls();
  disableContextMenu();
  setupKeyboardShortcuts();
  await currentWindow.onCloseRequested((event) => {
    event.preventDefault();
    void quitApp();
  });

  backBtn?.addEventListener('click', showMainView);

  releaseDownloadBtn?.addEventListener('click', async () => {
    try {
      await openUrl(RELEASE_LATEST_URL);
    } catch (err) {
      console.error(err);
      window.open(RELEASE_LATEST_URL, '_blank', 'noopener,noreferrer');
    }
  });
  themeSystem?.addEventListener('click', () => selectTheme('system'));
  themeLight?.addEventListener('click', () => selectTheme('light'));
  themeDark?.addEventListener('click', () => selectTheme('dark'));

  showFloatingToggle?.addEventListener('change', () => {
    const enabled = showFloatingToggle.checked;
    void (async () => {
      showFloating = enabled;
      setStoredShowFloating(enabled);
      if (enabled) {
        await showFloatingWindow();
      } else {
        await hideFloatingWindow();
      }
      void rebuildTrayMenu();
    })();
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'system') {
      syncTheme();
    }
  });

  window.addEventListener('storage', handleStorageChange);

  toggleBtn.addEventListener('click', () => {
    void toggleTimer();
  });

  timeDisplay.addEventListener('click', enterEditMode);

  timeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      exitEditMode(true);
    } else if (event.key === 'Escape') {
      exitEditMode(false);
    }
  });

  timeInput.addEventListener('blur', () => {
    exitEditMode(true);
  });

  timeInput.addEventListener('input', () => {
    timeInput.value = timeInput.value.replace(/[^0-9:]/g, '');
  });

  decreaseBtn.addEventListener('click', () => {
    setIntervalMinutes(currentInterval - 1);
  });

  increaseBtn.addEventListener('click', () => {
    setIntervalMinutes(currentInterval + 1);
  });

  resetBtn?.addEventListener('click', () => {
    resetTimer();
  });

  window.addEventListener('beforeunload', () => {
    if (tickInterval) {
      clearInterval(tickInterval);
    }
  });

  try {
    await createTray();
  } catch (error) {
    console.error('Failed to initialize tray.', error);
  }

  try {
    if (showFloating) {
      await showFloatingWindow();
    } else {
      await hideFloatingWindow();
    }
  } catch (error) {
    console.error('Failed to initialize floating window.', error);
  }

  updateFloatingToggleUI();

  void runUpdateCheck();
}

updateFloatingToggleUI();
void init();
