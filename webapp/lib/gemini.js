/**
 * AI generation client.
 * Currently pointed at LiteLLM proxy (OpenAI-compatible).
 * To revert to Gemini: set USE_LITELLM=false and restore the Gemini block.
 */
import { getGeminiApiKey } from './settingsStore.js';

// ——— LiteLLM config (temporary, for testing) ———
const USE_LITELLM = true;
const LITELLM_BASE = 'http://10.0.4.142:4000';
const LITELLM_API_KEY = 'sk--copC0-jvpdt20vApX89-Q';
const LITELLM_MODEL = 'openai/gpt-5.2';

// ——— Gemini config (production) ———
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-2.5-flash';

export function getModel() {
  return USE_LITELLM ? LITELLM_MODEL : GEMINI_MODEL;
}

/** Returns the server-side Gemini API key (DB first, env fallback). */
export async function getApiKey() {
  return getGeminiApiKey();
}

function extractText(response) {
  if (!response?.candidates?.[0]) {
    const reason = response?.promptFeedback?.blockReason ?? 'no_candidates';
    throw new Error(String(reason));
  }
  const parts = response.candidates[0].content?.parts ?? [];
  if (!parts[0]?.text) {
    const finish = response.candidates[0].finishReason ?? 'empty';
    throw new Error(String(finish));
  }
  return parts[0].text;
}

/**
 * Extract a JSON value (object or array) from text that may have leading/trailing content.
 * Handles both [...], {...}, and text like "Here is the data: [...]" or markdown fences.
 */
function extractJson(text) {
  const raw = String(text).trim();
  const firstBrace = raw.indexOf('{');
  const firstBracket = raw.indexOf('[');

  // Prefer array if it appears first or is the only structure (exam questions are an array)
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const close = findMatchingBracket(raw, firstBracket, '[', ']');
    if (close !== -1) {
      try {
        return JSON.parse(raw.slice(firstBracket, close + 1));
      } catch (e) {
        // fall through to try object
      }
    }
  }

  if (firstBrace !== -1) {
    const close = findMatchingBracket(raw, firstBrace, '{', '}');
    if (close !== -1) {
      return JSON.parse(raw.slice(firstBrace, close + 1));
    }
  }

  throw new Error('No JSON array or object found in response');
}

function findMatchingBracket(str, openIndex, openChar, closeChar) {
  let depth = 1;
  for (let i = openIndex + 1; i < str.length; i++) {
    if (str[i] === openChar) depth++;
    else if (str[i] === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export async function generateContent(prompt, config = {}) {
  if (USE_LITELLM) {
    // ——— LiteLLM / OpenAI-compatible path ———
    const payload = {
      model: LITELLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxOutputTokens ?? 8192,
    };

    const res = await fetch(`${LITELLM_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LITELLM_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120000),
    });
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(data?.error?.message || `HTTP ${res.status}`);
    }
    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('Empty response from LiteLLM');
    const u = data.usage || {};
    const usage = {
      promptTokenCount: u.prompt_tokens ?? 0,
      candidatesTokenCount: u.completion_tokens ?? 0,
      totalTokenCount: u.total_tokens ?? (u.prompt_tokens ?? 0) + (u.completion_tokens ?? 0),
    };
    return { text, usage };
  }

  // ——— Gemini path ———
  const key = await getApiKey();
  if (!key) throw new Error('Gemini API key is not configured. Ask your admin to set it in the Admin Dashboard.');

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxOutputTokens ?? 8192,
      ...config,
    },
  };

  const url = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120000),
  });
  const data = await res.json();
  if (res.status !== 200) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }
  const text = extractText(data);
  const um = data?.usageMetadata || {};
  const usage = {
    promptTokenCount: um.promptTokenCount ?? 0,
    candidatesTokenCount: um.candidatesTokenCount ?? 0,
    totalTokenCount: um.totalTokenCount ?? (um.promptTokenCount ?? 0) + (um.candidatesTokenCount ?? 0),
  };
  return { text, usage };
}

export function extractJsonFromResponse(text) {
  return extractJson(text);
}
