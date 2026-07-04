/**
 * /api/proxy/[...path] — Backend proxy with Cloudflare KV stale-while-revalidate cache.
 *
 * Request flow:
 *   1. Check KV for a cached response.
 *   2. KV HIT  → return cached JSON immediately; refresh KV in the background
 *               if the backend has newer/changed data.
 *   3. KV MISS → fetch from backend, store in KV, return fresh JSON.
 *
 * If CF_ACCOUNT_ID / CF_KV_NAMESPACE_ID / CF_KV_API_TOKEN are not set (local dev),
 * requests are forwarded directly to the backend with no caching.
 *
 * Cache TTL: entries expire at midnight IST (same behaviour as the old localStorage layer).
 * Cache keys: "cag_proxy_api/today", "cag_proxy_api/history?start=…&end=…", etc.
 *
 * Stale-while-revalidate in serverless environments:
 *   On Vercel, Node.js execution continues for a short window after res.json() so
 *   the background refresh usually completes. On Cloudflare Workers/Pages, wrap the
 *   background work in ctx.waitUntil() for guaranteed execution (requires edge runtime).
 *
 * Required env vars (see frontend/lib/kv.js for setup instructions):
 *   CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_KV_API_TOKEN
 *   NEXT_PUBLIC_API_URL — backend base URL (e.g. https://your-api.azurewebsites.net)
 */

import { kvGet, kvSet, kvConfigured } from '../../../lib/kv';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const KEY_PREFIX = 'cag_proxy_';

/** Seconds until midnight IST — mirrors the old getMsUntilMidnightIST() TTL. */
function ttlUntilMidnightIST() {
  const now = Date.now();
  const ISTOffset = 19800000; // +05:30 in ms
  const nowIST = new Date(now + new Date().getTimezoneOffset() * 60000 + ISTOffset);
  const midnight = new Date(nowIST);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(60, Math.ceil((midnight.getTime() - nowIST.getTime()) / 1000));
}

/** Build the KV cache key from the request path + relevant query params. */
function buildCacheKey(pathSegments, query) {
  const path = pathSegments.join('/');
  const q = { ...query };
  delete q.path; // Next.js injects this for [...path] routes
  const qs = new URLSearchParams(q).toString();
  return KEY_PREFIX + path + (qs ? `?${qs}` : '');
}

/** Fetch one URL from the backend and return parsed JSON. Throws on non-2xx. */
async function fetchBackend(pathSegments, query) {
  const path = pathSegments.join('/');
  const q = { ...query };
  delete q.path;
  const qs = new URLSearchParams(q).toString();
  const url = `${BACKEND}/${path}${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    // Bypass any CDN cache on the backend side so we always get authoritative data
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Backend responded ${res.status} for ${url}`);
  return res.json();
}

/**
 * Returns true when the fresh payload is meaningfully different from the cached one.
 * Checks the date field (for today-style responses) and entries count (for list responses).
 */
function shouldUpdateCache(cached, fresh) {
  if (!cached) return true;
  if (fresh.date && fresh.date > (cached.date || '')) return true;
  if (
    fresh.entries !== undefined &&
    fresh.entries?.length !== cached.entries?.length
  ) return true;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const segments = Array.isArray(req.query.path)
    ? req.query.path
    : [req.query.path];

  // ── Fast path: KV disabled (local dev without env vars) ──────────────────
  if (!kvConfigured()) {
    try {
      const data = await fetchBackend(segments, req.query);
      res.status(200).json(data);
    } catch (err) {
      res.status(502).json({ error: 'Backend unavailable', message: err.message });
    }
    return;
  }

  const cacheKey = buildCacheKey(segments, req.query);
  const ttl = ttlUntilMidnightIST();

  // ── KV HIT: return stale data now, refresh in background ─────────────────
  const cached = await kvGet(cacheKey);
  if (cached) {
    res.status(200).json(cached);

    // Background refresh (runs after response is flushed on Vercel/Node.js).
    // On Cloudflare Workers, replace with ctx.waitUntil(refreshPromise) for
    // guaranteed execution beyond the response lifecycle.
    fetchBackend(segments, req.query)
      .then((fresh) => {
        if (shouldUpdateCache(cached, fresh)) {
          return kvSet(cacheKey, fresh, ttl);
        }
      })
      .catch(() => {}); // Stale data was already sent; ignore background errors

    return;
  }

  // ── KV MISS: fetch, cache, return ────────────────────────────────────────
  try {
    const fresh = await fetchBackend(segments, req.query);
    // Store in KV before responding (fire-and-forget the put; don't block the client)
    kvSet(cacheKey, fresh, ttl).catch(() => {});
    res.status(200).json(fresh);
  } catch (err) {
    res.status(502).json({ error: 'Backend unavailable', message: err.message });
  }
}
