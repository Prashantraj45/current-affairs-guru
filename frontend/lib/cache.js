/**
 * Cache utilities.
 *
 * The localStorage-based cache has been replaced with Cloudflare KV.
 * All caching now happens server-side in /pages/api/proxy/[...path].js.
 * This file is kept for the IST midnight helper, which is also used by the proxy.
 */

/** Milliseconds from now until midnight in IST (UTC+5:30). */
export function getMsUntilMidnightIST() {
  const now = new Date();
  const currentUTC = now.getTime() + now.getTimezoneOffset() * 60000;
  const ISTOffset = 19800000;
  const nowIST = new Date(currentUTC + ISTOffset);
  const midnight = new Date(nowIST);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - nowIST.getTime();
}
