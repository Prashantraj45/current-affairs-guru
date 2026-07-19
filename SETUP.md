# Local Development Setup

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- DeepSeek API key
- Firebase project (for Google auth on web)
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

# Mobile auth (Google Sign-In token verification)
GOOGLE_CLIENT_ID=your-google-oauth-client-id

# JWT secrets (generate two separate random hex strings)
JWT_ACCESS_SECRET=your-64-char-access-secret
JWT_REFRESH_SECRET=your-64-char-refresh-secret
```

### 3. Start

```bash
npm start        # production mode
npm run dev      # nodemon auto-reload
npm run job      # run daily job once manually
```

API runs on `http://localhost:3000`.

---

## Frontend (Web)

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

## Mobile App (Android)

The mobile app is a React Native (Expo-managed) Android app in `mobile/`. It uses native builds only — **Expo Go is not supported** due to native modules (Google Sign-In, MMKV, Reanimated).

### Prerequisites

- Node.js 18+
- Android Studio with Android SDK and an emulator (API 34+) or physical Android device with USB debugging enabled
- Java (bundled with Android Studio at `/Applications/Android Studio.app/Contents/jbr`)

Ensure `~/.zshrc` (or `~/.bashrc`) contains:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

### 1. Install dependencies

```bash
cd mobile && npm install --legacy-peer-deps
```

### 2. Create `mobile/.env`

```env
# Backend API URL — use your machine's LAN IP (not localhost) so the emulator/device can reach it
API_URL=http://192.168.x.x:3001

# Google OAuth Web Client ID (Web application type from Google Cloud Console)
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

> Get your LAN IP: `ipconfig getifaddr en0`

### 3. Configure Google Sign-In

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an **Android** OAuth 2.0 Client ID:
   - Package name: `com.civil.currentaffairsguru`
   - SHA-1: run `cd mobile/android && ./gradlew signingReport` and copy the debug SHA-1
3. Create a **Web application** OAuth 2.0 Client ID (no redirect URIs needed)
4. Put the **Web application** client ID in `mobile/.env` as `GOOGLE_WEB_CLIENT_ID`

### 4. Create `mobile/android/local.properties`

```
sdk.dir=/Users/<your-username>/Library/Android/sdk
```

### 5. Build and run (native debug build)

```bash
cd mobile
npx expo run:android
```

First build takes 5–10 minutes (Gradle). Subsequent runs are faster via Metro hot-reload.

### 6. Build a release APK

```bash
cd mobile
eas build --profile preview --platform android --local
```

---

## Running the daily job locally

```bash
npm run job
```

Fetches news for yesterday (UTC), runs the AI pipeline, saves to MongoDB. Takes 2–5 minutes.

---

## Security

- Never commit `.env`, `frontend/.env.local`, `mobile/.env`, or `mobile/service-account.json` — all are in `.gitignore`
- `ADMIN_SECRET` is used only via `x-admin-key` header; never expose on the frontend
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be long random secrets — never reuse between environments
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
| Mobile can't reach backend | Use machine LAN IP (not `localhost`) in `mobile/.env` `API_URL` |
| Google Sign-In DEVELOPER_ERROR | Ensure Android OAuth client exists in GCP with correct package name + SHA-1; `GOOGLE_WEB_CLIENT_ID` must be Web application type, not Android |
| `GOOGLE_CLIENT_ID not configured` | Add to backend `.env` — required for mobile JWT auth |
| Expo Go incompatible | App uses native modules — must use `npx expo run:android`, not Expo Go |
