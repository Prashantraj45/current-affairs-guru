# Local Development Setup

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- DeepSeek API key
- Firebase project (for Google auth)
- Cloudflare account with a KV namespace (optional — caching skipped if vars absent)

---

## Backend

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

```env
# AI
DEEPSEEK_API_KEY=your-deepseek-api-key

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/upsc-ai?retryWrites=true&w=majority

# Admin API (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ADMIN_SECRET=your-64-char-random-secret

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001

# Scheduler (set false to disable cron on local)
SCHEDULER_ENABLED=false
JOB_TIME=05:00
```

### 3. Start

```bash
npm start        # production mode
npm run dev      # nodemon auto-reload
npm run job      # run daily job once manually
```

API runs on `http://localhost:3000`.

---

## Frontend

### 1. Install dependencies

```bash
cd frontend && npm install
```

### 2. Create `frontend/.env.local`

```env
# Backend URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Firebase (get from Firebase Console → Project Settings → Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Skip Google auth on local if needed
NEXT_PUBLIC_DISABLE_OAUTH_LOCAL=true

# EmailJS (support page)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=

# Cloudflare KV (optional — caching disabled if absent)
CF_ACCOUNT_ID=
CF_KV_NAMESPACE_ID=
CF_KV_API_TOKEN=
```

### 3. Start

```bash
cd frontend && npm run dev
```

Frontend runs on `http://localhost:3001`.

---

## Running the daily job locally

```bash
npm run job
```

This fetches news for yesterday (UTC), runs the AI pipeline, and saves to MongoDB. Takes 2–5 minutes depending on network.

---

## Security

- Never commit `.env` or `frontend/.env.local` — both are in `.gitignore`
- `ADMIN_SECRET` is used only via `x-admin-key` header; never expose it on the frontend
- Before every push: `git check-ignore .env` should output `.env`
- To scan history for leaked secrets: `git rev-list --all | xargs git show | grep -E "sk-|mongodb\+srv"`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `DEEPSEEK_API_KEY not configured` | Add key to `.env` |
| `MONGODB_URI not set` | Add URI to `.env`, check Atlas IP whitelist |
| Lock stuck after crashed job | `POST /api/admin/release-lock` with `x-admin-key` header |
| Puppeteer Chrome not found (local) | Set `PUPPETEER_EXECUTABLE_PATH` or let Puppeteer download on first run |
| Frontend shows no data | Run `npm run job` first to populate MongoDB |
| CORS error | Check `CORS_ORIGIN` matches your frontend URL |
