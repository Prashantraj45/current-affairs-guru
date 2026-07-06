# Current Affairs Guru — React Native Mobile App Design

**Date:** 2026-07-06  
**Status:** Approved  
**Scope:** Production-ready Android + iOS app using Expo + React Native + TypeScript

---

## 1. Context & Constraints

### Existing Stack
- **Backend:** Node.js/Express on Render, MongoDB (Mongoose), port 3000
- **Web frontend:** Next.js 14 on Vercel, Firebase Google Auth (client-side only, currently disabled via env var)
- **Scheduler:** Azure Functions Timer Trigger — runs daily content generation
- **Cache:** Cloudflare KV via Next.js proxy (`/api/proxy/[...path]`)
- **Accounts available:** Expo EAS, Firebase project

### Key Constraints
- Backend has **zero auth infrastructure** today — no JWT, no User model, no `/api/auth/*` routes
- All public API routes are unauthenticated and must remain so (web depends on them)
- Apple Developer Program ($99/yr) and Google Play Developer ($25) accounts **not yet purchased** — required before store submission and before Sign in with Apple can be configured
- Web auth stays on Firebase — mobile gets its own backend JWT flow; the two coexist
- Mobile calls the backend **directly** — not through the Next.js/Cloudflare KV proxy

---

## 2. Monorepo Structure

```
current-affairs-guru/
├── src/                        ← backend (Node.js/Express) — minimal additions
├── frontend/                   ← Next.js web — untouched
├── shared/                     ← NEW: TypeScript API contract types only
│   ├── types/
│   │   ├── topic.ts
│   │   ├── entry.ts
│   │   ├── auth.ts
│   │   ├── insights.ts
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json            ← name: "@cag/shared", private: true
└── mobile/                     ← NEW: Expo React Native app
    ├── src/
    │   ├── features/
    │   │   ├── auth/
    │   │   ├── feed/
    │   │   ├── topic/
    │   │   ├── search/
    │   │   ├── history/
    │   │   ├── bookmarks/
    │   │   ├── mcq/
    │   │   └── settings/
    │   ├── navigation/
    │   ├── services/
    │   │   ├── api/
    │   │   ├── storage/
    │   │   ├── auth/
    │   │   └── notifications/
    │   ├── store/
    │   ├── components/
    │   ├── hooks/
    │   ├── config/
    │   └── lib/
    ├── assets/
    ├── app.json
    ├── eas.json
    ├── tsconfig.json
    └── package.json
```

**Sharing rule:** Only TypeScript type definitions are shared via `shared/`. No runtime code is shared. The web and mobile have different bundlers (webpack/Next.js vs Metro) — sharing executable code requires workspace plumbing that is not justified at this stage.

### Feature Folder Anatomy

Every feature follows the same internal structure:

```
features/feed/
├── screens/
│   ├── FeedScreen.tsx
│   └── FeedScreen.styles.ts
├── components/
│   ├── TopicCard.tsx
│   ├── TopicRow.tsx
│   └── FeedSkeleton.tsx
├── hooks/
│   ├── useFeed.ts              ← TanStack Query + business logic
│   └── useFeedFilters.ts
├── repository/
│   └── feedRepository.ts      ← abstracts network vs offline cache
└── types.ts                   ← extends shared/ types where needed
```

---

## 3. Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Expo Managed Workflow | No native code maintenance; EAS handles builds |
| Language | TypeScript (strict) | Type safety across monorepo |
| Navigation | React Navigation 6 | Explicit, well-understood, industry standard |
| Server state | TanStack Query v5 | Caching, pagination, background refetch |
| UI state | Zustand | Minimal boilerplate, synchronous reads |
| Networking | Axios | Interceptors for token refresh, consistent with web |
| Persistence | MMKV | 10-30× faster than AsyncStorage, synchronous reads |
| Lists | FlashList | RecyclerView-based, 5-10× faster than FlatList |
| Animation | React Native Reanimated 3 | JS-thread-free animations |
| Gestures | React Native Gesture Handler | Required by Reanimated + navigation |
| Push | Expo Notifications + FCM/APNs | Unified API across platforms |
| Env config | react-native-config | Native env injection (not process.env) |
| Auth — Google | @react-native-google-signin/google-signin | Native SDK, not WebView |
| Auth — Apple | expo-apple-authentication | Apple-mandated native flow |

