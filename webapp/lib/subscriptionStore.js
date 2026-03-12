import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase.js';

// Subscription Plans
export async function getSubscriptionPlans() {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('active', true)
    .order('price', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getSubscriptionPlan(id) {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', String(id))
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

// User Subscriptions
export async function getUserSubscription(userId) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', String(userId))
    .eq('status', 'active')
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function createUserSubscription(userId, planId) {
  const id = uuidv4();
  const now = Date.now();
  const plan = await getSubscriptionPlan(planId);
  if (!plan) throw new Error('Invalid subscription plan');
  
  let periodEnd = null;
  if (plan.billing_cycle === 'month') {
    periodEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 days from now
  }
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert([{
      id,
      user_id: String(userId),
      plan_id: String(planId),
      status: 'active',
      current_period_start: now,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      timecreated: now,
      timemodified: now
    }])
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserSubscription(userId, updates) {
  const allowed = ['status', 'current_period_end', 'cancel_at_period_end', 'timemodified'];
  const record = { timemodified: Date.now() };
  for (const key of allowed) {
    if (updates[key] !== undefined) record[key] = updates[key];
  }
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .update(record)
    .eq('user_id', String(userId))
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function cancelUserSubscription(userId) {
  return await updateUserSubscription(userId, {
    status: 'cancelled',
    cancel_at_period_end: true
  });
}

// Usage Tracking
export async function getMonthlyUsage(userId, yearMonth) {
  const { data, error } = await supabase
    .from('monthly_usage')
    .select('*')
    .eq('user_id', String(userId))
    .eq('year_month', String(yearMonth))
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function updateMonthlyUsage(userId, usageType) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const existing = await getMonthlyUsage(userId, yearMonth);
  const id = existing ? existing.id : uuidv4();
  
  const updates = {
    courses_created: (existing?.courses_created || 0) + (usageType === 'course' ? 1 : 0),
    exams_created: (existing?.exams_created || 0) + (usageType === 'exam' ? 1 : 0),
    questions_generated: (existing?.questions_generated || 0) + (usageType === 'question' ? 1 : 0),
    timemodified: Date.now()
  };
  
  const { data, error } = await supabase
    .from('monthly_usage')
    .upsert([{
      id,
      user_id: String(userId),
      year_month: yearMonth,
      courses_created: existing?.courses_created || 0,
      exams_created: existing?.exams_created || 0,
      questions_generated: existing?.questions_generated || 0,
      timecreated: existing?.timecreated || Date.now(),
      ...updates
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Helper functions for subscription validation
export async function getUserPlanLimits(userId) {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    // Return free plan limits
    return {
      max_courses_per_month: 1,
      max_questions_per_exam: 10,
      watermark: true,
      pdf_export: false,
      lms_export: false,
      api_access: false,
      mass_generation: false
    };
  }
  
  const plan = subscription.plan;
  return {
    max_courses_per_month: plan.max_courses_per_month,
    max_questions_per_exam: plan.max_questions_per_exam,
    watermark: plan.watermark,
    pdf_export: plan.pdf_export,
    lms_export: plan.lms_export,
    api_access: plan.api_access,
    mass_generation: plan.mass_generation
  };
}

export async function canCreateCourse(userId) {
  const limits = await getUserPlanLimits(userId);
  if (limits.max_courses_per_month === null) return true; // Unlimited
  
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const usage = await getMonthlyUsage(userId, yearMonth);
  
  const currentCourses = usage?.courses_created || 0;
  return currentCourses < limits.max_courses_per_month;
}

export async function canCreateExamWithQuestions(userId, questionCount) {
  const limits = await getUserPlanLimits(userId);
  if (limits.max_questions_per_exam === null) return true; // Unlimited
  
  return questionCount <= limits.max_questions_per_exam;
}
