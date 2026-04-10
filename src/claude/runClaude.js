import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = path.join(__dirname, '../prompts/upsc_prompt.txt');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

function loadPrompt() {
  try {
    return fs.readFileSync(PROMPT_PATH, 'utf-8');
  } catch (error) {
    console.error('Error loading prompt:', error);
    return 'Process the following news batch and generate UPSC intelligence output.';
  }
}

function buildSystemPrompt() {
  return loadPrompt();
}

export async function processNewsBatch(newsBatch, previousREADME = null) {
  const systemPrompt = buildSystemPrompt();

  const userMessage = `
CURRENT NEWS BATCH (${new Date().toISOString().split('T')[0]}):

${JSON.stringify(newsBatch, null, 2)}

${previousREADME ? `PREVIOUS README (FOR CONTEXT AND UPDATES):\n${JSON.stringify(previousREADME, null, 2)}` : 'NO PREVIOUS README - CREATE NEW'}

Generate structured UPSC intelligence output as valid JSON.
`;

  try {
    console.log('Sending request to Claude...');

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ],
      system: systemPrompt
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response');
      return null;
    }

    const output = JSON.parse(jsonMatch[0]);
    console.log('Claude processing completed successfully');
    return output;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return null;
  }
}

export async function validateAndParseOutput(rawOutput) {
  try {
    if (typeof rawOutput === 'string') {
      return JSON.parse(rawOutput);
    }
    return rawOutput;
  } catch (error) {
    console.error('Error parsing output:', error);
    return null;
  }
}
