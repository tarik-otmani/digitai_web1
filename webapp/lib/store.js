import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase.js';

export async function ensureDirs() {
  // No-op for Supabase migration.
}

export async function getCourses() {
  console.log('Fetching courses from Supabase...');
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('timecreated', { ascending: false });
  if (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
  return (data || []).map(applyJsonParsing);
}

export async function getCourse(id) {
  console.log(`Fetching course ${id} from Supabase...`);
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', String(id))
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching course ${id}:`, error);
    throw error;
  }
  return data ? applyJsonParsing(data) : null;
}

function applyJsonParsing(item) {
  if (!item) return item;
  const result = { ...item };
  ['outline_json', 'content_json', 'questions_json'].forEach(field => {
    if (typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch (e) {
        console.warn(`Failed to parse JSON for field ${field}:`, e.message);
      }
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
  console.log(`Saving course ${course.id} to Supabase... Status: ${course.status}, Progress: ${course.generation_progress}`);
  const record = prepareJsonForSave({ ...course, timemodified: Date.now() });
  const { data, error } = await supabase
    .from('courses')
    .upsert(record)
    .select()
    .single();
  if (error) {
    console.error(`Error saving course ${course.id}:`, error);
    throw error;
  }
  return applyJsonParsing(data);
}

export async function addCourse(course) {
  const id = uuidv4();
  console.log(`Adding new course with ID ${id} to Supabase...`);
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
  if (error) {
    console.error('Error adding course:', error);
    throw error;
  }
  return applyJsonParsing(data);
}

export async function deleteCourse(id) {
  console.log(`Deleting course ${id} from Supabase...`);
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', String(id));
  if (error) {
    console.error(`Error deleting course ${id}:`, error);
    throw error;
  }
  return true;
}

export async function getExams() {
  console.log('Fetching exams from Supabase...');
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('timecreated', { ascending: false });
  if (error) {
    console.error('Error fetching exams:', error);
    throw error;
  }
  return (data || []).map(applyJsonParsing);
}

export async function getExam(id) {
  console.log(`Fetching exam ${id} from Supabase...`);
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', String(id))
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching exam ${id}:`, error);
    throw error;
  }
  return data ? applyJsonParsing(data) : null;
}

export async function addExam(exam) {
  const id = uuidv4();
  console.log(`Adding new exam with ID ${id} to Supabase... Course Ref: ${exam.course_ref_id}`);
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
  if (error) {
    console.error('Error adding exam:', error);
    throw error;
  }
  return applyJsonParsing(data);
}

export async function saveExam(exam) {
  console.log(`Saving exam ${exam.id} to Supabase...`);
  const record = prepareJsonForSave({ ...exam, timemodified: Date.now() });
  const { data, error } = await supabase
    .from('exams')
    .upsert(record)
    .select()
    .single();
  if (error) {
    console.error(`Error saving exam ${exam.id}:`, error);
    throw error;
  }
  return applyJsonParsing(data);
}

export async function deleteExam(id) {
  console.log(`Deleting exam ${id} from Supabase...`);
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', String(id));
  if (error) {
    console.error(`Error deleting exam ${id}:`, error);
    throw error;
  }
  return true;
}