---

## 4. Backend Changes

### 4.1 New Routes

```
POST /api/auth/google          ← verify Google ID token → issue app JWT
POST /api/auth/apple           ← verify Apple ID token  → issue app JWT
POST /api/auth/refresh         ← rotate refresh token
POST /api/auth/logout          ← invalidate refresh token

GET  /api/user/me              ← authenticated: get profile
POST /api/user/bookmarks/:id   ← add bookmark
DELETE /api/user/bookmarks/:id ← remove bookmark
GET  /api/user/bookmarks       ← list bookmarks
POST /api/user/history         ← record article read
GET  /api/user/history         ← paginated reading history

POST /api/user/push-token      ← register Expo push token
DELETE /api/user/push-token    ← unregister on logout
```

All existing public routes (`/api/today`, `/api/history`, `/api/date/:date`, `/api/insights`, `/api/topic/:id`) remain public and unchanged.

### 4.2 New MongoDB Model: User

```js
// src/models/User.js
{
  uid: String,                  // provider's unique ID (Google sub / Apple sub)
  provider: String,             // 'google' | 'apple'
  email: String,
  displayName: String,
  photoUrl: String,
  refreshTokenHash: String,     // bcrypt hash — one valid token per user
  pushTokens: [String],         // Expo push tokens (multi-device)
  bookmarks: [{
    topicId: String,
    date: String,               // YYYY-MM-DD — needed to fetch topic detail
    savedAt: Date,
  }],
  readingHistory: [{
    topicId: String,
    date: String,
    readAt: Date,
  }],
  createdAt: Date,
  updatedAt: Date,
}
```

### 4.3 JWT Strategy

- **Access token:** 15-minute expiry, signed with `JWT_SECRET`, payload `{ uid, email }`
- **Refresh token:** 30-day expiry, stored as bcrypt hash on the User document
- Rotating refresh: issuing a new access token also issues a new refresh token and invalidates the old one
- Refresh token is **never returned in the response body on its own** — always paired with a new access token

### 4.4 New npm Dependencies (backend)

```
google-auth-library   ← verify Google ID tokens
jsonwebtoken          ← sign/verify app JWTs
bcryptjs              ← hash refresh tokens
apple-signin-auth     ← verify Apple ID tokens (uses Apple's public JWKS endpoint)
@expo/server-sdk      ← send push notifications via Expo Push API
```

### 4.5 CORS Update

Add `Authorization` to allowed headers:

```js
res.header('Access-Control-Allow-Headers',
  'Content-Type, x-admin-key, Authorization');
```

### 4.6 Push Notification Integration in Daily Job

`src/jobs/dailyJob.js` gets a new step after AI generation completes:

```js
await sendDailyPushNotifications({ date, topicCount });
// → queries all User.pushTokens
// → POST to Expo Push API in batches of 100
// → payload: { title: "Today's Current Affairs", body: `${topicCount} topics ready`, data: { url: 'cag://feed' } }
```

---

## 5. Authentication Flow

### Google Sign-In

```
1. App: @react-native-google-signin/google-signin SDK
2. Native Google account picker shown
3. SDK returns { idToken }
4. App: POST /api/auth/google { idToken }
5. Backend: verifyIdToken() via google-auth-library
6. Backend: upsert User by uid
7. Backend: return { accessToken, refreshToken, user }
8. App: persist tokens via expo-secure-store (iOS Keychain / Android Keystore on both platforms)
9. Zustand authStore hydrated in memory → AppNavigator renders
```

### Sign in with Apple

```
1. App: expo-apple-authentication SDK
2. Native Apple sheet shown
3. SDK returns { identityToken, fullName, email }
   ⚠ Apple sends fullName + email ONLY on first sign-in ever.
     Store them immediately before POST.
4. App: POST /api/auth/apple { identityToken, fullName, email }
5. Backend: verify identityToken against Apple's JWKS
6. Backend: upsert User (use stored name/email if Apple omits on repeat sign-in)
7. Same token issuance as Google from step 7 above
```

**Apple Sign-In is required on iOS** whenever a third-party OAuth provider is offered. This cannot be shipped without an Apple Developer account.

### Token Lifecycle

