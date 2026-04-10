# Full-Stack Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the AI prompt, MongoDB schema, backend APIs, and frontend pages into a single coherent data contract so data flows directly from DeepSeek → DB → API → UI with no transformation gaps.

**Architecture:** The AI generates a canonical JSON contract stored verbatim in MongoDB. The API reshapes minimal fields for frontend consumption (field-name normalization only). The frontend consumes API responses directly with no client-side transformation.

**Tech Stack:** Node.js/Express, MongoDB/Mongoose, Next.js 14/React, DeepSeek via OpenAI SDK, Tailwind CSS

---

## Canonical Data Contract (reference for all tasks)

### Topic shape (stored in Entry.topics[])
```json
{
  "id": "climate-pact-asean",
  "title": "India-ASEAN Climate Pact",
  "category": "Environment",
  "importance": "HIGH",
  "score": 85,
  "summary": "2-3 sentence human-readable overview.",
  "why_in_news": "One sentence trigger event.",
  "explanation": "• Bullet point 1\n• Bullet point 2\n• Bullet point 3",
  "facts": ["Fact 1", "Fact 2", "Fact 3"],
  "tags": ["GS-3", "Environment", "International Relations"],
  "prelims": {
    "key_facts": ["Fact A", "Fact B", "Fact C"],
    "mcq": { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A" }
  },
  "mains": {
    "gs_paper": "GS-3",
    "question": "Examine the significance of...",
    "answer_framework": { "intro": "...", "body": ["Point 1", "Point 2", "Point 3"], "conclusion": "..." }
  },
  "revision_note": "50-word compact summary for last-minute revision."
}
```

### Insights shape (stored in Entry.insights + Memory)
```json
{
  "trends": ["Trend 1", "Trend 2", "Trend 3"],
  "recurringThemes": ["Theme 1", "Theme 2"],
  "strategyNotes": ["Strategy note 1", "Strategy note 2"],
  "highPriorityDomains": ["Environment", "Polity", "Economy"]
}
```

### API response shapes
- `GET /api/today` → `{ date, topics[], insights }`
- `GET /api/history` → `{ total, entries: [{ date, topicCount, topics: [{ id, title, category, importance }] }] }`
- `GET /api/date/:date` → `{ date, topics[], insights }`
- `GET /api/topic/:id?date=YYYY-MM-DD` → `topic object`
- `GET /api/insights` → `insights object` (from Memory)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/prompts/upsc_prompt.txt` | Modify | AI output contract definition |
| `src/claude/providers/deepseek.js` | Modify | Schema hint + max_tokens bump |
| `src/models/Entry.js` | Modify | Add facts/tags/summary/importance/insights fields |
| `src/db/db.js` | Modify | Add history projection query |
| `src/api/server.js` | Modify | Fix /api/insights, /api/topic/:id, /api/today shape |
| `frontend/pages/index.js` | Modify | Use new fields (importance, summary, facts, tags) |
| `frontend/pages/topic/[id].js` | Modify | Use new fields + date param in API call |
| `frontend/pages/history.js` | Modify | Link topics with ?date= param |
| `frontend/pages/insights.js` | Modify | Use renamed fields (trends, recurringThemes, strategyNotes) |
| `frontend/pages/_app.js` | Modify | Nav active states + layout polish |

---

## Task 1: Update AI Prompt and DeepSeek Schema

**Files:**
- Modify: `src/prompts/upsc_prompt.txt`
- Modify: `src/claude/providers/deepseek.js`

- [ ] **Step 1: Rewrite `src/prompts/upsc_prompt.txt`**

Replace entire file with:

```text
You are a UPSC current affairs analyst.
Return ONLY valid JSON. No text outside JSON.
High signal only. Max 5 topics.

TOPIC RULES:
- Reject: political noise, celebrity, low conceptual value
- Prioritize: Environment/Climate, Polity, Economy, IR, Science/Tech, Reports
- Merge similar topics aggressively
- Each explanation: bullet points only, ≤60 words

