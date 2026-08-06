import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, '.disk_cache');
const ONE_HOUR_MS = 60 * 60 * 1000;

// Ensure cache directory exists on startup
async function initCache() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create disk cache directory', err);
  }
}
initCache();

function getMsUntil1159PMIST() {
  const now = Date.now();
  const ISTOffset = 5.5 * 60 * 60 * 1000; // +05:30 in ms
  const nowIST = new Date(now + new Date().getTimezoneOffset() * 60000 + ISTOffset);
  
  const targetIST = new Date(nowIST);
  targetIST.setHours(23, 59, 0, 0); // 11:59 PM IST
  
  if (nowIST.getTime() >= targetIST.getTime()) {
    // If it's already past 11:59 PM IST today, set for tomorrow
    targetIST.setDate(targetIST.getDate() + 1);
  }
  
  return targetIST.getTime() - nowIST.getTime();
}

function calculateExpiry() {
  const msUntilMidnight = getMsUntil1159PMIST();
  // Expiry is 1 hour from now, capped at exactly 11:59 PM IST
  const ttl = Math.min(ONE_HOUR_MS, msUntilMidnight);
  return Date.now() + ttl;
}

function getCacheFilePath(key) {
  // Convert URL to a safe filename using base64 and replacing invalid chars
  const safeKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
  return path.join(CACHE_DIR, `${safeKey}.json`);
}

export async function apiCache(req, res, next) {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Do not cache admin routes
  if (req.originalUrl.startsWith('/api/admin')) {
    return next();
  }

  const key = req.originalUrl;
  const filePath = getCacheFilePath(key);

  // Attempt to read from disk
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const cachedEntry = JSON.parse(fileContent);

    // Additionally check if it's past 11:59 PM IST by making sure expiry doesn't exceed true midnight bounds
    if (Date.now() < cachedEntry.expiry) {
      res.setHeader('X-Cache', 'HIT');
      
      // Sliding expiration: refresh for another hour (capped at midnight)
      const newExpiry = calculateExpiry();
      // Only bother writing to disk if it extends the cache by at least 1 minute to save I/O
      if (newExpiry - cachedEntry.expiry > 60000) {
        cachedEntry.expiry = newExpiry;
        fs.writeFile(filePath, JSON.stringify(cachedEntry)).catch(() => {});
      }
      
      return res.json(cachedEntry.data);
    } else {
      // Expired, delete the file in the background
      fs.unlink(filePath).catch(() => {});
    }
  } catch (err) {
    // File doesn't exist or invalid JSON, proceed to MISS
  }

  // Intercept res.json to cache the response to disk
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Only cache successful 200 responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const cacheData = {
        data: body,
        expiry: calculateExpiry()
      };
      
      // Fire-and-forget write to disk
      fs.writeFile(filePath, JSON.stringify(cacheData)).catch(err => {
        console.error('Disk cache write error:', err);
      });
      
      res.setHeader('X-Cache', 'MISS');
    }
    return originalJson(body);
  };

  next();
}

export async function clearCache() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    for (const file of files) {
      await fs.unlink(path.join(CACHE_DIR, file)).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to clear disk cache', err);
  }
}
