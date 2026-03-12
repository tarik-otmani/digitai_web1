/**
 * DigiAI backend API client.
 */
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request<T>(
  path: string,
  options: RequestInit & { body?: object } = {}
): Promise<T> {
  const { body, ...rest } = options;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const token = localStorage.getItem('digitai_token');
  const headers: Record<string, string> = {
    ...(rest.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  let finalBody: BodyInit | undefined;
  if (body instanceof FormData) {
    finalBody = body;
    delete headers['Content-Type'];
  } else if (body) {
    finalBody = JSON.stringify(body);
  }
  const res = await fetch(url, { ...rest, headers, body: finalBody });
  const text = await res.text();
  let data: T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    throw new Error(res.ok ? text || 'Empty response' : text || `HTTP ${res.status}`);
  }
  if (!res.ok) {
    const body = data as { error?: string; used?: number; limit?: number; planName?: string };
    const err = body?.error || text || `HTTP ${res.status}`;
    const e = new Error(err) as Error & { apiData?: typeof body };
    e.apiData = body;
    throw e;
  }
  return data;
}

// ——— Courses ———
export interface Course {
  id: string;
  topic: string;
  keywords?: string;
  level?: string;
  tone?: string;
  source: string;
  status: string;
  outline_json?: string | any;
  content_json?: string | any;
  file_content?: string;
  generation_progress?: string;
  timecreated?: number;
  timemodified?: number;
}

export interface OutlineSection {
  title: string;
  description?: string;
  key_topics?: string[];
}

export interface CourseOutline {
  title?: string;
  description?: string;
  learning_objectives?: string[];
  sections: OutlineSection[];
}

export async function getCourses(): Promise<Course[]> {
  const r = await request<{ success: boolean; courses: Course[] }>('/courses');
  return r.courses || [];
}

export async function getCourse(id: string): Promise<Course | null> {
  try {
    const r = await request<{ success: boolean; course: Course }>(`/courses/${id}`);
    return r.course || null;
  } catch {
    return null;
  }
}

export async function patchCourse(
  id: string,
  data: { topic?: string; outline_json?: string | object; content_json?: string | object }
): Promise<Course> {
  const body: Record<string, unknown> = { ...data };
  if (typeof body.outline_json === 'object') body.outline_json = JSON.stringify(body.outline_json);
  if (typeof body.content_json === 'object') body.content_json = JSON.stringify(body.content_json);
  const r = await request<{ success: boolean; course: Course }>(`/courses/${id}`, {
    method: 'PATCH',
    body: body as object,
  });
  return r.course;
}

export async function postCoursesOutline(params: {
  topic: string;
  keywords?: string;
  level?: string;
  tone?: string;
}): Promise<{ success: boolean; recordid: string; status: string; outlinejson: CourseOutline; message: string }> {
  return request('/courses/outline', { method: 'POST', body: params });
}

export async function postCoursesConfirmGeneration(id: string): Promise<{
  success: boolean; recordid: string; status: string; total_sections: number; message: string;
}> {
  return request(`/courses/confirm-generation/${id}`, { method: 'POST', body: {} });
}

export async function postCoursesGenerate(params: {
  topic: string; keywords?: string; level?: string; tone?: string;
}): Promise<{ success: boolean; recordid: string; status: string; previewurl: string; message: string; }> {
  return request('/courses/generate', { method: 'POST', body: params });
}

export async function postCoursesUpload(file: File, title?: string): Promise<{
  success: boolean; recordid: string; status: string; previewurl: string;
}> {
  const form = new FormData();
  form.append('file', file);
  if (title) form.append('title', title);
  return request('/courses/upload', { method: 'POST', body: form as unknown as object });
}

export async function deleteCourse(id: string): Promise<void> {
  await request(`/courses/${id}`, { method: 'DELETE' });
}

export async function postRegenerateSection(
  courseId: string, sectionIndex: number, commentary?: string
): Promise<{ success: boolean; section: unknown }> {
  return request(`/courses/${courseId}/regenerate-section`, {
    method: 'POST', body: { sectionIndex, commentary },
  });
}

export function getCourseExportPdfUrl(id: string): string {
  const token = localStorage.getItem('digitai_token') || '';
  return `${API_BASE}/courses/${id}/export-pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

// ——— Exams ———
export interface Exam {
  id: string;
  course_ref_id: string;
  status: string;
  num_questions: number;
  difficulty?: string;
  questions_json?: string | any;
  course_topic?: string;
}

export interface ExamQuestion {
  type: 'mcq' | 'truefalse' | 'shortanswer' | 'essay';
  question: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  points?: number;
  difficulty?: string;
}

export async function getExams(): Promise<Exam[]> {
  const r = await request<{ success: boolean; exams: Exam[] }>('/exams');
  return r.exams || [];
}

export async function getExam(id: string): Promise<Exam | null> {
  try {
    const r = await request<{ success: boolean; exam: Exam }>(`/exams/${id}`);
    return r.exam || null;
  } catch {
    return null;
  }
}

export async function postExamsGenerate(params: {
  course_ref_id: string; num_questions?: number; difficulty?: string;
  pct_mcq?: number; pct_truefalse?: number; pct_shortanswer?: number; pct_essay?: number; example_questions?: string;
}): Promise<{ success: boolean; recordid: string; status: string; previewurl: string }> {
  return request('/exams/generate', { method: 'POST', body: params });
}

export async function patchExam(
  id: string,
  data: { questions_json: ExamQuestion[] | string }
): Promise<{ success: boolean; exam: Exam }> {
  const body =
    typeof data.questions_json === 'string'
      ? data
      : { questions_json: JSON.stringify(data.questions_json) };
  return request(`/exams/${id}/update`, { method: 'POST', body });
}

export async function postRegenerateQuestion(
  examId: string, questionIndex: number
): Promise<{ success: boolean; question: ExamQuestion; questions: ExamQuestion[] }> {
  return request(`/exams/${examId}/regenerate-question`, { method: 'POST', body: { questionIndex } });
}

export function getExamExportPdfUrl(id: string): string {
  const token = localStorage.getItem('digitai_token') || '';
  return `${API_BASE}/exams/${id}/export-pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

export async function deleteExam(id: string): Promise<void> {
  await request(`/exams/${id}`, { method: 'DELETE' });
}

// ——— Status ———
export interface GeneratedSection {
  title: string;
  content: string;
  summary?: string;
  key_takeaways?: string[];
  practice_questions?: string[];
}

export async function getCourseStatus(id: string): Promise<{
  success: boolean;
  status: string;
  generation_progress?: string;
  outline?: CourseOutline;
  sections_partial?: GeneratedSection[];
}> {
  return request(`/status/course/${id}`);
}

// ——— Auth ———
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  active?: boolean;
}

export async function postAuthRegister(params: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ success: boolean; token: string; user: AuthUser }> {
  return request('/auth/register', { method: 'POST', body: params });
}

export async function postAuthLogin(params: {
  email: string;
  password: string;
}): Promise<{ success: boolean; token: string; user: AuthUser }> {
  return request('/auth/login', { method: 'POST', body: params });
}

export async function getAuthMe(): Promise<{ success: boolean; user: AuthUser }> {
  const token = localStorage.getItem('digitai_token');
  return request('/auth/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function getStoredToken(): string | null {
  return localStorage.getItem('digitai_token');
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem('digitai_token', token);
  else localStorage.removeItem('digitai_token');
}

// ——— Admin ———
export interface AdminStats {
  stats: { usersCount: number; coursesCount: number; examsCount: number; totalTokens: number };
  courseTitles: { id: string; topic: string; owner_id: string }[];
  examTitles: { id: string; course_ref_id: string; num_questions: number; owner_id: string }[];
  usageByUser: { user_id: string; total_tokens: number; coursesCount: number; examsCount: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  plan?: string;
  timecreated?: number;
  coursesCount: number;
  examsCount: number;
  totalTokens: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const r = await request<{ success: boolean; stats: AdminStats['stats']; courseTitles: AdminStats['courseTitles']; examTitles: AdminStats['examTitles']; usageByUser: AdminStats['usageByUser'] }>('/admin/stats');
  return r as AdminStats;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const r = await request<{ success: boolean; users: AdminUser[] }>('/admin/users');
  return r.users || [];
}

export async function patchAdminUser(
  userId: string,
  data: { active?: boolean; role?: string }
): Promise<{ success: boolean; user: AdminUser }> {
  return request(`/admin/users/${userId}`, { method: 'PATCH', body: data });
}

// ——— Admin: Gemini key ———
export async function getAdminGeminiKey(): Promise<{ success: boolean; maskedKey: string; isSet: boolean }> {
  return request('/admin/gemini-key');
}

export async function postAdminGeminiKey(apiKey: string): Promise<{ success: boolean; maskedKey: string }> {
  return request('/admin/gemini-key', { method: 'POST', body: { apiKey } });
}

// ——— User: token usage ———
export interface UsageRow {
  operation: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  timecreated: number;
}

export interface UsageTotals {
  prompt: number;
  completion: number;
  total: number;
  estimatedCostUsd: number;
}

export async function getUsageMe(): Promise<{ success: boolean; rows: UsageRow[]; totals: UsageTotals }> {
  return request('/usage/me');
}

// ——— Feedback ———
export interface CourseFeedback {
  id?: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string;
  timecreated: number;
}

export interface FeedbackStats {
  averageRating: number;
  totalRatings: number;
  distribution: Record<string, number>;
  recentComments: { rating: number; comment: string; userId: string; courseId: string; timecreated: number }[];
}

export async function postCourseFeedback(
  courseId: string,
  rating: number,
  comment?: string
): Promise<{ success: boolean; feedback: CourseFeedback }> {
  return request(`/courses/${courseId}/feedback`, { method: 'POST', body: { rating, comment: comment || '' } });
}

export async function getCourseFeedback(courseId: string): Promise<{ success: boolean; feedback: CourseFeedback | null }> {
  return request(`/courses/${courseId}/feedback`);
}

export async function getAdminFeedbackStats(): Promise<{ success: boolean } & FeedbackStats> {
  return request('/admin/feedback-stats');
}

// ——— Billing ———
export interface PlanInfo {
  id: string;
  name: string;
  price: string;
  features: string[];
  color: string;
}

export interface BillingUsage {
  coursesThisMonth: number;
  questionsThisMonth: number;
  coursesQuota: number | null;    // null = unlimited
  questionsQuota: number | null;
}

export interface BillingData {
  planId: string;
  plan: PlanInfo;
  usage: BillingUsage;
  resetDate: string;
}

export async function getBillingMe(): Promise<{ success: boolean } & BillingData> {
  return request('/billing/me');
}

export async function patchAdminUserPlan(
  userId: string,
  plan: string
): Promise<{ success: boolean; user: AdminUser }> {
  return request(`/admin/users/${userId}/plan`, { method: 'PATCH', body: { plan } });
}
