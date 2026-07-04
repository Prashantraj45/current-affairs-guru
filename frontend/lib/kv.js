/**
 * Cloudflare KV REST API client (server-side only).
 *
 * Required environment variables (set on your hosting platform):
 *   CF_ACCOUNT_ID      — Cloudflare account ID (dashboard → right sidebar)
 *   CF_KV_NAMESPACE_ID — KV namespace ID (Workers & Pages → KV → your namespace)
 *   CF_KV_API_TOKEN    — API token with "Workers KV Storage: Edit" permission
 *
 * Cloudflare Pages deployment (native binding alternative):
 *   If you deploy on Cloudflare Pages and bind a KV namespace named CACHE_KV,
 *   you can replace the fetch calls below with env.CACHE_KV.get/put/delete()
 *   inside an edge-runtime API route using @cloudflare/next-on-pages. The REST
 *   API approach here works from any host (Vercel, Azure, CF Pages) with no
 *   adapter required.
 *
 * Creating the KV namespace:
 *   wrangler kv namespace create CACHE_KV
 *   # Copy the returned namespace ID into CF_KV_NAMESPACE_ID
 */

const KV_BASE = () =>
  `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE_ID}`;

function authHeader() {
  return { Authorization: `Bearer ${process.env.CF_KV_API_TOKEN}` };
}

/** Returns true when all three required env vars are present. */
export function kvConfigured() {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.CF_KV_NAMESPACE_ID &&
    process.env.CF_KV_API_TOKEN
  );
}

/**
 * Read a JSON value from KV. Returns null on miss, parse error, or network failure.
 * KV expiration is managed server-side; expired keys return 404 (→ null).
 */
export async function kvGet(key) {
  try {
    const res = await fetch(
      `${KV_BASE()}/values/${encodeURIComponent(key)}`,
      { headers: authHeader() }
    );
    if (!res.ok) return null; // 404 = miss or expired
    return JSON.parse(await res.text());
  } catch {
    return null;
  }
}

/**
 * Write a JSON value to KV.
 * @param {string} key
 * @param {unknown} value - will be JSON-serialised
 * @param {number} ttlSeconds - expiration in seconds (minimum 60 per CF docs)
 */
export async function kvSet(key, value, ttlSeconds) {
  try {
    // CF KV REST API expects the value as plain text (application/json body not accepted
    // at the /values endpoint); pass Content-Type: text/plain with JSON payload.
    await fetch(
      `${KV_BASE()}/values/${encodeURIComponent(key)}?expiration_ttl=${Math.max(60, ttlSeconds)}`,
      {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'text/plain' },
        body: JSON.stringify(value),
      }
    );
  } catch {
    // Non-fatal: stale data or cache miss on next request is acceptable
  }
}

/**
 * Delete a KV key (call this to manually invalidate a cache entry).
 */
export async function kvDelete(key) {
  try {
    await fetch(
      `${KV_BASE()}/values/${encodeURIComponent(key)}`,
      { method: 'DELETE', headers: authHeader() }
    );
  } catch {}
}
