const GITHUB_API_URL =
  'https://api.github.com/repos/VicZhang6/standup-reminder/releases/latest';

const STORAGE_PREFIX = 'standup-reminder.update';
const STORAGE_KEYS = {
  lastCheck: `${STORAGE_PREFIX}.last-check`,
  latestVersion: `${STORAGE_PREFIX}.latest-version`,
  downloadUrl: `${STORAGE_PREFIX}.download-url`,
  dismissedVersion: `${STORAGE_PREFIX}.dismissed-version`
};

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

function compareVersions(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }

  return 0;
}

async function fetchLatestRelease() {
  const response = await fetch(GITHUB_API_URL, {
    headers: { Accept: 'application/vnd.github.v3+json' }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    version: data.tag_name,
    url: data.html_url
  };
}

export async function checkForUpdate(currentVersion) {
  const now = Date.now();
  const lastCheck = Number(localStorage.getItem(STORAGE_KEYS.lastCheck)) || 0;

  if (now - lastCheck < CHECK_INTERVAL_MS) {
    const cached = getCachedUpdate();
    if (cached && compareVersions(cached.version, currentVersion) > 0) {
      return cached;
    }
    return null;
  }

  try {
    const release = await fetchLatestRelease();
    localStorage.setItem(STORAGE_KEYS.lastCheck, String(now));
    localStorage.setItem(STORAGE_KEYS.latestVersion, release.version);
    localStorage.setItem(STORAGE_KEYS.downloadUrl, release.url);

    if (compareVersions(release.version, currentVersion) > 0) {
      return release;
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }

  return null;
}

export function getCachedUpdate() {
  const version = localStorage.getItem(STORAGE_KEYS.latestVersion);
  const url = localStorage.getItem(STORAGE_KEYS.downloadUrl);
  if (!version || !url) return null;
  return { version, url };
}

export function isDismissed(version) {
  return localStorage.getItem(STORAGE_KEYS.dismissedVersion) === version;
}

export function dismissUpdate(version) {
  localStorage.setItem(STORAGE_KEYS.dismissedVersion, version);
}
