# Current Affairs Guru

Automated UPSC current affairs intelligence system. Scrapes daily news from multiple sources, processes it through a multi-pass AI pipeline, and serves structured study material via a Next.js web frontend and an Android mobile app.

## Architecture

```
[Scrapers] → [DeepSeek AI Pipeline] → [MongoDB] → [Express API] → [Next.js + Vercel]
   RSS + HTTP + Puppeteer    3-pass            Atlas      Render         Cloudflare KV cache

[Azure Functions Timer] → triggers daily job at configured UTC time

[Android App (Expo)] → [Express API] ← JWT auth (Google Sign-In)
   React Native + MMKV + TanStack Query
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js + Express, deployed on Render |
| AI | DeepSeek (deepseek-chat + deepseek-reasoner) |
| Database | MongoDB Atlas |
| Web Frontend | Next.js 14 + Tailwind CSS, deployed on Vercel |
| Cache | Cloudflare Workers KV (server-side, via Next.js proxy) + client-side page caching |
| Scheduler | Azure Functions Timer Trigger |
| Web Auth | Google OAuth via Firebase |
| Mobile App | Expo (React Native) + TypeScript, Android-only |
| Mobile Auth | Google Sign-In → JWT (access + refresh tokens) |
| Mobile Storage | MMKV (persisted state) + expo-secure-store (tokens) |
| Mobile Data | TanStack Query with MMKV-backed offline persistence |
| Push Notifications | Expo Notifications + FCM |
| Scraping | RSS + plain HTTP + Puppeteer (Vision IAS) |

## Documentation

- [SETUP.md](SETUP.md) — Local development setup (backend, frontend, mobile)
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production deployment (Render, Vercel, Azure, Play Store)
- [FEATURES.md](FEATURES.md) — API reference, pages, data schemas, pipeline details
