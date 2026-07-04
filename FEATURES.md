# Features & API Reference

## Frontend Pages

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

**Sources scraped (in priority order / interleave ratio 3:2:2:1):**
- Drishti IAS (News Analysis + Editorials) — CA coaching content
- Insights IAS — CA coaching content
- PIB — Press Information Bureau English RSS (20 releases/day, with ministry tag); fetches via `PressReleaseIframePage.aspx` for full text. Each item tagged `source: "PIB - <Ministry Name>"`
- Vision IAS (Daily Summary: The Hindu, IE, ET, Business Standard)
- Vajiram & Ravi (Mains + Prelims)
- Vision IAS subject pages 1–15 (via Puppeteer)
- RSS: Indian Express, The Hindu National, The Hindu International

> **PIB note:** PIB is behind Akamai CDN. The scraper uses a dedicated `fetchPIBUrl()` with Chrome browser headers and `Referer: https://www.pib.gov.in/` to bypass bot detection. The generic `fetchUrl()` (bot UA) is blocked.

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
