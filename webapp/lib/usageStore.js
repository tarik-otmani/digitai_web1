import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase.js';

/**
 * Record token usage for a user/operation (Gemini usageMetadata).
 * @param {string} userId
 * @param {string} operation - e.g. 'course_outline', 'course_section', 'exam_generate', 'upload_structure'
 * @param {{ promptTokenCount?: number, candidatesTokenCount?: number, totalTokenCount?: number }} usage
 */
export async function recordUsage(userId, operation, usage = {}) {
  const prompt = Math.max(0, Number(usage.promptTokenCount) || 0);
  const completion = Math.max(0, Number(usage.candidatesTokenCount) || 0);
  const total = Math.max(0, Number(usage.totalTokenCount) || prompt + completion);
  const record = {
    id: uuidv4(),
    user_id: String(userId),
    operation: String(operation),
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: total,
    timecreated: Date.now(),
  };
  const { error } = await supabase.from('token_usage').insert([record]);
  if (error) {
    console.error('Error recording token usage:', error);
    throw error;
  }
  return record;
}

/**
 * Get total token usage per user (aggregated).
 * @returns {Promise<Array<{ user_id: string, total_tokens: number, prompt_tokens: number, completion_tokens: number }>>}
 */
export async function getUsageByUser() {
  const { data, error } = await supabase
    .from('token_usage')
    .select('user_id, prompt_tokens, completion_tokens, total_tokens');
  if (error) throw error;
  const byUser = new Map();
  for (const row of data || []) {
    const uid = row.user_id;
    if (!byUser.has(uid)) {
      byUser.set(uid, { user_id: uid, total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 });
    }
    const agg = byUser.get(uid);
    agg.total_tokens += Number(row.total_tokens) || 0;
    agg.prompt_tokens += Number(row.prompt_tokens) || 0;
    agg.completion_tokens += Number(row.completion_tokens) || 0;
  }
  return Array.from(byUser.values());
}

/**
 * Get total tokens across all users.
 */
export async function getTotalTokens() {
  const { data, error } = await supabase.from('token_usage').select('total_tokens');
  if (error) throw error;
  let sum = 0;
  for (const row of data || []) {
    sum += Number(row.total_tokens) || 0;
  }
  return sum;
}
