import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a UPSC current affairs analyst.
Return ONLY valid JSON.
High signal only.
No extra text.`;

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
    `Return JSON schema:\n{"plan":{"priority_topics":[]},"readme":{"date":"${today}","key_trends":[],"recurring_topics":[],"high_priority_domains":[]},"topics":[{"id":"","title":"","category":"Environment|Polity|Economy|IR|Science|Reports","upsc_relevance_score":0,"why_in_news":"","explanation":"bullet points ≤60 words","prelims":{"key_facts":[],"mcq":{"question":"","options":[],"answer":""}},"mains":{"gs_paper":"","question":""},"revision_note_50_words":"","metadata":{"importance_tag":"HIGH|MEDIUM|LOW"}}],"ui_output":{"dashboard":{"hero_topics":[],"summary":""}}}`
  ].filter(Boolean).join('\n');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ];

  const requestOptions = {
    model: 'deepseek-chat',
    messages,
    max_tokens: 2000,
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
