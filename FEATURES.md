# Features & API Reference

## Web Frontend Pages

| Route | Description |
|---|---|
| `/` | Dashboard — today's top topics, case studies, MCQs |
| `/current-affairs` | Full topic listing for today |
| `/topic/[id]` | Topic detail — prelims facts, MCQ, mains question + answer framework |
| `/history` | Calendar view of all past entries |
| `/insights` | Signal deck — trends, recurring themes, exam strategy |
| `/intel-canvas` | Visual knowledge map |
| `/core` / `/core-results` | Core exam prep module |
| `/admin` | Job status, lock management |
| `/login` | Google OAuth sign-in |

All pages are auth-gated (Google OAuth via Firebase). Set `NEXT_PUBLIC_DISABLE_OAUTH_LOCAL=true` to bypass locally.

Topic cards and detail pages display source attribution as amber pills (e.g. "Drishti IAS - News Analysis", "PIB - Ministry of Finance"). History, home, and topic pages use client-side caching for faster navigation.

---


## Mobile App (Android)

Expo + React Native app (`mobile/`) targeting Android, distributed via Google Play Store.

### Screens

| Screen | Description |
|---|---|
| Welcome / Login | Google Sign-In; receives JWT from backend |
| Feed (Home tab) | Today's topics via FlashList, pull-to-refresh, auto read-tracking |
| Topic Detail | Full topic data — key points, prelims facts, MCQ, mains framework, sources |
| History | Paginated reading history, client-side search |
| Search | Full-text search across cached topic data |
| Bookmarks | Saved topics with optimistic UI updates |
| MCQ Practice | Answer selection with reveal and colour-coded feedback |
| Insights | Daily signal deck — trends, strategy, exam focus areas |
| Settings | Theme toggle (light/dark), logout |

### Architecture

- **State**: Zustand stores — auth (in-memory), theme + offline cache tracker (MMKV-persisted)
- **Data fetching**: TanStack Query with MMKV-backed query persistence (offline reads work after first load)
- **Tokens**: JWT access + refresh stored in `expo-secure-store`; silent refresh interceptor on Axios client
- **Navigation**: React Navigation — Root → Auth stack / Tab stack (Feed, History, Search, Bookmarks, Insights) + feature stacks
- **Notifications**: `expo-notifications` + FCM push token registered to backend on login

---

## API Endpoints

Base URL: `https://your-backend.onrender.com`  
Frontend proxy base: `https://your-vercel-domain.vercel.app/api/proxy`

### Public

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/today` | Today's entry (topics, case studies, MCQs, insights) |
| GET | `/api/history` | All entries, paginated (`?limit=20&skip=0`) |
| GET | `/api/date/:date` | Entry for a specific date (`YYYY-MM-DD`) |
| GET | `/api/insights` | Latest signal deck |
| GET | `/api/insights/monthly` | List of monthly insight reports |
| GET | `/api/insights/monthly/:month` | Specific monthly report (`YYYY-MM`) |
| GET | `/api/topic/:id` | Single topic by ID |

### Auth (mobile JWT — no Firebase required)

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/auth/google` | `{ idToken }` | Verify Google ID token → issue JWT pair |
| POST | `/api/auth/apple` | `{ identityToken, fullName?, email? }` | Verify Apple identity token → issue JWT pair |
| POST | `/api/auth/refresh` | `{ refreshToken }` | Rotate refresh token → new JWT pair |
| POST | `/api/auth/logout` | `{ refreshToken }` | Invalidate refresh token |

JWT access tokens expire in 15 minutes; refresh tokens in 30 days. Pass access token as `Authorization: Bearer <token>` on protected routes.

### User (requires `Authorization: Bearer <accessToken>`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/user/me` | Current user profile |
| GET | `/api/user/bookmarks` | All bookmarked topic IDs with dates |
| POST | `/api/user/bookmarks/:topicId` | Bookmark a topic (`{ date: "YYYY-MM-DD" }`) |
| DELETE | `/api/user/bookmarks/:topicId` | Remove a bookmark |
| GET | `/api/user/history` | Reading history, paginated (`?page=1&limit=20`) |
| POST | `/api/user/history` | Record a topic read (`{ topicId, date }`) |
| POST | `/api/user/push-token` | Register an Expo push token (`{ token }`) |
| DELETE | `/api/user/push-token` | Unregister a push token (`{ token }`) |

### Admin (requires `x-admin-key: YOUR_ADMIN_SECRET` header)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/status` | Scheduler and job lock status |
| POST | `/api/admin/stop` | Stop the in-process scheduler |
| POST | `/api/admin/release-lock` | Force-release a stuck job lock |
| POST | `/api/admin/run` | Trigger daily job immediately (`{ "date": "YYYY-MM-DD" }`) |
| POST | `/api/admin/patch-case-studies` | Regenerate case studies for a date |

---

## Data Schemas

### Topic

```json
{
  "id": "india-china-border-talks",
  "type": "topic",
  "title": "India-China Border Talks Resume",
  "category": "IR",
  "importance": "HIGH",
  "score": 88,
  "summary": "Two-sentence what + why for UPSC.",
  "why_in_news": "Single trigger event sentence.",
  "keyPoints": ["• point ≤15 words"],
  "backgroundContext": ["• historical/policy backdrop"],
  "editorialInsights": ["• critical analysis angle"],
  "interlinkages": ["• link to other GS area"],
  "explanation": "• point1\n• point2\n• point3",
  "facts": ["static fact1", "static fact2"],
  "tags": ["GS-2", "international-relations"],
  "sources": ["Drishti IAS - News Analysis", "PIB - Ministry of External Affairs"],
  "prelims": {
    "key_facts": ["fact1", "fact2", "fact3"],
    "mcq": {
      "question": "Full question ≥15 words?",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "B"
    }
  },
  "mains": {
    "gs_paper": "GS-2",
    "question": "Analytical exam-style question ≥15 words.",
    "answer_framework": {
      "intro": "One sentence.",
      "body": ["pt1 ≥10 words", "pt2", "pt3"],
      "conclusion": "One sentence."
    }
  },
  "revision_note": "≤50 word compact summary for revision."
}
```

