import crypto from 'crypto';
import { callBatchTopics, callCaseStudies, callMCQs, callInsights, validateDeepSeekResponse } from './providers/deepseek.js';

let _lastNewsHash = null;

// ─── News Compression ─────────────────────────────────────────────────────────

/**
 * Strip HTML and normalise a single news item for the AI.
 * Keeps title (90 chars), summary (200 chars), source.
 */
function compressItem(item) {
  const strip = (s) => (s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return {
    t: strip(item.title).substring(0, 90),
    s: strip(item.summary || item.description || '').substring(0, 200),
    src: (item.source || '').substring(0, 30),
  };
}

/**
 * Split news items into batches of `size` for parallel Pass 1 calls.
 * Deduplicates by title before splitting.
 */
function splitIntoBatches(items, size = 8) {
  const seen = new Set();
  const unique = items.filter((item) => {
    const key = (item.title || item.t || '').toLowerCase().slice(0, 50);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const batches = [];
  for (let i = 0; i < unique.length; i += size) {
    batches.push(unique.slice(i, i + size).map(compressItem));
  }
  return batches;
}

/**
 * Compress memory for context injection (legacy / unchanged).
 */
export function compressMemory(readme) {
  if (!readme) return null;
  const trends = (readme.trends || readme.key_trends || []).slice(0, 3);
  const recurring = (readme.recurringThemes || readme.recurring_topics || []).slice(0, 3);
  const highFreq = (readme.highFrequencyTopics || []).slice(0, 2);
  if (!trends.length && !recurring.length) return null;
  return { trends, recurring, ...(highFreq.length ? { highFreq } : {}) };
}

// ─── Topic Merging ────────────────────────────────────────────────────────────

/**
 * Deduplicate topics across batches by slug/title similarity.
 * Keeps the entry with the higher score.
 */
function mergeTopics(batches) {
  const map = new Map();

  for (const topic of batches.flat()) {
    if (!topic || !topic.title) continue;
    const key = (topic.id || topic.title).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    const existing = map.get(key);
    if (!existing || (topic.score || 0) > (existing.score || 0)) {
      map.set(key, topic);
    }
  }

  return [...map.values()].sort((a, b) => (b.score || 0) - (a.score || 0));
}

// ─── Hash ─────────────────────────────────────────────────────────────────────

function hashNews(items) {
  const key = items.map((n) => n.title || '').join('|');
  return crypto.createHash('md5').update(key).digest('hex');
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

/**
 * Three-pass batched pipeline:
 *
 * Pass 1 — Topic extraction (deepseek-chat, parallel batches of 8)
 *   → All unique UPSC topics across all news items
 *
 * Pass 2 — Case studies (deepseek-reasoner, single call)
 *   → 5-6 deep policy/governance case studies
 *
 * Pass 3 — MCQs + Insights (deepseek-chat, two parallel calls)
 *   → 8-12 standalone MCQs + signalDeck
 */
export async function processNewsBatch(newsBatch, previousREADME = null) {
  if (!newsBatch || newsBatch.length < 3) {
    console.log(`[AI] Skip — insufficient news (${newsBatch?.length ?? 0} items)`);
    return null;
  }

  const hash = hashNews(newsBatch);
  if (_lastNewsHash && _lastNewsHash === hash) {
    console.log('[AI] Skip — news hash unchanged');
    return null;
  }

  const batches = splitIntoBatches(newsBatch, 12);
  console.log(`[AI] Pass 1 — ${batches.length} topic batches × deepseek-chat (parallel)`);

  // ── Pass 1: Topic extraction (all batches in parallel) ──────────────────────
  const batchResults = await Promise.allSettled(
    batches.map(async (batch, i) => {
      try {
        const topics = await callBatchTopics(batch);
        console.log(`  [Batch ${i + 1}/${batches.length}] ✓ ${topics.length} topics`);
        return topics;
      } catch (err) {
        console.error(`  [Batch ${i + 1}/${batches.length}] ✗ ${err.message}`);
        return [];
      }
    })
  );

  const allTopicBatches = batchResults.map((r) => (r.status === 'fulfilled' ? r.value : []));
  const topics = mergeTopics(allTopicBatches);

  if (topics.length < 2) {
    console.error(`[AI] Pass 1 failed — only ${topics.length} topics extracted`);
    return null;
  }

  console.log(`[AI] Pass 1 complete — ${topics.length} unique topics after merge`);

  // ── Pass 2: Case studies (reasoner) + Pass 3a: MCQs + Pass 3b: Insights (parallel) ──
  console.log('[AI] Pass 2 — case studies via deepseek-reasoner');
  console.log('[AI] Pass 3 — MCQs + insights via deepseek-chat (parallel with Pass 2)');

  const [caseStudyResult, mcqResult, insightsResult] = await Promise.allSettled([
    callCaseStudies(topics),
    callMCQs(topics),
    callInsights(topics),
  ]);

  const caseStudies = caseStudyResult.status === 'fulfilled' ? caseStudyResult.value : [];
  const mcqs = mcqResult.status === 'fulfilled' ? mcqResult.value : [];
  const signalDeck = insightsResult.status === 'fulfilled' ? insightsResult.value : {};

  console.log(`[AI] ✓ Topics: ${topics.length} | Case Studies: ${caseStudies.length} | MCQs: ${mcqs.length}`);

  if (caseStudyResult.status === 'rejected') console.error('[AI] Case studies failed:', caseStudyResult.reason?.message);
  if (mcqResult.status === 'rejected') console.error('[AI] MCQs failed:', mcqResult.reason?.message);
  if (insightsResult.status === 'rejected') console.error('[AI] Insights failed:', insightsResult.reason?.message);

  _lastNewsHash = hash;

  return {
    topics,
    caseStudies,
    mcqs,
    signalDeck,
    insights: signalDeck,
  };
}

// ─── Legacy shims ─────────────────────────────────────────────────────────────

export function compressNews(batch) {
  return splitIntoBatches(batch, batch.length)[0] || [];
}

export async function validateAndParseOutput(rawOutput) {
  try {
    return typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;
  } catch {
    return null;
  }
}
