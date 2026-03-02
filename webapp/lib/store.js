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
  return data || [];
}

export async function getCourse(id) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', String(id))
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function saveCourse(course) {
  const record = { ...course, timemodified: Date.now() };
  const { data, error } = await supabase
    .from('courses')
    .upsert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addCourse(course) {
  const id = String(Date.now());
  const record = {
    id,
    ...course,
    timecreated: Date.now(),
    timemodified: Date.now()
  };
  const { data, error } = await supabase
    .from('courses')
    .insert([record])
    .select()
    .single();
  if (error) throw error;
  return data;
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
  return data || [];
}

export async function getExam(id) {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', String(id))
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function addExam(exam) {
  const id = String(Date.now());
  const record = {
    id,
    ...exam,
    timecreated: Date.now(),
    timemodified: Date.now()
  };
  const { data, error } = await supabase
    .from('exams')
    .insert([record])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveExam(exam) {
  const record = { ...exam, timemodified: Date.now() };
  const { data, error } = await supabase
    .from('exams')
    .upsert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExam(id) {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', String(id));
  if (error) throw error;
  return true;
}