OUTPUT SCHEMA:
{
  "topics": [
    {
      "id": "kebab-case-slug",
      "title": "Sharp scannable title",
      "category": "Environment|Polity|Economy|IR|Science|Reports",
      "importance": "HIGH|MEDIUM|LOW",
      "score": 0-100,
      "summary": "2-3 sentence overview of topic and its UPSC relevance",
      "why_in_news": "One sentence trigger event",
      "explanation": "• point1\n• point2\n• point3",
      "facts": ["static fact 1", "static fact 2", "static fact 3"],
      "tags": ["GS paper", "syllabus area", "keyword"],
      "prelims": {
        "key_facts": ["fact1", "fact2", "fact3"],
        "mcq": {"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A"}
      },
      "mains": {
        "gs_paper": "GS-1|GS-2|GS-3",
        "question": "Exam-style question",
        "answer_framework": {"intro": "1 sentence", "body": ["point1", "point2", "point3"], "conclusion": "1 sentence"}
      },
      "revision_note": "Compact summary ≤50 words"
    }
  ],
  "insights": {
    "trends": ["trend1", "trend2", "trend3"],
    "recurringThemes": ["theme1", "theme2"],
    "strategyNotes": ["note1", "note2"],
    "highPriorityDomains": ["domain1", "domain2", "domain3"]
  }
}
```

- [ ] **Step 2: Update schema hint and max_tokens in `src/claude/providers/deepseek.js`**

Find the `userPrompt` array in `callDeepSeek`. Replace the `Return JSON schema:` line with:

```js
`Analyze these news for UPSC. Return JSON with "topics" (max 5, HIGH signal only) and "insights" (trends/recurringThemes/strategyNotes/highPriorityDomains arrays).`
```

Change `max_tokens: 2000` to `max_tokens: 3000`.

Full updated `callDeepSeek` function:

```js
export async function callDeepSeek(compressedNews, compressedMemory) {
  const client = getClient();
  const today = new Date().toISOString().split('T')[0];

  const userPrompt = [
    `DATE: ${today}`,
    `NEWS: ${JSON.stringify(compressedNews)}`,
    compressedMemory ? `MEMORY: ${JSON.stringify(compressedMemory)}` : null,
    `Analyze these news for UPSC. Return JSON with "topics" (max 5, HIGH signal only) and "insights" (trends/recurringThemes/strategyNotes/highPriorityDomains arrays).`
  ].filter(Boolean).join('\n');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ];

  const requestOptions = {
    model: 'deepseek-chat',
    messages,
    max_tokens: 3000,
  };

  const payloadSize = JSON.stringify(requestOptions).length;
  console.log(`[DeepSeek] Payload size: ${payloadSize} chars`);
  if (payloadSize > 10000) {
    console.warn(`[DeepSeek] Payload exceeds 10k chars (${payloadSize})`);
  }

  const response = await client.chat.completions.create(requestOptions);
  const rawText = response.choices?.[0]?.message?.content || '';

  if (!rawText) throw new Error('Empty response from DeepSeek');

  return extractJson(rawText);
}
```

- [ ] **Step 3: Verify prompt loads and schema hint is correct**

```bash
node --input-type=module --eval "
import { config } from 'dotenv'; config({ override: true });
import('./src/claude/providers/deepseek.js').then(async ({ callDeepSeek, validateDeepSeekResponse }) => {
  const news = [
    { t: 'India signs climate pact with ASEAN', s: 'Carbon credits and renewable targets for 2030.' },
    { t: 'Supreme Court rules on electoral bonds', s: 'Scheme declared unconstitutional by bench.' },
    { t: 'RBI raises repo rate by 25bps', s: 'Impact on home loans and GDP growth expected.' },
    { t: 'ISRO launches EOS-09 satellite', s: 'Sun-synchronous orbit for disaster monitoring.' },
    { t: 'India-EU FTA talks resume', s: 'Focus on digital trade and data flows.' },
  ];
  const out = await callDeepSeek(news, null);
  console.log('topics:', out?.topics?.length, '| has insights:', !!out?.insights);
  console.log('first topic keys:', Object.keys(out?.topics?.[0] || {}));
  console.log('insights keys:', Object.keys(out?.insights || {}));
});
"
```

Expected output:
```
topics: 5 | has insights: true
first topic keys: [ 'id', 'title', 'category', 'importance', 'score', 'summary', 'why_in_news', 'explanation', 'facts', 'tags', 'prelims', 'mains', 'revision_note' ]
insights keys: [ 'trends', 'recurringThemes', 'strategyNotes', 'highPriorityDomains' ]
```

- [ ] **Step 4: Commit**

```bash
git add src/prompts/upsc_prompt.txt src/claude/providers/deepseek.js
git commit -m "feat: update AI contract to include summary, facts, tags, insights"
```

---

## Task 2: Update MongoDB Entry Schema

**Files:**
- Modify: `src/models/Entry.js`

- [ ] **Step 1: Replace `src/models/Entry.js` with updated schema**

```js
import mongoose from 'mongoose';

const mcqSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String
}, { _id: false });

const prelimsSchema = new mongoose.Schema({
  key_facts: [String],
  mcq: mcqSchema
}, { _id: false });

const answerFrameworkSchema = new mongoose.Schema({
  intro: String,
  body: [String],
  conclusion: String
}, { _id: false });

const mainsSchema = new mongoose.Schema({
  gs_paper: String,
  question: String,
  answer_framework: answerFrameworkSchema
}, { _id: false });

const topicSchema = new mongoose.Schema({
  id: { type: String, index: true },
  title: String,
  category: String,
  importance: String,          // HIGH | MEDIUM | LOW
  score: Number,               // 0-100
  summary: String,             // 2-3 sentence overview (NEW)
  why_in_news: String,
  explanation: String,
  facts: [String],             // static facts array (NEW)
  tags: [String],              // syllabus tags (NEW)
  prelims: prelimsSchema,
  mains: mainsSchema,
  revision_note: String,       // was revision_note_50_words
}, { _id: false });

const insightsSchema = new mongoose.Schema({
  trends: [String],
  recurringThemes: [String],
  strategyNotes: [String],
  highPriorityDomains: [String],
}, { _id: false });

const entrySchema = new mongoose.Schema({
  date: { type: String, unique: true, index: true },
  topics: [topicSchema],
  insights: insightsSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Entry', entrySchema);
```

- [ ] **Step 2: Update Memory model to match insights field names**

Replace `src/models/Memory.js` with:

```js
import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  type: { type: String, default: 'system_memory', unique: true },
  date: String,
  trends: [String],
  recurringThemes: [String],
  strategyNotes: [String],
  highPriorityDomains: [String],
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Memory', memorySchema);
```

- [ ] **Step 3: Verify schemas parse without error**

```bash
node --input-type=module --eval "
import { config } from 'dotenv'; config({ override: true });
import('./src/models/Entry.js').then(m => console.log('Entry OK:', m.default.modelName));
import('./src/models/Memory.js').then(m => console.log('Memory OK:', m.default.modelName));
"
```

Expected:
```
Entry OK: Entry
Memory OK: Memory
```

- [ ] **Step 4: Commit**

```bash
git add src/models/Entry.js src/models/Memory.js
git commit -m "feat: update Entry and Memory schemas to new canonical contract"
```

---

## Task 3: Update DB Layer and Scheduler Output

**Files:**
- Modify: `src/db/db.js`
- Modify: `src/services/scheduler.js`

- [ ] **Step 1: Update `saveEntry` in `src/db/db.js` to save new shape**

Replace the existing `saveEntry` function:

```js
export async function saveEntry(entry) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await Entry.findOneAndUpdate(
      { date: today },
      { date: today, topics: entry.topics || [], insights: entry.insights || {}, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log(`Entry saved: ${result.topics.length} topics`);
    return result;
  } catch (error) {
    console.error('Error saving entry:', error);
    throw error;
  }
}
```

- [ ] **Step 2: Add `getHistoryEntries` projection query to `src/db/db.js`**

Add this new function after `getAllEntries`:

```js
// Returns lightweight history list (no heavy topic fields)
export async function getHistoryEntries() {
  try {
    return await Entry.find(
      {},
      { date: 1, 'topics.id': 1, 'topics.title': 1, 'topics.category': 1, 'topics.importance': 1 }
    ).sort({ date: -1 });
  } catch (error) {
    console.error('Error getting history entries:', error);
    return [];
  }
}
```

- [ ] **Step 3: Update `writeREADME` and `readREADME` in `src/db/db.js` to use new Memory fields**

Replace both functions:

```js
export async function writeREADME(insights) {
  try {
    const today = new Date().toISOString().split('T')[0];
    await Memory.findOneAndUpdate(
      { type: 'system_memory' },
      { type: 'system_memory', date: today, ...insights, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log('Memory updated');
  } catch (error) {
    console.error('Error writing memory:', error);
    throw error;
  }
}

export async function readREADME() {
  try {
    const memory = await Memory.findOne({ type: 'system_memory' });
    if (!memory) {
      return {
        trends: [],
        recurringThemes: [],
        strategyNotes: ['Focus on Environment, Polity, and Economy for upcoming exam'],
        highPriorityDomains: ['Environment & Climate', 'Polity & Governance', 'Economy & Reports', 'International Relations', 'Science & Tech']
      };
    }
    return {
      trends: memory.trends || [],
      recurringThemes: memory.recurringThemes || [],
      strategyNotes: memory.strategyNotes || [],
      highPriorityDomains: memory.highPriorityDomains || []
    };
  } catch (error) {
    console.error('Error reading memory:', error);
    return null;
  }
}
```

- [ ] **Step 4: Update scheduler.js to save new contract shape**

In `src/services/scheduler.js`, replace the entry construction block (around line 106–113):

```js
// Step 5: Save to database
console.log('\n[STEP 5] Saving to database...');
const entry = {
  topics: claudeOutput.topics || [],
  insights: claudeOutput.insights || {}
};

await saveEntry(entry);
console.log(`✓ Saved ${entry.topics.length} topics`);

// Step 4: Update memory with latest insights
console.log('\n[STEP 4] Updating system memory...');
if (claudeOutput.insights) {
  await writeREADME(claudeOutput.insights);
  console.log('✓ Memory updated');
}
```

Also update the import line in scheduler.js to include `getHistoryEntries`:

```js
import { saveEntry, readREADME, writeREADME, entryExists } from '../db/db.js';
```

- [ ] **Step 5: Update `compressMemory` in `src/claude/runAI.js` to use new Memory field names**

Replace the `compressMemory` function:

```js
export function compressMemory(readme) {
  if (!readme) return null;
  return {
    trends: (readme.trends || readme.key_trends || []).slice(0, 3),
    recurring: (readme.recurringThemes || readme.recurring_topics || []).slice(0, 2),
  };
}
```

- [ ] **Step 6: Verify scheduler dry-run with mocked AI output**

```bash
node --input-type=module --eval "
import { config } from 'dotenv'; config({ override: true });
import { compressMemory } from './src/claude/runAI.js';
const mem = { trends: ['t1','t2','t3','t4'], recurringThemes: ['r1','r2','r3'], strategyNotes: ['s1'] };
console.log('compressed:', JSON.stringify(compressMemory(mem)));
"
```

Expected:
```
compressed: {"trends":["t1","t2","t3"],"recurring":["r1","r2"]}
```

- [ ] **Step 7: Commit**

```bash
git add src/db/db.js src/services/scheduler.js src/claude/runAI.js
git commit -m "feat: align db layer and scheduler to new canonical contract"
```

---

## Task 4: Update Backend API Server

**Files:**
- Modify: `src/api/server.js`

- [ ] **Step 1: Update import to include `getHistoryEntries`**

Replace the db import line at the top of `server.js`:

```js
import { connectDB, getLatestEntry, getEntry, getAllEntries, getHistoryEntries, readREADME, entryExists } from '../db/db.js';
```

- [ ] **Step 2: Update `GET /api/today` to return clean shape**

Replace the `/api/today` handler:

```js
app.get('/api/today', async (req, res) => {
  try {
    const latest = await getLatestEntry();
    if (!latest) {
      return res.status(404).json({ error: 'No data available yet. Run the daily job first.' });
    }
    res.json({
      date: latest.date,
      topics: latest.topics || [],
      insights: latest.insights || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 3: Update `GET /api/history` to use projection**

Replace the `/api/history` handler:

```js
app.get('/api/history', async (req, res) => {
  try {
    const entries = await getHistoryEntries();
    res.json({
      total: entries.length,
      entries: entries.map(e => ({
        date: e.date,
        topicCount: e.topics?.length || 0,
        topics: e.topics || []
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 4: Update `GET /api/date/:date` to return clean shape**

Replace the `/api/date/:date` handler:

```js
app.get('/api/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    const entry = await getEntry(date);
    if (!entry) {
      return res.status(404).json({ error: `No data for ${date}` });
    }
    res.json({
      date: entry.date,
      topics: entry.topics || [],
      insights: entry.insights || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 5: Fix `GET /api/insights` to serve from Memory**

Replace the `/api/insights` handler:

```js
app.get('/api/insights', async (req, res) => {
  try {
    const memory = await readREADME();
    if (!memory) {
      return res.status(404).json({ error: 'No insights available yet' });
    }
    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 6: Fix `GET /api/topic/:id` to support optional `?date=` param**

Replace the `/api/topic/:id` handler:

```js
app.get('/api/topic/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    let entry;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
      entry = await getEntry(date);
    } else {
      entry = await getLatestEntry();
    }

    if (!entry?.topics) {
      return res.status(404).json({ error: 'No topics available' });
    }

    const topic = entry.topics.find(t => t.id === id);
    if (!topic) {
      return res.status(404).json({ error: `Topic '${id}' not found${date ? ` for ${date}` : ''}` });
    }

    res.json({ ...topic.toObject(), date: entry.date });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 7: Remove now-unused endpoints `/api/dashboard`, `/api/memory`, `/api/topics`**

Delete the three handler blocks for `/api/dashboard`, `/api/memory`, and `/api/topics` (these were AI artifact routes, no longer needed).

Update the 404 handler's `available` list:

```js
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available: [
      'GET  /health',
      'GET  /api/today',
      'GET  /api/history',
      'GET  /api/date/:date',
      'GET  /api/insights',
      'GET  /api/topic/:id?date=YYYY-MM-DD',
      'GET  /api/admin/status  (x-admin-key header required)',
      'POST /api/admin/stop    (x-admin-key header required)',
    ]
  });
});
```

- [ ] **Step 8: Start server and smoke-test endpoints**

```bash
# Terminal 1: start backend
node src/api/server.js &

# Terminal 2: smoke test
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:3001/api/today | jq '{date, topicCount: (.topics | length)}'
curl -s http://localhost:3001/api/insights | jq 'keys'
curl -s http://localhost:3001/api/history | jq '{total, firstEntry: .entries[0].date}'
```

Expected:
```json
{ "status": "ok" }
{ "date": "2026-04-10", "topicCount": 5 }
["highPriorityDomains", "recurringThemes", "strategyNotes", "trends"]
{ "total": 1, "firstEntry": "2026-04-10" }
```

- [ ] **Step 9: Commit**

```bash
git add src/api/server.js src/db/db.js
git commit -m "feat: refactor APIs to serve canonical contract with correct shapes"
```

---

## Task 5: Update Frontend Dashboard

**Files:**
- Modify: `frontend/pages/index.js`

- [ ] **Step 1: Replace `frontend/pages/index.js`**

```jsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const CATEGORY_COLORS = {
  Environment: 'bg-green-100 text-green-800',
  Polity: 'bg-blue-100 text-blue-800',
  Economy: 'bg-yellow-100 text-yellow-800',
  IR: 'bg-purple-100 text-purple-800',
  Science: 'bg-cyan-100 text-cyan-800',
  Reports: 'bg-orange-100 text-orange-800',
}

const IMPORTANCE_COLORS = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-gray-100 text-gray-600',
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`${API_URL}/api/today`)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-96"><p className="text-gray-500">Loading...</p></div>
  if (error) return <div className="container mx-auto p-8"><div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">{error}</div></div>
  if (!data) return null

  const topics = data.topics || []
  const heroTopics = topics.slice(0, 3)
  const otherTopics = topics.slice(3)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Today's Intelligence</h2>
        <p className="text-gray-500 mt-1">{data.date} · {topics.length} topics</p>
      </div>

      {/* Hero Topics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {heroTopics.map((topic) => (
          <Link key={topic.id} href={`/topic/${topic.id}?date=${data.date}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer h-full flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-3">
                <span className={`text-xs font-medium px-2 py-1 rounded ${CATEGORY_COLORS[topic.category] || 'bg-gray-100 text-gray-700'}`}>
                  {topic.category}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${IMPORTANCE_COLORS[topic.importance] || 'bg-gray-100 text-gray-600'}`}>
                  {topic.importance}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">{topic.title}</h3>
              <p className="text-gray-600 text-sm flex-1">{topic.summary}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">Score: {topic.score}/100</span>
                <span className="text-blue-600 text-sm font-medium">Read more →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Other Topics */}
      {otherTopics.length > 0 && (
        <>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">More Topics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherTopics.map((topic) => (
              <Link key={topic.id} href={`/topic/${topic.id}?date=${data.date}`}>
                <div className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition cursor-pointer flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_COLORS[topic.category] || 'bg-gray-100 text-gray-700'}`}>
                        {topic.category}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">{topic.title}</h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{topic.summary}</p>
                  </div>
                  <span className="text-gray-400 text-lg">→</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Tags cloud from all topics */}
      {topics.some(t => t.tags?.length) && (
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Syllabus Coverage</h3>
          <div className="flex flex-wrap gap-2">
            {[...new Set(topics.flatMap(t => t.tags || []))].map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify dashboard renders**

```bash
cd frontend && npm run dev &
# open http://localhost:3000 in browser
# Confirm: 3 hero cards, category badges, importance badges, summary text, tags cloud
```

- [ ] **Step 3: Commit**

```bash
git add frontend/pages/index.js
git commit -m "feat: redesign dashboard to use new topic contract (summary, importance, tags)"
```

---

## Task 6: Update Frontend Topic Detail

**Files:**
- Modify: `frontend/pages/topic/[id].js`

- [ ] **Step 1: Replace `frontend/pages/topic/[id].js`**

```jsx
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const CATEGORY_COLORS = {
  Environment: 'bg-green-100 text-green-800',
  Polity: 'bg-blue-100 text-blue-800',
  Economy: 'bg-yellow-100 text-yellow-800',
  IR: 'bg-purple-100 text-purple-800',
  Science: 'bg-cyan-100 text-cyan-800',
  Reports: 'bg-orange-100 text-orange-800',
}

export default function TopicDetail() {
  const router = useRouter()
  const { id, date } = router.query
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    const url = date
      ? `${API_URL}/api/topic/${id}?date=${date}`
      : `${API_URL}/api/topic/${id}`
    axios.get(url)
      .then(r => setTopic(r.data))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [id, date])

  if (loading) return <div className="flex items-center justify-center min-h-96"><p className="text-gray-500">Loading...</p></div>
  if (error) return <div className="container mx-auto p-8"><div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">{error}<br/><Link href="/" className="text-blue-600 mt-3 inline-block">← Back</Link></div></div>
  if (!topic) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/" className="text-blue-600 hover:underline text-sm mb-6 inline-flex items-center gap-1">
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`text-sm font-medium px-3 py-1 rounded ${CATEGORY_COLORS[topic.category] || 'bg-gray-100 text-gray-700'}`}>
            {topic.category}
          </span>
          <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded">
            Score: {topic.score}/100
          </span>
          <span className={`text-sm px-3 py-1 rounded ${topic.importance === 'HIGH' ? 'bg-red-100 text-red-700' : topic.importance === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
            {topic.importance}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">{topic.title}</h1>
        {topic.date && <p className="text-gray-400 text-sm mt-2">{topic.date}</p>}
      </div>

      {/* Summary */}
      {topic.summary && (
        <section className="mb-6 bg-blue-50 border border-blue-100 p-5 rounded-xl">
          <p className="text-gray-700 leading-relaxed">{topic.summary}</p>
        </section>
      )}

      {/* Why in News */}
      <section className="mb-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold mb-2 text-gray-900">📰 Why in News</h2>
        <p className="text-gray-700">{topic.why_in_news}</p>
      </section>

      {/* Key Facts */}
      {topic.facts?.length > 0 && (
        <section className="mb-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900">📌 Key Facts</h2>
          <ul className="space-y-2">
            {topic.facts.map((fact, i) => (
              <li key={i} className="flex gap-2 text-gray-700">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Explanation */}
      <section className="mb-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">📖 Explanation</h2>
        <div className="text-gray-700 whitespace-pre-line leading-relaxed">{topic.explanation}</div>
      </section>

      {/* Prelims */}
      <section className="mb-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">✍️ For Prelims</h2>
        {topic.prelims?.key_facts?.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Key Facts</h3>
            <ul className="space-y-1">
              {topic.prelims.key_facts.map((fact, i) => (
                <li key={i} className="text-gray-700 flex gap-2">
                  <span className="text-green-500">✓</span>{fact}
                </li>
              ))}
            </ul>
          </div>
        )}
        {topic.prelims?.mcq && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sample MCQ</h3>
            <p className="font-medium text-gray-800 mb-3">{topic.prelims.mcq.question}</p>
            <div className="space-y-2">
              {topic.prelims.mcq.options?.map((opt, i) => (
                <label key={i} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 cursor-pointer">
                  <input type="radio" name={`mcq-${topic.id}`} className="accent-blue-600" />
                  <span className="text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Correct answer: <span className="font-semibold text-green-700">{topic.prelims.mcq.answer}</span>
            </p>
          </div>
        )}
      </section>

      {/* Mains */}
      <section className="mb-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">📝 For Mains</h2>
        <div className="flex gap-2 mb-3">
          <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded font-medium">
            {topic.mains?.gs_paper}
          </span>
        </div>
        <p className="font-medium text-gray-800 mb-4">{topic.mains?.question}</p>
        {topic.mains?.answer_framework && (
          <div className="space-y-4 border-l-2 border-blue-200 pl-4">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Introduction</span>
              <p className="text-gray-700 mt-1">{topic.mains.answer_framework.intro}</p>
            </div>
            {topic.mains.answer_framework.body?.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Body Points</span>
                <ul className="mt-1 space-y-1">
                  {topic.mains.answer_framework.body.map((pt, i) => (
                    <li key={i} className="text-gray-700 flex gap-2"><span>•</span>{pt}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Conclusion</span>
              <p className="text-gray-700 mt-1">{topic.mains.answer_framework.conclusion}</p>
            </div>
          </div>
        )}
      </section>

      {/* Tags */}
      {topic.tags?.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {topic.tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{tag}</span>
          ))}
        </div>
      )}

      {/* Revision Note */}
      <section className="mb-6 bg-amber-50 border border-amber-200 p-5 rounded-xl">
        <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-2">⚡ Quick Revision</h2>
        <p className="text-amber-900">{topic.revision_note}</p>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/pages/topic/[id].js
git commit -m "feat: update topic detail to show summary, facts, tags, revision_note"
```

---

## Task 7: Update Frontend History and Insights Pages

**Files:**
- Modify: `frontend/pages/history.js`
- Modify: `frontend/pages/insights.js`

- [ ] **Step 1: Replace `frontend/pages/history.js`**

```jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const IMPORTANCE_DOT = { HIGH: 'bg-red-400', MEDIUM: 'bg-yellow-400', LOW: 'bg-gray-300' }

export default function History() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_URL}/api/history`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-96"><p className="text-gray-500">Loading...</p></div>
  if (!data) return null

  const { total, entries } = data

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">History</h2>
        <p className="text-gray-500 mt-1">{total} {total === 1 ? 'day' : 'days'} of intelligence</p>
      </div>

      {entries.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          No historical data yet. Run the daily job to generate entries.
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map(entry => (
            <div key={entry.date} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{entry.date}</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {entry.topicCount} topics
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entry.topics?.map(topic => (
                  <Link key={topic.id} href={`/topic/${topic.id}?date=${entry.date}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${IMPORTANCE_DOT[topic.importance] || 'bg-gray-300'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{topic.title}</p>
                        <p className="text-xs text-gray-500">{topic.category}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Replace `frontend/pages/insights.js`**

```jsx
import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Insights() {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_URL}/api/insights`)
      .then(r => setInsights(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-96"><p className="text-gray-500">Loading...</p></div>
  if (!insights) return <div className="container mx-auto p-8 text-gray-500">No insights yet. Run the daily job to populate.</div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Insights</h2>
        <p className="text-gray-500 mt-1">Cross-day UPSC intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* High Priority Domains */}
        {insights.highPriorityDomains?.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">🎯 High Priority Domains</h3>
            <div className="flex flex-wrap gap-2">
              {insights.highPriorityDomains.map((d, i) => (
                <span key={i} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">{d}</span>
              ))}
            </div>
          </section>
        )}

        {/* Recurring Themes */}
        {insights.recurringThemes?.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">🔄 Recurring Themes</h3>
            <ul className="space-y-2">
              {insights.recurringThemes.map((t, i) => (
                <li key={i} className="flex gap-2 text-gray-700 text-sm"><span className="text-purple-400">●</span>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Key Trends */}
        {insights.trends?.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">📈 Key Trends</h3>
            <ul className="space-y-2">
              {insights.trends.map((t, i) => (
                <li key={i} className="flex gap-2 text-gray-700 text-sm"><span className="text-green-500">↑</span>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Strategy Notes */}
        {insights.strategyNotes?.length > 0 && (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-amber-900 mb-4">💡 Exam Strategy</h3>
            <ul className="space-y-2">
              {insights.strategyNotes.map((n, i) => (
                <li key={i} className="flex gap-2 text-amber-800 text-sm"><span>→</span>{n}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/pages/history.js frontend/pages/insights.js
git commit -m "feat: fix history topic links and align insights to new field names"
```

---

## Task 8: Update Navigation Layout

**Files:**
- Modify: `frontend/pages/_app.js`

- [ ] **Step 1: Replace `frontend/pages/_app.js`**

```jsx
import '../styles/globals.css'
import Link from 'next/link'
import { useRouter } from 'next/router'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/history', label: 'History' },
  { href: '/insights', label: 'Insights' },
  { href: '/admin', label: 'Admin' },
]

function MyApp({ Component, pageProps }) {
  const router = useRouter()

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-14">
          <Link href="/" className="font-bold text-gray-900 text-lg tracking-tight">
            UPSC AI
          </Link>
          <nav className="flex gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = router.pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    active
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="min-h-screen bg-gray-50">
        <Component {...pageProps} />
      </main>
    </>
  )
}

export default MyApp
```

- [ ] **Step 2: Commit**

```bash
git add frontend/pages/_app.js
git commit -m "feat: clean nav with active state highlighting"
```

---

## Task 9: End-to-End Verification

- [ ] **Step 1: Run a full job and verify the pipeline**

```bash
node --input-type=module --eval "
import { config } from 'dotenv'; config({ override: true });
import { connectDB } from './src/db/db.js';
import { runDailyJob } from './src/services/scheduler.js';
await connectDB();
await runDailyJob();
process.exit(0);
"
```

Expected output includes:
```
[AI] Provider: deepseek-chat | Items: 5 | Memory: none
[DeepSeek] Payload size: ... chars
[AI] ✓ Valid response — 5 topics
✓ Saved 5 topics
✓ Memory updated
JOB COMPLETED SUCCESSFULLY
```

- [ ] **Step 2: Verify all API endpoints return expected shape**

```bash
node --input-type=module --eval "
import { config } from 'dotenv'; config({ override: true });
import { connectDB, getLatestEntry, readREADME } from './src/db/db.js';
await connectDB();
const e = await getLatestEntry();
const m = await readREADME();
console.log('Entry date:', e?.date);
console.log('Topics:', e?.topics?.length);
console.log('First topic keys:', Object.keys(e?.topics?.[0]?.toObject?.() || e?.topics?.[0] || {}));
console.log('Insights keys:', Object.keys(e?.insights?.toObject?.() || e?.insights || {}));
console.log('Memory trends:', m?.trends?.slice(0,2));
process.exit(0);
"
```

Expected:
```
Entry date: 2026-04-10
Topics: 5
First topic keys: ['id','title','category','importance','score','summary','why_in_news','explanation','facts','tags','prelims','mains','revision_note']
Insights keys: ['trends','recurringThemes','strategyNotes','highPriorityDomains']
Memory trends: ['trend1', 'trend2']
```

- [ ] **Step 3: Start both servers and open browser**

```bash
# Backend
node src/api/server.js &
# Frontend
cd frontend && npm run dev
```

Visit and verify:
- `http://localhost:3000` — Dashboard shows cards with summary + importance badges
- `http://localhost:3000/topic/<id>?date=<date>` — Shows facts, tags, new mains structure
- `http://localhost:3000/history` — Shows dot-coded importance, links include `?date=`
- `http://localhost:3000/insights` — Shows all 4 sections with correct field names

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: full-stack alignment complete — DeepSeek → MongoDB → API → Frontend"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Covered in |
|-------------|-----------|
| AI outputs summary, facts, tags, importance | Task 1 |
| AI outputs insights.trends/recurringThemes/strategyNotes | Task 1 |
| MongoDB schema adds facts, tags, summary, importance, insights | Task 2 |
| /api/today returns { date, topics, insights } | Task 4 |
| /api/history returns projected (lightweight) entries | Task 3 + 4 |
| /api/insights serves from Memory | Task 4 |
| /api/topic/:id supports date param (fixes history links) | Task 4 |
| Dashboard uses new fields | Task 5 |
| Topic detail uses new fields | Task 6 |
| History links include ?date= | Task 7 |
| Insights page uses correct field names | Task 7 |
| Nav active states | Task 8 |
| No mock data, real API integration | All tasks |
| Scheduler saves insights to Entry + Memory | Task 3 |
| Token budget maintained (max 5 topics, 3000 token limit) | Task 1 |

**Known limitation:** The Stitch design URL is behind Google auth and cannot be fetched. This plan is based on the existing frontend code as the design reference plus the spec requirements. If the Stitch design differs significantly from the current pages, additional frontend styling passes may be needed.
