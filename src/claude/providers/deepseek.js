import OpenAI from 'openai';
import { jsonrepair } from 'jsonrepair';

function getClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');
  return new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey });
}

// ─── JSON extraction helpers ──────────────────────────────────────────────────

// Character-level sanitizer: escapes control chars (newlines, tabs, etc.) that
// land INSIDE JSON string values. A global .replace(/[\n\r\t]/g,' ') is wrong
// because it also wrecks structural whitespace and confuses jsonrepair.
function sanitizeJsonStrings(text) {
  let out = '';
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; out += ch; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr) {
      if      (ch === '\n') out += '\\n';
      else if (ch === '\r') out += '\\r';
      else if (ch === '\t') out += '\\t';
      else if (ch.charCodeAt(0) < 0x20) { /* drop other control chars */ }
      else out += ch;
    } else {
      out += ch;
    }
  }
  return out;
}

// Brace-matching extractor: pulls each top-level {...} object from `text`.
// Last-resort fallback when the enclosing array/wrapper is too corrupted to
// parse as a whole unit.
function extractObjects(text) {
  const results = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') { if (!depth) start = i; depth++; }
    else if (ch === '}' && depth) {
      depth--;
      if (!depth && start !== -1) {
        const slice = text.slice(start, i + 1);
        try { results.push(JSON.parse(slice)); }
        catch { try { results.push(JSON.parse(jsonrepair(sanitizeJsonStrings(slice)))); } catch {} }
        start = -1;
      }
    }
  }
  return results;
}

// Finds the single largest [...] span in `text` using bracket-level tracking.
// Needed to recover topics from a corrupted { "topics": [...] } wrapper where
// the outer object fails to parse but the inner array items are mostly intact.
function findLargestArray(text) {
  let bestStart = -1, bestLen = 0;
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '[') { if (!depth) start = i; depth++; }
    else if (ch === ']' && depth) {
      depth--;
      if (!depth && start !== -1) {
        const len = i - start + 1;
        if (len > bestLen) { bestLen = len; bestStart = start; }
        start = -1;
      }
    }
  }
  return bestStart !== -1 ? text.slice(bestStart, bestStart + bestLen) : null;
}

function extractJson(text) {
  let s = text.trim()
    .replace(/<think>[\s\S]*?<\/think>/gi, '') // strip deepseek-reasoner thinking blocks
    .replace(/```json\s*/gi, '').replace(/```\s*/g, '') // strip markdown fences
    .replace(/^[ \t]*[•\-]\s*"/gm, '"') // fix stray bullet points before string keys
    .trim();

  // Pass 1: direct parse
  try { return JSON.parse(s); } catch {}

  // Pass 2: sanitize control chars inside strings, then parse + repair
  const sSan = sanitizeJsonStrings(s);
  try { return JSON.parse(sSan); } catch {}
  try { return JSON.parse(jsonrepair(sSan)); } catch {}

  // Isolate the outermost JSON structure
  const m = s.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!m) {
    console.warn('[JSON Extraction] No JSON brackets found in response');
    return null;
  }

  const raw = m[0];

  // Pass 3: parse/repair the matched structure (raw, then sanitized)
  try { return JSON.parse(raw); } catch {}
  try { return JSON.parse(jsonrepair(raw)); } catch {}

  const rawSan = sanitizeJsonStrings(raw);
  try { return JSON.parse(rawSan); } catch {}
  try { return JSON.parse(jsonrepair(rawSan)); } catch {}

  // Pass 4: partial recovery — pull objects from the largest inner array.
  // Handles { "topics": [...corrupted...] } where the wrapper fails to parse.
  const largestArr = findLargestArray(rawSan);
  if (largestArr) {
    const objs = extractObjects(largestArr);
    if (objs.length > 0) {
      console.warn(`[JSON Extraction] Partial recovery via array scan: ${objs.length} objects salvaged`);
      return objs;
    }
  }

  // Pass 5: extract any top-level {...} objects directly from the sanitized text
  const topObjs = extractObjects(rawSan);
  if (topObjs.length > 0) {
    console.warn(`[JSON Extraction] Partial recovery via object scan: ${topObjs.length} objects salvaged`);
    return topObjs.length === 1 ? topObjs[0] : topObjs;
  }

  console.warn('[JSON Extraction] All extraction attempts failed — response unrecoverable');
  return null;
}

