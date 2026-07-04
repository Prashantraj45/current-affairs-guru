# Production Deployment

Three independently deployed services: backend (Render), frontend (Vercel), scheduler (Azure Functions).

---

## Backend — Render

**Service type:** Web Service  
**Build command:** `npm install`  
**Start command:** `npm start`  
**Node version:** 18+

### Environment variables (set in Render dashboard)

```env
DEEPSEEK_API_KEY=
MONGODB_URI=mongodb+srv://...
ADMIN_SECRET=                    # 64-char random hex
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-vercel-domain.vercel.app
SCHEDULER_ENABLED=false          # scheduler runs via Azure Functions, not here
PUPPETEER_EXECUTABLE_PATH=       # Render sets this automatically for Puppeteer buildpack
```

### Puppeteer on Render

Add the Puppeteer buildpack in Render settings or set `PUPPETEER_CACHE_DIR` to a writable path. The app uses `process.env.PUPPETEER_EXECUTABLE_PATH` with fallback to `puppeteer.executablePath()`.

### Health check

Configure Render health check path to `/health`.

---

## Frontend — Vercel

**Framework preset:** Next.js  
**Root directory:** `frontend`  
**Build command:** `npm run build`  
**Output directory:** `.next`

### Environment variables (set in Vercel dashboard)

```env
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# EmailJS
NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=

# Cloudflare KV (server-side only, no NEXT_PUBLIC_ prefix)
CF_ACCOUNT_ID=
CF_KV_NAMESPACE_ID=
CF_KV_API_TOKEN=
```

### Cloudflare KV setup

1. Cloudflare dashboard → Workers & Pages → KV → Create namespace
2. Copy namespace ID → `CF_KV_NAMESPACE_ID`
3. Create API token with **Workers KV Storage: Edit** permission → `CF_KV_API_TOKEN`
4. Account ID from dashboard right sidebar → `CF_ACCOUNT_ID`

KV keys follow the pattern `cag_proxy_{route}` (e.g. `cag_proxy_api/today`). TTL expires at midnight IST daily.

---

## Scheduler — Azure Functions

The daily job runs as an Azure Functions Timer Trigger, separate from the backend process.

### Deploy

```bash
# From repo root
func azure functionapp publish <your-function-app-name>
```

Or use the GitHub Actions workflow in `.github/workflows/` which deploys on push to `main`.

### Environment variables (set in Azure Function App → Configuration)

```env
DEEPSEEK_API_KEY=
MONGODB_URI=
ADMIN_SECRET=
SCHEDULER_ENABLED=true
JOB_TIME=05:00          # UTC time HH:MM, e.g. 05:00 = 10:30 IST
NODE_ENV=production
```

### Timer schedule

The trigger fires at the time specified by `JOB_TIME`. Default is `05:00 UTC` (10:30 AM IST). Modify the cron expression in `src/functions/timerTrigger.js` or the Azure portal if you change `JOB_TIME`.

### Job lock

The job uses a MongoDB-based distributed lock (`src/models/Lock.js`) with a 1-hour TTL. If the job crashes and leaves the lock held, release it via:

```bash
curl -X POST https://your-backend.onrender.com/api/admin/release-lock \
  -H "x-admin-key: YOUR_ADMIN_SECRET"
```

---

## MongoDB Atlas

1. Create free cluster at mongodb.com/cloud/atlas
2. Database Access → create user with `readWrite` on `upsc-ai` database
3. Network Access → add `0.0.0.0/0` (or restrict to Render/Azure outbound IPs)
4. Connect → Drivers → copy connection string → replace `<password>`

---

## CI/CD

GitHub Actions workflow (`.github/workflows/`) handles:
- On push to `main`: deploy to Azure Function App

Backend (Render) and frontend (Vercel) auto-deploy from their own GitHub integrations.

---

## Smoke test after deploy

```bash
# Backend health
curl https://your-backend.onrender.com/health

# Today's data
curl https://your-backend.onrender.com/api/today | jq '.topics | length'

# Frontend proxy (via Vercel)
curl https://your-vercel-domain.vercel.app/api/proxy/api/today | jq '.topics | length'

# Admin status
curl https://your-backend.onrender.com/api/admin/status \
  -H "x-admin-key: YOUR_ADMIN_SECRET"
```