> **`sources`** — array of scraper source names that contributed to this topic. Populated by the AI from the `src` field of input news items. Absent on entries generated before this field was added (pre-July 2026). Displayed as amber pills on topic cards, list rows, and the topic detail page.

### Case Study

```json
{
  "title": "Descriptive case study title",
  "context": "3-4 sentence historical/policy backdrop.",
  "problem": "2-3 sentence core governance challenge.",
  "intervention": "2-3 sentence policy/judicial/legislative action.",
  "outcome": "2-3 sentence result and remaining challenges.",
  "learningPoints": [
    "• Exam-ready governance lesson",
    "• Second lesson",
    "• Third lesson"
  ],
  "mainsAngle": {
    "gs_paper": "GS-2",
    "question": "Exam-style question this case study answers.",
    "answer_hint": "2-3 sentence model answer outline."
  },
  "tags": ["GS-2", "governance", "keyword"]
}
```

### MCQ

```json
{
  "question": "Complete question ≥15 words?",
  "options": ["A. option", "B. option", "C. option", "D. option"],
  "answer": "C",
  "explanation": "1-2 sentence explanation.",
  "topic": "related-topic-id"
}
```

### User

```json
{
  "uid": "google-sub-or-apple-sub",
  "provider": "google",
  "email": "user@example.com",
  "displayName": "Prashant Raj",
  "photoUrl": "https://...",
  "bookmarks": [
    { "topicId": "india-china-border-talks", "date": "2026-07-18", "savedAt": "2026-07-18T..." }
  ],
  "readingHistory": [
    { "topicId": "india-china-border-talks", "date": "2026-07-18", "readAt": "2026-07-18T..." }
  ],
  "pushTokens": ["ExponentPushToken[xxxxxx]"]
}
```

`readingHistory` is capped at the latest 500 entries. `pushTokens` uses `$addToSet` so duplicate tokens are ignored.

### Signal Deck (Insights)

```json
{
  "trends": ["emerging trend across today's topics"],
  "recurringThemes": ["theme appearing across multiple topics"],
  "highFrequencyTopics": ["topic that frequently appears in UPSC"],
  "strategyNotes": ["specific exam strategy note"],
  "highPriorityDomains": ["GS domain"],
  "editorialPatterns": ["recurring analytical framework seen today"]
}
```

---

## AI Pipeline

Three-pass batched pipeline runs daily:

```
[fetchNews] → up to 80 deduplicated items
     ↓
Pass 1: Topic extraction
  deepseek-chat, batches of 12 (parallel)
  → mergeTopics() deduplicates across batches by sorted-word title key
     ↓
Pass 2 + 3 (parallel):
  Pass 2: Case studies — deepseek-reasoner (single call, all topics as input)
  Pass 3a: MCQs — deepseek-chat
  Pass 3b: Signal deck — deepseek-chat
     ↓
[saveEntry] → MongoDB
```

**Sources scraped (interleave ratio 3 CA : 2 PIB : 2 Subject : 1 RSS per round):**

| Source | Tag prefix | Notes |
|---|---|---|
| Drishti IAS — News Analysis | `Drishti IAS - News Analysis` | Date-specific URL |
| Drishti IAS — Editorials | `Drishti IAS - Editorials` | Date-specific URL |
| Insights IAS | `Insights IAS` | Date-specific URL |
| PIB (Press Information Bureau) | `PIB - <Ministry Name>` | English RSS → 20 releases/day; `PressReleaseIframePage.aspx` for HTML text. Uses `fetchPIBUrl()` with Chrome UA + Referer to bypass Akamai CDN |
| Vision IAS — Daily Summary | `Vision IAS - Daily Summary` | |
| Vision IAS — The Hindu / IE / ET / BS | `Vision IAS - <Paper>` | |
| Vision IAS — Subject pages 1–15 | `Vision IAS - Subject N` | Puppeteer-rendered |
| Vajiram & Ravi — Mains | `Vajiram & Ravi - Mains` | Date-specific URL |
| Vajiram & Ravi — Prelims | `Vajiram & Ravi - Prelims` | Date-specific URL |
| Indian Express RSS | `Indian Express` | Always-current |
| The Hindu — National RSS | `The Hindu - India` | Always-current |
| The Hindu — International RSS | `The Hindu - World` | Always-current |

Source tags flow: scraper `source` field → AI sees as `src` in compressed input → AI returns `sources[]` on each topic → saved to MongoDB → displayed as amber pills on topic cards and detail page.

**Deduplication layers:**
1. `fetchNews`: sorted-word title key removes cross-source duplicates before AI sees them
2. `splitIntoBatches`: same key prevents same item entering multiple batches
3. `mergeTopics`: order-invariant key merges LLM variants across batches
4. `deduplicateCaseStudies`: post-generation dedup by title
5. Prompt-level: case study system prompt enforces distinct policy domains per study

---

## Job Lock

Prevents concurrent or duplicate daily runs. Stored in MongoDB `locks` collection with 1-hour TTL.

- Auto-acquired at job start, released on completion or failure
- If lock hangs after a crash: `POST /api/admin/release-lock`
- Check status: `GET /api/admin/status`
