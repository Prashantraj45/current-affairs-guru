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

export function getMsUntilMidnightIST() {
  const now = new Date();
  const currentUTC = now.getTime() + (now.getTimezoneOffset() * 60000);
  
  // IST is UTC + 5:30 (19,800,000 ms)
  const ISTOffset = 19800000;
  const currentIST = new Date(currentUTC + ISTOffset);
  
  const nextMidnightIST = new Date(currentIST);
  nextMidnightIST.setHours(24, 0, 0, 0);
  
  return nextMidnightIST.getTime() - currentIST.getTime();
}
