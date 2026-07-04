/**
 * API client.
 *
 * All GET requests are routed through /api/proxy/[...path], the Next.js server
 * route that handles Cloudflare KV caching and stale-while-revalidate.
 * The proxy forwards misses to NEXT_PUBLIC_API_URL (the backend).
 *
 * Example: api.get('/api/today') → GET /api/proxy/api/today (local Next.js)
 *          → proxy checks KV → returns cached or fresh backend data
 *
 * No browser storage (localStorage / sessionStorage) is used for caching.
 */

import axios from 'axios';

const api = axios.create({ timeout: 25000 });

const _get = api.get.bind(api);

api.get = (url, config = {}) => _get(`/api/proxy${url}`, config);

export default api;