// ─── Topic sanitizer ──────────────────────────────────────────────────────────
// Runs AFTER JSON parsing. Guards against the "array swallows subsequent fields"
// corruption: when jsonrepair leaves a [String] field unclosed, all following keys
// ('editorialInsights', ':', [array], ...) end up as elements of that array,
// causing Mongoose CastError on [String] schema fields.

const STRING_ARRAY_FIELDS = ['keyPoints', 'backgroundContext', 'editorialInsights', 'interlinkages', 'facts', 'tags', 'sources'];

// All known top-level keys on a topic object — used to detect a "leaked field name"
// inside an array, which signals that the array swallowed subsequent fields.
const TOPIC_KEYS = new Set([
  'id', 'type', 'title', 'category', 'importance', 'score', 'summary',
  'why_in_news', 'keyPoints', 'backgroundContext', 'editorialInsights',
  'interlinkages', 'explanation', 'facts', 'tags', 'prelims', 'mains',
  'revision_note', 'sources',
]);

function sanitizeTopic(topic) {
  if (!topic || typeof topic !== 'object' || Array.isArray(topic)) return null;
  if (!topic.title || typeof topic.title !== 'string') return null;

  const t = { ...topic };

  for (const field of STRING_ARRAY_FIELDS) {
    if (!Array.isArray(t[field])) {
      // Scalar where array expected — wrap in array or default to []
      t[field] = t[field] ? [String(t[field]).trim()].filter(Boolean) : [];
      continue;
    }
    const clean = [];
    for (const item of t[field]) {
      // Leaked field name signals the array has swallowed the rest of the topic —
      // stop here; everything after is misclassified content.
      if (typeof item === 'string' && TOPIC_KEYS.has(item)) break;
      if (item === ':') break;
      // Nested arrays/objects are never valid in a [String] field — skip
      if (typeof item !== 'string') continue;
      // Strip trailing \n<spaces>] that was supposed to be the array closing bracket
      const stripped = item.replace(/\\?n\s*\]$/, '').trim();
      if (stripped.length > 0) clean.push(stripped);
    }
    t[field] = clean;
  }

  // explanation: occasionally emitted as an array instead of a string
  if (Array.isArray(t.explanation)) {
    t.explanation = t.explanation.filter(s => typeof s === 'string').join(' ').trim();
  }

  return t;
}

// ─── Pass 1: Topic Extraction (deepseek-chat) ─────────────────────────────────
// Called per batch of ~8 news items. Extract ALL unique UPSC-relevant topics.

const TOPIC_SYSTEM = `You are a UPSC current affairs analyst. Extract all unique, exam-relevant topics from the news batch provided.
Return ONLY a JSON object containing a "topics" array. No markdown, no prose outside JSON.

RULES:
- Extract EVERY unique UPSC-relevant topic — do not limit count
- REJECT: political noise, celebrity, sports, low conceptual value
- PRIORITIZE: Governance, Economy, IR, Environment, Science/Tech, Reports, Polity, Ethics
- Merge only if two items are the exact same event; keep distinct subtopics separate
- Each topic must have all required fields
- "sources": copy the exact "src" string(s) from whichever input news items contributed to this topic (1-3 max)

TOPIC SCHEMA (return this exact JSON object):
{
  "topics": [
    {
      "id": "kebab-case-slug",
      "type": "topic|case-study|fact-sheet",
      "title": "Sharp scannable title",
      "category": "Environment|Polity|Economy|IR|Science|Reports|Governance|Ethics",
      "importance": "HIGH|MEDIUM|LOW",
      "score": 0-100,
      "summary": "2 sentences: what happened + why it matters for UPSC",
      "why_in_news": "Single trigger event sentence",
      "keyPoints": ["point 1 max 15 words", "point 2 max 15 words"],
      "backgroundContext": ["historical or constitutional backdrop point", "second point"],
      "editorialInsights": ["critical analysis or debate angle", "second point"],
      "interlinkages": ["link to other GS area or related event", "second point"],
      "explanation": "point1. point2. point3. point4.",
      "facts": ["static fact1", "static fact2"],
      "tags": ["GS-X", "syllabus-area", "keyword"],
      "prelims": {
        "key_facts": ["fact1", "fact2", "fact3"],
        "mcq": {"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A"}
      },
      "mains": {
        "gs_paper": "GS-1|GS-2|GS-3|GS-4",
        "question": "Exam-style analytical question min 15 words",
        "answer_framework": {"intro": "1 sentence", "body": ["pt1 min 10 words", "pt2 min 10 words", "pt3 min 10 words"], "conclusion": "1 sentence"}
      },
      "revision_note": "Compact max 50 word summary for revision",
      "sources": ["copy src field values from whichever input news items this topic draws from"]
    }
  ]
}`;

