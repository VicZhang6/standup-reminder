import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  STORAGE_KEYS,
  applyTheme,
  detectPlatform,
  getSeatedTimeLabel,
  getStoredInterval,
  getStoredTheme,
  markReminderDismissed
} from './app-shared.js';

const reminderWindow = getCurrentWindow();
const platform = detectPlatform();
const dismissBtn = document.getElementById('dismiss-btn');
const seatedTime = document.getElementById('seated-time');

let currentTheme = getStoredTheme();

document.body.classList.add(`platform-${platform}`);

function syncTheme() {
  applyTheme(currentTheme);
}

function updateSeatedTime() {
  seatedTime.textContent = getSeatedTimeLabel(getStoredInterval(20));
}

function handleStorageChange(event) {
  if (event.key === STORAGE_KEYS.theme) {
    currentTheme = getStoredTheme();
    syncTheme();
  }

  if (event.key === STORAGE_KEYS.intervalMinutes) {
    updateSeatedTime();
  }
}

function setupDismissButton() {
  dismissBtn.addEventListener('click', () => {
    dismissBtn.textContent = '✓ 好的，继续加油！';
    dismissBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    dismissBtn.style.pointerEvents = 'none';

    window.setTimeout(async () => {
      markReminderDismissed();
      await reminderWindow.close();
    }, 400);
  });
}

function init() {
  syncTheme();
  updateSeatedTime();
  setupDismissButton();

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'system') {
      syncTheme();
    }
  });

  window.addEventListener('storage', handleStorageChange);
}

init();
