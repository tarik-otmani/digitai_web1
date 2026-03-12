import { supabase } from './supabase.js';

// In-memory cache so we don't hit Supabase on every Gemini call
let _cachedKey = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60_000; // re-fetch every 60 s

/**
 * Get the Gemini API key: DB > env fallback.
 * Result is cached for 60 s to avoid a DB round-trip on every generation call.
 */
export async function getGeminiApiKey() {
  const now = Date.now();
  if (_cachedKey !== null && now - _cacheTime < CACHE_TTL_MS) {
    return _cachedKey;
  }
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'gemini_api_key')
      .single();
    if (!error && data?.value) {
      _cachedKey = data.value.trim();
      _cacheTime = now;
      return _cachedKey;
    }
  } catch (_) {}
  // Fallback to env
  const envKey = (process.env.GEMINI_API_KEY || '').trim();
  _cachedKey = envKey;
  _cacheTime = now;
  return envKey;
}

/**
 * Save (upsert) the Gemini API key. Clears the cache immediately.
 * @param {string} key
 * @param {string} adminUserId
 */
export async function setGeminiApiKey(key, adminUserId) {
  const { error } = await supabase.from('app_settings').upsert({
    key: 'gemini_api_key',
    value: (key || '').trim(),
    updated_by: adminUserId,
    timeupdated: Date.now(),
  });
  if (error) throw error;
  // Bust cache
  _cachedKey = (key || '').trim();
  _cacheTime = Date.now();
}

/**
 * Get the masked key for display (admin UI).
 * Returns e.g. "AIza••••••••••••••••••••••••••••••••••••••abcd" or '' if not set.
 */
export async function getMaskedGeminiKey() {
  const key = await getGeminiApiKey();
  if (!key) return '';
  if (key.length <= 8) return '•'.repeat(key.length);
  return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
}

/**
 * Get per-user token usage with cost estimate.
 * Gemini 2.5 Flash pricing (as of 2025): ~$0.075 / 1M input tokens, $0.30 / 1M output tokens
 */
export async function getUserTokenStats(userId) {
  const { data, error } = await supabase
    .from('token_usage')
    .select('operation, prompt_tokens, completion_tokens, total_tokens, timecreated')
    .eq('user_id', userId)
    .order('timecreated', { ascending: false });

  if (error) {
    console.warn('Token usage not available:', error.message);
    return { rows: [], totals: { prompt: 0, completion: 0, total: 0, estimatedCostUsd: 0 } };
  }

  let totalPrompt = 0, totalCompletion = 0, totalAll = 0;
  for (const r of data || []) {
    totalPrompt += Number(r.prompt_tokens) || 0;
    totalCompletion += Number(r.completion_tokens) || 0;
    totalAll += Number(r.total_tokens) || 0;
  }

  // Gemini 2.5 Pro pricing: $1.25/1M input tokens, $10.00/1M output tokens (prompts ≤200k)
  const estimatedCostUsd = (totalPrompt / 1_000_000) * 1.25 + (totalCompletion / 1_000_000) * 10.0;

  return {
    rows: (data || []).slice(0, 50),
    totals: { prompt: totalPrompt, completion: totalCompletion, total: totalAll, estimatedCostUsd },
  };
}
