import crypto from 'crypto';
import { callDeepSeek, validateDeepSeekResponse } from './providers/deepseek.js';

let _lastNewsHash = null;

// ─── Input Compression ───────────────────────────────────────────────────────

/**
 * Compress news batch: strip HTML, deduplicate titles, cap at 8.
 * Source diversity is handled upstream by fetchNews (interleaved order).
 */
export function compressNews(batch) {
  const stripHtml = (s) => (s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const seen = new Set();
  const result = [];

  for (const item of batch) {
    if (result.length >= 8) break;
    const t = stripHtml(item.title).substring(0, 90);
    if (t.length < 10) continue;
    const key = t.slice(0, 50).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      t,
      s: stripHtml(item.summary || item.description || '').substring(0, 120),
      src: (item.source || '').substring(0, 20),
    });
  }

  return result;
}

/**
 * Compress memory: send only last 3 trends + 3 recurring + 2 highFrequency.
 * Prevents token bloat from accumulated history.
 */
export function compressMemory(readme) {
  if (!readme) return null;
  const trends = (readme.trends || readme.key_trends || []).slice(0, 3);
  const recurring = (readme.recurringThemes || readme.recurring_topics || []).slice(0, 3);
  const highFreq = (readme.highFrequencyTopics || []).slice(0, 2);
  if (!trends.length && !recurring.length) return null;
  return { trends, recurring, ...(highFreq.length ? { highFreq } : {}) };
}

function hashNews(batch) {
  const key = batch.map((n) => n.title || '').join('|');
  return crypto.createHash('md5').update(key).digest('hex');
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

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

  const compressedNews = compressNews(newsBatch);
  const compressedMemory = compressMemory(previousREADME);

  console.log(`[AI] Provider: deepseek-chat | Items: ${compressedNews.length} | Memory: ${compressedMemory ? 'yes' : 'none'}`);

  let output = await _tryDeepSeek(compressedNews, compressedMemory);
  if (output) { _lastNewsHash = hash; return output; }

  console.warn('[AI] Retrying once...');
  output = await _tryDeepSeek(compressedNews, compressedMemory);
  if (output) { _lastNewsHash = hash; return output; }

  console.error('[AI] Both attempts failed');
  return null;
}

async function _tryDeepSeek(compressedNews, compressedMemory) {
  try {
    const output = await callDeepSeek(compressedNews, compressedMemory);
    if (validateDeepSeekResponse(output)) {
      const count = output.topics?.length ?? 0;
      console.log(`[AI] ✓ Valid response — ${count} topics`);
      return output;
    }
    console.warn('[AI] Response failed validation');
    return null;
  } catch (err) {
    console.error('[AI] Error:', err.message);
    return null;
  }
}

// ─── Backward Compat ─────────────────────────────────────────────────────────

export async function validateAndParseOutput(rawOutput) {
  try {
    return typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;
  } catch {
    return null;
  }
}