```
App start
  → show splash screen
  → read tokens from expo-secure-store (async, ~10ms)
  → hydrate Zustand authStore in memory
  → if accessToken not expired → render AppNavigator immediately
  → if accessToken expired → POST /api/auth/refresh silently
  → if refresh fails (token > 30 days old) → clearAuth() → AuthNavigator

Runtime 401
  → Axios response interceptor catches 401
  → Refresh is serialized via a promise lock (prevents parallel refresh races)
  → Original request retried with new token
  → If refresh also 401s → clearAuth() → user sees login screen
```

---

## 6. Navigation Architecture

```
RootNavigator (Stack)
├── AuthNavigator (Stack)
│   ├── WelcomeScreen
│   └── LoginScreen
│
└── AppNavigator (Bottom Tabs)
    ├── Tab: Home (Stack)
    │   ├── FeedScreen            ← today's topics, FlashList
    │   └── TopicDetailScreen
    │
    ├── Tab: Discover (Stack)
    │   ├── SearchScreen
    │   ├── CategoriesScreen
    │   └── TopicDetailScreen
    │
    ├── Tab: Practice (Stack)
    │   ├── MCQScreen
    │   ├── CaseStudiesScreen
    │   └── InsightsScreen
    │
    ├── Tab: History (Stack)
    │   ├── HistoryScreen
    │   └── TopicDetailScreen
    │
    └── Tab: Profile (Stack)
        ├── ProfileScreen
        ├── BookmarksScreen
        ├── ReadingHistoryScreen
        └── SettingsScreen
```

**Deep link scheme:** `cag://`  
Examples: `cag://topic/:id?date=YYYY-MM-DD`, `cag://feed`, `cag://practice`

---

## 7. State Management

### Zustand (global app state — in-memory, hydrated from expo-secure-store on boot)

```ts
// store/authStore.ts
// Tokens are in memory only — persisted to expo-secure-store, never to MMKV
{ user, accessToken, refreshToken, isAuthenticated, setTokens, clearAuth }

// store/themeStore.ts
{ theme: 'light' | 'dark' | 'system', setTheme }

// store/offlineStore.ts
{ cachedDates: string[], lastSyncAt: string, markCached, isCached }
```

Zustand stores are persisted via `zustand/middleware`'s `persist` with a custom MMKV storage adapter.

### TanStack Query (server state — async, cached)

```ts
useFeed()                → GET /api/today
useTopicDetail(id, date) → GET /api/topic/:id?date=...
useHistory(filters)      → GET /api/history (infinite scroll)
useBookmarks()           → GET /api/user/bookmarks
useMCQs()               → derived from useFeed() → mcqs field
useInsights()            → GET /api/insights
useMonthlyInsights(m)    → GET /api/insights/monthly/:month
useSearch(query)         → client-side filter over history cache (v1; server-side search endpoint added in v2)
```

**TanStack Query config:**
- `staleTime`: 6 hours for feed (content updates once daily)
- `gcTime`: 7 days (keeps one week offline)
- `persistQueryClient` with MMKV adapter (offline persistence)
- `retry`: 2 attempts with exponential backoff
- `refetchOnReconnect`: true

### MMKV (local persistence)

```ts
// services/storage/mmkv.ts
const storage = new MMKV({ id: 'cag-storage' });

// Usage:
// 1. Zustand persistence adapter (theme, offlineStore — NOT auth tokens)
// 2. TanStack Query persistence (query cache)
// 3. Explicit offline article snapshots (keyed by topicId)
// 4. User preferences not covered by Zustand
// Auth tokens (accessToken, refreshToken) go to expo-secure-store, not MMKV
```

---

## 8. Networking Layer

```ts
// services/api/client.ts
const apiClient = axios.create({
  baseURL: Config.API_URL,  // react-native-config
  timeout: 15000,
});

// Request: attach access token
apiClient.interceptors.request.use((config) => {
  const { accessToken } = authStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Response: silent token refresh on 401
let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;
    // Serialize: reuse in-flight refresh rather than firing N parallel requests
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    authStore.getState().setTokens({ accessToken: newToken });
    error.config.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(error.config);
  }
  return Promise.reject(error);
});
```

---

## 9. Offline & Push Notifications

### Offline Strategy

| Content type | Strategy | TTL |
|---|---|---|
| Today's feed | `persistQueryClient` auto-cache | Until midnight IST |
| Topic detail | `persistQueryClient` auto-cache | 7 days |
| Bookmarked topics | Explicit prefetch on bookmark action | No expiry |
| History list | `persistQueryClient` | 7 days |

