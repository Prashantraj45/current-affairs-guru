const cache = new Map();

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

export function apiCache(req, res, next) {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Do not cache admin routes
  if (req.originalUrl.startsWith('/api/admin')) {
    return next();
  }

  const key = req.originalUrl;
  const cachedEntry = cache.get(key);

  if (cachedEntry) {
    if (Date.now() < cachedEntry.expiry) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedEntry.data);
    } else {
      // Expired
      cache.delete(key);
    }
  }

  // Intercept res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Only cache successful 200 responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const ttl = getMsUntil1159PMIST();
      cache.set(key, {
        data: body,
        expiry: Date.now() + ttl
      });
      res.setHeader('X-Cache', 'MISS');
    }
    return originalJson(body);
  };

  next();
}

export function clearCache() {
  cache.clear();
}
