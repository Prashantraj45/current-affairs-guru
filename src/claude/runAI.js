import crypto from 'crypto';
import { callDeepSeek, validateDeepSeekResponse } from './providers/deepseek.js';

// In-process cache: skip if same news batch processed already this session
let _lastNewsHash = null;

// ─── Input Compression ───────────────────────────────────────────────────────

/**
 * Compress news batch: strip HTML, trim fields, cap batch at 8 items.
 */
export function compressNews(batch) {
  const stripHtml = (str) => (str || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return batch.slice(0, 8).map((item) => ({
    t: stripHtml(item.title).substring(0, 90),
    s: stripHtml(item.summary || item.description || '').substring(0, 130),
  }));
}

/**
 * Compress previous README: extract only key trends + recurring topics.
 */
export function compressMemory(readme) {
  if (!readme) return null;
  return {
    trends: (readme.key_trends || []).slice(0, 5),
    recurring: (readme.recurring_topics || []).slice(0, 5),
    domains: (readme.high_priority_domains || []).slice(0, 3),
  };
}

function hashNews(batch) {
  const key = batch.map((n) => n.title || '').join('|');
  return crypto.createHash('md5').update(key).digest('hex');
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

/**
 * Primary export used by scheduler.
 * Handles: skip logic → compression → DeepSeek call → validate → retry once.
 */
export async function processNewsBatch(newsBatch, previousREADME = null) {
  // Skip: insufficient news
  if (!newsBatch || newsBatch.length < 5) {
    console.log(`[AI] Skip — insufficient news (${newsBatch?.length ?? 0} items)`);
    return null;
  }

  // Skip: same news hash (duplicate run in same process)
  const hash = hashNews(newsBatch);
  if (_lastNewsHash && _lastNewsHash === hash) {
    console.log('[AI] Skip — news hash unchanged');
    return null;
  }

  const compressedNews = compressNews(newsBatch);
  const compressedMemory = compressMemory(previousREADME);

  console.log(`[AI] Provider: deepseek-chat | Items: ${compressedNews.length} | Memory: ${compressedMemory ? 'yes' : 'none'}`);

  // Attempt 1: deepseek-chat
  let output = await _tryDeepSeek(compressedNews, compressedMemory, false);
  if (output) {
    _lastNewsHash = hash;
    return output;
  }

  // Retry: deepseek-reasoner fallback (once)
  console.warn('[AI] Retrying with deepseek-reasoner...');
  output = await _tryDeepSeek(compressedNews, compressedMemory, true);
  if (output) {
    _lastNewsHash = hash;
    return output;
  }

  console.error('[AI] Both attempts failed');
  return null;
}

async function _tryDeepSeek(compressedNews, compressedMemory, useReasoner) {
  try {
    const output = await callDeepSeek(compressedNews, compressedMemory, useReasoner);
    if (validateDeepSeekResponse(output)) {
      console.log(`[AI] ✓ Valid response — ${output.topics.length} topics`);
      return output;
    }
    console.warn('[AI] Response failed validation');
    return null;
  } catch (err) {
    console.error(`[AI] Error (${useReasoner ? 'reasoner' : 'chat'}):`, err.message);
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
