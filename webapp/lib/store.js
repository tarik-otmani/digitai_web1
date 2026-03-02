/**
 * Store for courses and exams — uses Supabase PostgreSQL.
 */
import { supabase } from './supabase.js';

export async function ensureDirs() {
  // No-op for Supabase migration.
}

export async function getCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('timecreated', { ascending: false });
  if (error) throw error;
  return (data || []).map(applyJsonParsing);
}

export async function getCourse(id) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', String(id))
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? applyJsonParsing(data) : null;
}

function applyJsonParsing(item) {
  if (!item) return item;
  const result = { ...item };
  ['outline_json', 'content_json', 'questions_json'].forEach(field => {
    if (typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch (e) { }
    }
  });
  return result;
}

function prepareJsonForSave(item) {
  if (!item) return item;
  const result = { ...item };
  ['outline_json', 'content_json', 'questions_json'].forEach(field => {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch (e) { }
    }
  });
  return result;
}

export async function saveCourse(course) {
  const record = prepareJsonForSave({ ...course, timemodified: Date.now() });
  const { data, error } = await supabase
    .from('courses')
    .upsert(record)
    .select()
    .single();
  if (error) throw error;
  return applyJsonParsing(data);
}

export async function addCourse(course) {
  const id = String(Date.now());
  const record = prepareJsonForSave({
    id,
    ...course,
    timecreated: Date.now(),
    timemodified: Date.now()
  });
  const { data, error } = await supabase
    .from('courses')
    .insert([record])
    .select()
    .single();
  if (error) throw error;
  return applyJsonParsing(data);
}

export async function deleteCourse(id) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', String(id));
  if (error) throw error;
  return true;
}

export async function getExams() {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('timecreated', { ascending: false });
  if (error) throw error;
  return (data || []).map(applyJsonParsing);
}

export async function getExam(id) {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', String(id))
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? applyJsonParsing(data) : null;
}

export async function addExam(exam) {
  const id = String(Date.now());
  const record = prepareJsonForSave({
    id,
    ...exam,
    timecreated: Date.now(),
    timemodified: Date.now()
  });
  const { data, error } = await supabase
    .from('exams')
    .insert([record])
    .select()
    .single();
  if (error) throw error;
  return applyJsonParsing(data);
}

export async function saveExam(exam) {
  const record = prepareJsonForSave({ ...exam, timemodified: Date.now() });
  const { data, error } = await supabase
    .from('exams')
    .upsert(record)
    .select()
    .single();
  if (error) throw error;
  return applyJsonParsing(data);
}

export async function deleteExam(id) {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', String(id));
  if (error) throw error;
  return true;
}
