# Current Affairs Guru

Automated UPSC current affairs intelligence system. Scrapes daily news from multiple sources, processes it through a multi-pass AI pipeline, and serves structured study material via a Next.js frontend.

## Architecture

```
[Scrapers] → [DeepSeek AI Pipeline] → [MongoDB] → [Express API] → [Next.js + Vercel]
   RSS + HTTP + Puppeteer    3-pass            Atlas      Render         Cloudflare KV cache

[Azure Functions Timer] → triggers daily job at configured UTC time
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js + Express, deployed on Render |
| AI | DeepSeek (deepseek-chat + deepseek-reasoner) |
| Database | MongoDB Atlas |
| Frontend | Next.js 14 + Tailwind CSS, deployed on Vercel |
| Cache | Cloudflare Workers KV (server-side, via Next.js proxy) |
| Scheduler | Azure Functions Timer Trigger |
| Auth | Google OAuth via Firebase |
| Scraping | RSS + plain HTTP + Puppeteer (Vision IAS) |

## Documentation

- [SETUP.md](SETUP.md) — Local development setup
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production deployment (Render, Vercel, Azure)
- [FEATURES.md](FEATURES.md) — API reference, pages, data schemas, pipeline details
