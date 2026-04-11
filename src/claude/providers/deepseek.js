import OpenAI from 'openai';

function getClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');
  return new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey });
}

function extractJson(text) {
  try { return JSON.parse(text); } catch {}
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (match) return JSON.parse(match[0]);
  throw new Error('No valid JSON found in response');
}

// ─── Pass 1: Topic Extraction (deepseek-chat) ─────────────────────────────────
// Called per batch of ~8 news items. Extract ALL unique UPSC-relevant topics.

const TOPIC_SYSTEM = `You are a UPSC current affairs analyst. Extract all unique, exam-relevant topics from the news batch provided.
Return ONLY a JSON array of topic objects. No markdown, no prose outside JSON.

RULES:
- Extract EVERY unique UPSC-relevant topic — do not limit count
- REJECT: political noise, celebrity, sports, low conceptual value
- PRIORITIZE: Governance, Economy, IR, Environment, Science/Tech, Reports, Polity, Ethics
- Merge only if two items are the exact same event; keep distinct subtopics separate
- Each topic must have all required fields

TOPIC SCHEMA (return array of these):
{
  "id": "kebab-case-slug",
  "type": "topic|case-study|fact-sheet",
  "title": "Sharp scannable title",
  "category": "Environment|Polity|Economy|IR|Science|Reports|Governance|Ethics",
  "importance": "HIGH|MEDIUM|LOW",
  "score": 0-100,
  "summary": "2 sentences: what happened + why it matters for UPSC",
  "why_in_news": "Single trigger event sentence",
  "keyPoints": ["• point ≤15 words", "• point ≤15 words"],
  "backgroundContext": ["• historical/constitutional/policy backdrop", "• second point"],
  "editorialInsights": ["• critical analysis or debate angle", "• second point"],
  "interlinkages": ["• link to other GS area or related event", "• second point"],
  "explanation": "• point1\n• point2\n• point3\n• point4",
  "facts": ["static fact1", "static fact2"],
  "tags": ["GS-X", "syllabus-area", "keyword"],
  "prelims": {
    "key_facts": ["fact1", "fact2", "fact3"],
    "mcq": {"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A"}
  },
  "mains": {
    "gs_paper": "GS-1|GS-2|GS-3|GS-4",
    "question": "Exam-style analytical question ≥15 words",
    "answer_framework": {"intro": "1 sentence", "body": ["pt1 ≥10 words", "pt2 ≥10 words", "pt3 ≥10 words"], "conclusion": "1 sentence"}
  },
  "revision_note": "Compact ≤50 word summary for revision"
}`;

export async function callBatchTopics(newsBatch) {
  const client = getClient();
  const userPrompt = `Extract all UPSC-relevant topics from these news items. Return a JSON array.\n\nNEWS:\n${JSON.stringify(newsBatch)}`;

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: TOPIC_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 8000,
  });

  const raw = response.choices?.[0]?.message?.content || '';
  if (!raw) throw new Error('Empty response from DeepSeek (topics batch)');

  const parsed = extractJson(raw);
  return Array.isArray(parsed) ? parsed : (parsed.topics || []);
}

// ─── Pass 2: Case Studies (deepseek-reasoner) ─────────────────────────────────
// Input: merged topic list (titles + summaries only — small prompt).
// Generates 5–6 deep policy/governance case studies.

const CASE_STUDY_SYSTEM = `You are a UPSC mains case study writer. Given a list of today's current affairs topics, generate 5-6 deep policy/governance case studies suitable for UPSC GS-2/GS-3/GS-4 mains answers.

Return ONLY a JSON array of case study objects. No markdown, no prose outside JSON.

CASE STUDY SCHEMA (return array of these):
{
  "title": "Descriptive case study title",
  "context": "Background and setting — 3-4 sentences covering historical, constitutional, or policy backdrop",
  "problem": "The core challenge, failure, or governance issue — 2-3 sentences with specifics",
  "intervention": "Policy action, judicial order, or legislative measure taken — 2-3 sentences",
  "outcome": "Result, current status, and remaining challenges — 2-3 sentences",
  "learningPoints": [
    "• Lesson for governance, polity, or ethics — specific and exam-ready",
    "• Second lesson",
    "• Third lesson"
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
    messages: [
      { role: 'system', content: INSIGHTS_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2500,
  });

  const raw = response.choices?.[0]?.message?.content || '';
  if (!raw) throw new Error('Empty response from DeepSeek (insights)');

  return extractJson(raw);
}

// ─── Pass 1 MCQs (deepseek-chat) ─────────────────────────────────────────────
// Separate small call — generate standalone MCQs from final topic list.

const MCQ_SYSTEM = `You are a UPSC prelims question setter. Generate standalone practice MCQs from today's current affairs topics.
Return ONLY a JSON array of MCQ objects. No markdown.

MCQ SCHEMA:
{
  "question": "Complete question ≥15 words",
  "options": ["A. option", "B. option", "C. option", "D. option"],
  "answer": "A|B|C|D",
  "explanation": "1-2 sentence explanation of why the answer is correct",
  "topic": "related-topic-id-or-title"
}`;

export async function callMCQs(topics) {
  const client = getClient();

  const topicList = topics.map((t) => `${t.title}: ${t.summary}`).join('\n');
  const userPrompt = `Generate 8-12 UPSC prelims MCQs from today's topics. Return a JSON array.\n\nTOPICS:\n${topicList}`;

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: MCQ_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 6000,
  });

  const raw = response.choices?.[0]?.message?.content || '';
  if (!raw) return [];

  try {
    const parsed = extractJson(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
