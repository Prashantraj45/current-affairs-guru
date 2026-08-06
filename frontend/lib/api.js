/**
 * API client.
 *
 * All requests are routed directly to NEXT_PUBLIC_API_URL (the backend).
 * Caching has been completely removed to serve live requests.
 */

import axios from 'axios';

const api = axios.create({ 
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 25000 
});

export default api;
