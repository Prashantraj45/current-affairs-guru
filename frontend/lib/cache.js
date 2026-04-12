const PREFIX = 'cag_';
const ONE_HOUR_MS = 60 * 60 * 1000;

export function getCache(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { data, expires } = JSON.parse(raw);
    if (Date.now() > expires) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCache(key, data, ttlMs = ONE_HOUR_MS) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, expires: Date.now() + ttlMs }));
  } catch {}
}
