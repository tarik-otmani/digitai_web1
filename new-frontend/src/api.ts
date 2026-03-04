/**
 * DigiAI backend API client. Uses /api when served from same origin.
 */
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function getStoredApiKey(): string {
  try {
    return (localStorage.getItem('digitai_apikey') || '').trim();
  } catch {
    return '';
  }
}

function authBody(): { apikey?: string } {
  const key = getStoredApiKey();
  return key ? { apikey: key } : {};
}

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
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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
  const res = await fetch(url, {
    ...rest,
    headers,
    body: finalBody,
  });
  const text = await res.text();
  let data: T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    throw new Error(res.ok ? text || 'Empty response' : text || `HTTP ${res.status}`);
  }
  if (!res.ok) {
    const err = (data as { error?: string })?.error || text || `HTTP ${res.status}`;
    throw new Error(err);
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
  return request('/courses/outline', {
    method: 'POST',
    body: { ...authBody(), ...params },
  });
}

export async function postCoursesConfirmGeneration(id: string): Promise<{
  success: boolean;
  recordid: string;
  status: string;
  total_sections: number;
  message: string;
}> {
  return request(`/courses/confirm-generation/${id}`, {
    method: 'POST',
    body: authBody(),
  });
}

export async function postCoursesGenerate(params: {
  topic: string;
  keywords?: string;
  level?: string;
  tone?: string;
}): Promise<{
  success: boolean;
  recordid: string;
  status: string;
  previewurl: string;
  message: string;
}> {
  return request('/courses/generate', {
    method: 'POST',
    body: { ...authBody(), ...params },
  });
}

export async function postCoursesUpload(file: File, title?: string): Promise<{
  success: boolean;
  recordid: string;
  status: string;
  previewurl: string;
}> {
  const form = new FormData();
  form.append('file', file);
  if (title) form.append('title', title);
  const key = getStoredApiKey();
  if (key) form.append('apikey', key);
  const r = await request<{ success: boolean; recordid: string; status: string; previewurl: string }>(
    '/courses/upload',
    {
      method: 'POST',
      body: form as unknown as object,
    }
  );
  return r;
}

export async function deleteCourse(id: string): Promise<void> {
  await request(`/courses/${id}`, { method: 'DELETE' });
}

export async function postRegenerateSection(
  courseId: string,
  sectionIndex: number,
  commentary?: string
): Promise<{ success: boolean; section: unknown }> {
  return request(`/courses/${courseId}/regenerate-section`, {
    method: 'POST',
    body: { ...authBody(), sectionIndex, commentary },
  });
}

export function getCourseExportPdfUrl(id: string): string {
  return `${API_BASE}/courses/${id}/export-pdf`;
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
  course_ref_id: string;
  num_questions?: number;
  difficulty?: string;
  pct_mcq?: number;
  pct_truefalse?: number;
  pct_shortanswer?: number;
  pct_essay?: number;
  example_questions?: string;
}): Promise<{ success: boolean; recordid: string; status: string; previewurl: string }> {
  return request('/exams/generate', {
    method: 'POST',
    body: { ...authBody(), ...params },
  });
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
  examId: string,
  questionIndex: number
): Promise<{ success: boolean; question: ExamQuestion; questions: ExamQuestion[] }> {
  return request(`/exams/${examId}/regenerate-question`, {
    method: 'POST',
    body: { ...authBody(), questionIndex },
  });
}

export function getExamExportPdfUrl(id: string): string {
  return `${API_BASE}/exams/${id}/export-pdf`;
}

export async function deleteExam(id: string): Promise<void> {
  await request(`/exams/${id}`, { method: 'DELETE' });
}

// ——— Status ———
export async function getCourseStatus(id: string): Promise<{
  success: boolean;
  status: string;
  generation_progress?: string;
}> {
  return request(`/status/course/${id}`);
}

export function getStoredApiKeyExport(): string {
  return getStoredApiKey();
}

export function setStoredApiKey(key: string): void {
  if (key) localStorage.setItem('digitai_apikey', key);
  else localStorage.removeItem('digitai_apikey');
}

// ——— Auth ———
export interface AuthUser {
  id: string;
  email: string;
  name: string;
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
