import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase.js';

/**
 * Upsert a feedback record (one per user per course).
 */
export async function upsertFeedback(courseId, userId, rating, comment = '') {
  const existing = await getFeedback(courseId, userId);
  if (existing) {
    const { data, error } = await supabase
      .from('feedback')
      .update({ rating, comment, timecreated: Date.now() })
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from('feedback')
    .insert([{ id: uuidv4(), course_id: courseId, user_id: userId, rating, comment, timecreated: Date.now() }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get the feedback for a specific user+course (or null).
 */
export async function getFeedback(courseId, userId) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Admin stats: global average rating, distribution, and recent comments.
 */
export async function getAdminFeedbackStats() {
  const { data, error } = await supabase
    .from('feedback')
    .select('rating, comment, user_id, course_id, timecreated')
    .order('timecreated', { ascending: false });

  if (error) {
    console.warn('Feedback stats not available:', error.message);
    return { averageRating: 0, totalRatings: 0, distribution: {}, recentComments: [] };
  }

  const rows = data || [];
  if (rows.length === 0) {
    return { averageRating: 0, totalRatings: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, recentComments: [] };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of rows) {
    sum += r.rating;
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  }

  const recentComments = rows
    .filter((r) => r.comment && r.comment.trim())
    .slice(0, 10)
    .map((r) => ({ rating: r.rating, comment: r.comment, userId: r.user_id, courseId: r.course_id, timecreated: r.timecreated }));

  return {
    averageRating: Math.round((sum / rows.length) * 10) / 10,
    totalRatings: rows.length,
    distribution,
    recentComments,
  };
}
