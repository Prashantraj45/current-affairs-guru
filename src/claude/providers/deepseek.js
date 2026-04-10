import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(join(__dirname, '../../prompts/upsc_prompt.txt'), 'utf-8');

function getClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');
  return new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey });
}

function extractJson(text) {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {}
  // Fall back to regex extraction
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error('No valid JSON found in response');
}

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

export function validateDeepSeekResponse(output) {
  if (!output || typeof output !== 'object') return false;
  const topics = output.topics;
  if (!Array.isArray(topics) || topics.length < 3) {
    console.warn(`[DeepSeek] Insufficient topics: ${topics?.length ?? 0}`);
    return false;
  }
  return true;
}