export async function callBatchTopics(newsBatch) {
  const client = getClient();
  const userPrompt = `Extract all UPSC-relevant topics from these news items. Return a JSON object with a "topics" array.\n\nNEWS:\n${JSON.stringify(newsBatch)}`;

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: TOPIC_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 8000,
  });

  const raw = response.choices?.[0]?.message?.content || '';
  if (!raw) throw new Error('Empty response from DeepSeek (topics batch)');

  const parsed = extractJson(raw);
  // With json_object, parsed will be an object { topics: [...] }
  const raw_topics = Array.isArray(parsed) ? parsed : (parsed?.topics || []);
  return raw_topics.map(sanitizeTopic).filter(Boolean);
}

// ─── Pass 2: Case Studies (deepseek-reasoner) ─────────────────────────────────
// Input: merged topic list (titles + summaries only — small prompt).
// Generates 5–6 deep policy/governance case studies.
// NOTE: deepseek-reasoner does NOT support response_format: json_object.
// The model outputs its reasoning in reasoning_content; content holds the answer.
// extractJson strips any <think>...</think> blocks defensively.

const CASE_STUDY_SYSTEM = `You are a UPSC mains case study writer. Given a list of today's current affairs topics, generate 5-6 deep policy/governance case studies suitable for UPSC GS-2/GS-3/GS-4 mains answers.

CRITICAL DIVERSITY RULE: Each case study MUST cover a completely distinct policy domain or event. No two case studies may overlap thematically. Scan all generated case studies before finalising — reject and replace any that share a dominant theme with another.

Return ONLY a JSON array of case study objects. No markdown, no prose outside JSON.

CASE STUDY SCHEMA (return array of these):
{
  "title": "Descriptive case study title",
  "context": "Background and setting — 3-4 sentences covering historical, constitutional, or policy backdrop",
  "problem": "The core challenge, failure, or governance issue — 2-3 sentences with specifics",
  "intervention": "Policy action, judicial order, or legislative measure taken — 2-3 sentences",
  "outcome": "Result, current status, and remaining challenges — 2-3 sentences",
  "learningPoints": [
    "Lesson for governance, polity, or ethics — specific and exam-ready",
    "Second lesson",
    "Third lesson"
  ],
  "mainsAngle": {
    "gs_paper": "GS-2|GS-3|GS-4",
    "question": "Exam-style question this case study answers",
    "answer_hint": "2-3 sentence outline of a model answer"
  },
  "tags": ["GS-2", "governance", "relevant-keyword"]
}`;

