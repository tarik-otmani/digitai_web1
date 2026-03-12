/**
 * Plan definitions and billing logic.
 * Quotas are per-calendar-month (reset on the 1st).
 */

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 'Free',
    coursesPerMonth: 1,
    examQuestionsPerMonth: 10,
    features: ['1 cours / mois', '10 questions examen', 'Watermark sur les exports'],
    color: 'gray',
  },
  creator: {
    id: 'creator',
    name: 'Creator',
    price: '$15/mois',
    coursesPerMonth: 20,
    examQuestionsPerMonth: 50,
    features: ['20 cours / mois', '50 questions examen', 'Export PDF'],
    color: 'indigo',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '$29/mois',
    coursesPerMonth: Infinity,
    examQuestionsPerMonth: Infinity,
    features: ['Cours illimités', 'Questions illimitées', 'Export LMS'],
    color: 'violet',
  },
  institution: {
    id: 'institution',
    name: 'Institutions',
    price: 'Sur demande',
    coursesPerMonth: Infinity,
    examQuestionsPerMonth: Infinity,
    features: ['Génération massive', 'API', 'LMS integration'],
    color: 'amber',
  },
};

/**
 * Get the start-of-current-month timestamp (ms).
 */
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

import { supabase } from './supabase.js';

/**
 * Check if a user is allowed to generate a new course this month.
 * Returns { allowed: true } or { allowed: false, used, quota, planName }
 */
export async function checkCourseQuota(userId) {
  const billing = await getUserBilling(userId);
  const { usage, plan, planId } = billing;

  // Unlimited plans
  if (usage.coursesQuota === null) return { allowed: true };

  if (usage.coursesThisMonth >= usage.coursesQuota) {
    return {
      allowed: false,
      used: usage.coursesThisMonth,
      quota: usage.coursesQuota,
      planId,
      planName: plan.name,
    };
  }
  return { allowed: true };
}

/**
 * Get billing info for a user:
 * - their plan
 * - courses generated this month
 * - exams generated this month (in questions)
 */
export async function getUserBilling(userId) {
  // Get user's plan
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single();
  if (userError) throw userError;

  const planId = userData?.plan || 'free';
  const plan = PLANS[planId] || PLANS.free;
  const since = startOfMonth();

  // Count courses generated this month
  const { count: coursesThisMonth } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .gte('timecreated', since);

  // Count exam questions generated this month
  const { data: examsData } = await supabase
    .from('exams')
    .select('num_questions')
    .eq('owner_id', userId)
    .gte('timecreated', since);

  const questionsThisMonth = (examsData || []).reduce(
    (sum, e) => sum + (Number(e.num_questions) || 0),
    0
  );

  const coursesQuota = plan.coursesPerMonth === Infinity ? null : plan.coursesPerMonth;
  const questionsQuota = plan.examQuestionsPerMonth === Infinity ? null : plan.examQuestionsPerMonth;

  return {
    planId,
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: plan.features,
      color: plan.color,
    },
    usage: {
      coursesThisMonth: coursesThisMonth || 0,
      questionsThisMonth,
      coursesQuota,
      questionsQuota,
    },
    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  };
}
