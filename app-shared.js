export const STORAGE_KEYS = {
  theme: 'standup-reminder.theme',
  intervalMinutes: 'standup-reminder.interval-minutes',
  showTrayTime: 'standup-reminder.show-tray-time',
  reminderDismissedAt: 'standup-reminder.reminder-dismissed-at'
};

const VALID_THEMES = new Set(['system', 'light', 'dark']);

export function detectPlatform() {
  const source = [
    navigator.userAgentData?.platform,
    navigator.platform,
    navigator.userAgent
  ]
    .filter(Boolean)
    .join(' ');

  if (/mac/i.test(source)) return 'darwin';
  if (/win/i.test(source)) return 'win32';
  if (/linux/i.test(source)) return 'linux';
  return 'unknown';
}

export function isSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme, isDark = isSystemDark()) {
  const useDark = theme === 'dark' || (theme === 'system' && isDark);
  const root = document.documentElement;

  if (useDark) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
}

export function getStoredTheme() {
  const theme = localStorage.getItem(STORAGE_KEYS.theme);
  return VALID_THEMES.has(theme) ? theme : 'system';
}

export function setStoredTheme(theme) {
  if (!VALID_THEMES.has(theme)) return;
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

export function getThemeStatusText(theme) {
  const statusMap = {
    light: '浅色模式',
    dark: '深色模式',
    system: '跟随系统'
  };

  return statusMap[theme] || statusMap.system;
}

export function clampInterval(minutes) {
  return Math.max(1, Math.min(120, Number(minutes) || 20));
}

export function getStoredInterval(fallback = 20) {
  const value = Number.parseInt(localStorage.getItem(STORAGE_KEYS.intervalMinutes) || '', 10);
  return Number.isFinite(value) ? clampInterval(value) : fallback;
}

export function setStoredInterval(minutes) {
  localStorage.setItem(STORAGE_KEYS.intervalMinutes, String(clampInterval(minutes)));
}

export function getStoredShowTrayTime(fallback = true) {
  const value = localStorage.getItem(STORAGE_KEYS.showTrayTime);
  return value === null ? fallback : value === 'true';
}

export function setStoredShowTrayTime(showTrayTime) {
  localStorage.setItem(STORAGE_KEYS.showTrayTime, String(Boolean(showTrayTime)));
}

export function markReminderDismissed() {
  localStorage.setItem(STORAGE_KEYS.reminderDismissedAt, String(Date.now()));
}

export function getSeatedTimeLabel(minutes) {
  return `你已经坐了 ${clampInterval(minutes)} 分钟`;
}