export async function callCaseStudies(topics) {
  const client = getClient();

  // Send only title + summary + category to keep prompt small
  const topicSummaries = topics.map((t) => ({
    title: t.title,
    summary: t.summary,
    category: t.category,
    importance: t.importance,
  }));

  const userPrompt = `Generate 5-6 UPSC case studies from today's topics. Return a JSON array.\n\nTOPICS:\n${JSON.stringify(topicSummaries)}`;

  const response = await client.chat.completions.create({
    model: 'deepseek-reasoner',
    messages: [
      { role: 'system', content: CASE_STUDY_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 8000,
  });

  const raw = response.choices?.[0]?.message?.content || '';
  if (!raw) throw new Error('Empty response from DeepSeek (case studies)');

  const parsed = extractJson(raw);
  if (!parsed) return []; // Fallback to empty array on corruption
  return Array.isArray(parsed) ? parsed : (parsed.caseStudies || []);
}

// ─── Pass 3: Insights / Signal Deck (deepseek-chat) ──────────────────────────
// Input: topic titles + categories only. Cheap synthesis call.

const INSIGHTS_SYSTEM = `You are a UPSC exam strategist. Given today's current affairs topics, generate a signal deck for exam preparation.
Return ONLY a valid JSON object. No markdown, no prose outside JSON.

SCHEMA:
{
  "trends": ["emerging trend visible across today's topics", "trend2", "trend3"],
  "recurringThemes": ["theme appearing across multiple topics", "theme2", "theme3"],
  "highFrequencyTopics": ["topic title that frequently appears in UPSC", "topic2", "topic3"],
  "strategyNotes": ["specific exam strategy note based on today's pattern", "note2", "note3"],
  "highPriorityDomains": ["domain1", "domain2", "domain3"],
  "editorialPatterns": ["recurring editorial argument or analytical framework seen today", "pattern2"]
}`;

export async function callInsights(topics) {
  const client = getClient();

  const topicList = topics.map((t) => `${t.title} [${t.category}] [${t.importance}]`).join('\n');
  const userPrompt = `Generate the signal deck for today's UPSC current affairs.\n\nTODAY'S TOPICS:\n${topicList}`;

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: INSIGHTS_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2500,
  });

  const raw = response.choices?.[0]?.message?.content || '';
  if (!raw) throw new Error('Empty response from DeepSeek (insights)');

  return extractJson(raw) || {}; // Fallback to empty object on corruption
}

// ─── Pass 1 MCQs (deepseek-chat) ─────────────────────────────────────────────
// Separate small call — generate standalone MCQs from final topic list.

const MCQ_SYSTEM = `You are a UPSC prelims question setter. Generate standalone practice MCQs from today's current affairs topics.
Return ONLY a JSON object containing an "mcqs" array. No markdown.

MCQ SCHEMA (return this object):
{
  "mcqs": [
    {
      "question": "Complete question min 15 words",
      "options": ["A. option", "B. option", "C. option", "D. option"],
      "answer": "A|B|C|D",
      "explanation": "1-2 sentence explanation of why the answer is correct",
      "topic": "related-topic-id-or-title"
    }
  ]
}`;

export async function callMCQs(topics) {
  const client = getClient();

  const topicList = topics.map((t) => `${t.title}: ${t.summary}`).join('\n');
  const userPrompt = `Generate 8-12 UPSC prelims MCQs from today's topics. Return a JSON object with an "mcqs" array.\n\nTOPICS:\n${topicList}`;

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: MCQ_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 6000,
  });

  const raw = response.choices?.[0]?.message?.content || '';
  if (!raw) return [];

  const parsed = extractJson(raw);
  return Array.isArray(parsed) ? parsed : (parsed?.mcqs || []);
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateDeepSeekResponse(output) {
  if (!output || typeof output !== 'object') return false;
  const topics = output.topics;
  if (!Array.isArray(topics) || topics.length < 2) {
    console.warn(`[DeepSeek] Insufficient topics: ${topics?.length ?? 0}`);
    return false;
  }
  if (output.signalDeck && !output.insights) output.insights = output.signalDeck;
  if (!Array.isArray(output.mcqs)) output.mcqs = [];
  if (!Array.isArray(output.caseStudies)) output.caseStudies = [];
  return true;
}

// ─── Legacy single-call (kept for backward compat / manual runs) ──────────────
export async function callDeepSeek(compressedNews, compressedMemory) {
  const topics = await callBatchTopics(compressedNews);
  const [caseStudies, mcqs, insights] = await Promise.allSettled([
    callCaseStudies(topics),
    callMCQs(topics),
    callInsights(topics),
  ]);
  return {
    topics,
    caseStudies: caseStudies.status === 'fulfilled' ? caseStudies.value : [],
    mcqs: mcqs.status === 'fulfilled' ? mcqs.value : [],
    signalDeck: insights.status === 'fulfilled' ? insights.value : {},
    insights: insights.status === 'fulfilled' ? insights.value : {},
  };
}
