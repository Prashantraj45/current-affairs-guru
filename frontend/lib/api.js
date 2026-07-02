import axios from 'axios';
import { getCache, setCache, getMsUntilMidnightIST } from './cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

const originalGet = api.get;

api.get = async (url, config = {}) => {
  const cacheKey = `api_${url}`;
  const cachedData = getCache(cacheKey);

  // Always trigger the API call in background to wake server up / get fresh data
  const fetchPromise = originalGet.call(api, url, config)
    .then(response => {
      setCache(cacheKey, response.data, getMsUntilMidnightIST());
      return response;
    })
    .catch(err => {
      // Ignore background errors if we have cache, otherwise throw
      if (!cachedData) throw err;
      return { data: cachedData, status: 200, fromCache: true };
    });

  if (cachedData) {
    // Return immediately to bypass cold-start wait for the user
    return { data: cachedData, status: 200, fromCache: true };
  }

  return fetchPromise;
};

export default api;