`@react-native-community/netinfo` monitors connectivity. When offline, a non-blocking banner is shown. All cached content is readable. Write operations (bookmark, history) are queued and replayed on reconnect using TanStack Query's `onMutate`/`onError` pattern for optimistic updates.

### Push Notifications

- **Registration:** on first login, `expo-notifications` requests permission → Expo push token fetched → `POST /api/user/push-token`
- **Deregistration:** `DELETE /api/user/push-token` on logout
- **Sending:** backend daily job calls Expo Push API after content generation
- **Routing:** notification `data.url` is handled by React Navigation's `useURL` hook → navigates to the correct screen

---

## 10. Environment Configuration

```
mobile/.env.development    API_URL=http://localhost:3000
mobile/.env.staging        API_URL=https://staging-api.render.com
mobile/.env.production     API_URL=https://your-api.render.com
```

Loaded via `react-native-config`. Production values are stored as EAS secrets — never committed to git.

```json
// mobile/app.json (Expo config)
{
  "expo": {
    "name": "Current Affairs Guru",
    "slug": "current-affairs-guru",
    "scheme": "cag",
    "ios": { "bundleIdentifier": "com.YOURNAME.currentaffairsguru" },  // choose before first build
    "android": { "package": "com.YOURNAME.currentaffairsguru" },       // must match Play Console
    "plugins": [
      "@react-native-google-signin/google-signin",
      "expo-apple-authentication",
      "expo-notifications"
    ]
  }
}
```

---

## 11. CI/CD — GitHub Actions + EAS

```yaml
# .github/workflows/mobile.yml
on:
  push:
    branches: [main]
  push:
    tags: ['v*.*.*']

jobs:
  check:
    - tsc --noEmit (mobile/)
    - eslint + prettier
    - jest (unit tests)

  eas-preview:          # on push to main
    - eas build --profile preview --platform all
    # produces internal APK (Android) + IPA (iOS) for testing

  eas-production:       # on version tag v*.*.*
    - eas build --profile production --platform all
    - eas submit --platform all
    # auto-submits to Play Store (track: internal) and App Store (TestFlight)
```

**EAS profiles (`mobile/eas.json`):**

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": { "serviceAccountKeyPath": "./service-account.json", "track": "internal" },
      "ios": { "appleId": "PLACEHOLDER", "ascAppId": "PLACEHOLDER" }
    }
  }
}
```

---

## 12. Store Submission Prerequisites

| Requirement | Android | iOS |
|---|---|---|
| Developer account | $25 one-time (not yet purchased) | $99/yr (not yet purchased) |
| App signing | EAS manages keystore | EAS manages certificates |
| Privacy policy URL | Required | Required |
| App icon (1024×1024 PNG) | Required | Required |
| Feature graphic (1024×500) | Required | — |
| Screenshots | 2+ per form factor | 3+ per device type |
| Sign in with Apple capability | N/A | Mandatory (3rd-party OAuth present) |
| APNs push certificate | N/A | Required for push notifications |

**Recommended order:**
1. Purchase Apple Developer account
2. Purchase Google Play Developer account
3. Configure app identifier + Sign in with Apple capability in Apple Developer portal
4. Configure OAuth client ID for iOS in Google Cloud Console
5. Add all secrets to EAS
6. Run first `eas build --profile preview`
7. Test on physical devices via EAS internal distribution
8. Run `eas build --profile production` + `eas submit`

---

## 13. Extensibility Notes

The feature-folder architecture is designed to accommodate future additions without structural changes:

| Future feature | How it fits |
|---|---|
| AI chat | `features/chat/` — new tab, websocket service in `services/` |
| Mock tests / quizzes | `features/quizzes/` — extends `features/mcq/` patterns |
| Premium subscriptions | `features/premium/` — paywall HOC wraps any screen |
| Widgets (iOS/Android) | Expo Widgets plugin — reads from same MMKV storage |
| Multilingual | i18next + `services/i18n/` — all strings behind translation keys |

---

## 14. Out of Scope (v1)

- Web frontend changes (auth stays on Firebase)
- Admin panel on mobile
- Social features (comments, sharing)
- AI chat
- Paid subscriptions
- Widgets
- Multilingual support
