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

/**
 * Call DeepSeek API.
 * useReasoner=true → deepseek-reasoner (no json_object mode, parse manually)
 */
export async function callDeepSeek(compressedNews, compressedMemory, useReasoner = false) {
  const client = getClient();
  const model = useReasoner ? 'deepseek-reasoner' : 'deepseek-chat';
  const today = new Date().toISOString().split('T')[0];

  const userPrompt = [
    `DATE: ${today}`,
    `NEWS:\n${JSON.stringify(compressedNews)}`,
    compressedMemory ? `MEMORY:\n${JSON.stringify(compressedMemory)}` : 'MEMORY: none',
    'Return ONLY valid JSON matching the schema. High signal only. Remove redundant or low-value news.'
  ].join('\n\n');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ];

  const requestOptions = {
    model,
    messages,
    max_tokens: 2500,
  };

  // json_object mode only supported on deepseek-chat
  if (!useReasoner) {
    requestOptions.response_format = { type: 'json_object' };
  }

  const response = await client.chat.completions.create(requestOptions);
  const rawText = response.choices?.[0]?.message?.content || '';

  if (!rawText) throw new Error('Empty response from DeepSeek');

  // For reasoner, extract JSON block manually
  const jsonText = useReasoner
    ? (rawText.match(/\{[\s\S]*\}/)?.[0] ?? rawText)
    : rawText;

  return JSON.parse(jsonText);
}

export function validateDeepSeekResponse(output) {
  if (!output || typeof output !== 'object') return false;
  const topics = output.topics;
  if (!Array.isArray(topics) || topics.length < 5) {
    console.warn(`[DeepSeek] Insufficient topics: ${topics?.length ?? 0}`);
    return false;
  }
  return true;
}
