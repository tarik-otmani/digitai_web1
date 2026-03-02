/**
 * Simple JSON file store for courses and exams (no DB required).
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');
const EXAMS_FILE = path.join(DATA_DIR, 'exams.json');

const defaultCourses = [];
const defaultExams = [];

export async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(COURSES_FILE);
  } catch {
    await fs.writeFile(COURSES_FILE, JSON.stringify(defaultCourses, null, 2));
  }
  try {
    await fs.access(EXAMS_FILE);
  } catch {
    await fs.writeFile(EXAMS_FILE, JSON.stringify(defaultExams, null, 2));
  }
}

export async function getCourses() {
  const raw = await fs.readFile(COURSES_FILE, 'utf8').catch(() => '[]');
  return JSON.parse(raw);
}

export async function getCourse(id) {
  const courses = await getCourses();
  return courses.find((c) => String(c.id) === String(id)) || null;
}

export async function saveCourse(course) {
  const courses = await getCourses();
  const idx = courses.findIndex((c) => String(c.id) === String(course.id));
  if (idx >= 0) courses[idx] = { ...courses[idx], ...course };
  else courses.push(course);
  await fs.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2));
  return course;
}

export async function addCourse(course) {
  const courses = await getCourses();
  const id = String(Date.now());
  const record = { id, ...course, timecreated: Date.now(), timemodified: Date.now() };
  courses.unshift(record);
  await fs.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2));
  return record;
}

export async function deleteCourse(id) {
  const courses = await getCourses();
  const filtered = courses.filter((c) => String(c.id) !== String(id));
  await fs.writeFile(COURSES_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

export async function getExams() {
  const raw = await fs.readFile(EXAMS_FILE, 'utf8').catch(() => '[]');
  return JSON.parse(raw);
}

export async function getExam(id) {
  const exams = await getExams();
  return exams.find((e) => String(e.id) === String(id)) || null;
}

export async function addExam(exam) {
  const exams = await getExams();
  const id = String(Date.now());
  const record = { id, ...exam, timecreated: Date.now(), timemodified: Date.now() };
  exams.unshift(record);
  await fs.writeFile(EXAMS_FILE, JSON.stringify(exams, null, 2));
  return record;
}

export async function saveExam(exam) {
  const exams = await getExams();
  const idx = exams.findIndex((e) => String(e.id) === String(exam.id));
  if (idx >= 0) exams[idx] = { ...exams[idx], ...exam };
  else exams.push(exam);
  await fs.writeFile(EXAMS_FILE, JSON.stringify(exams, null, 2));
  return exam;
}

export async function deleteExam(id) {
  const exams = await getExams();
  const filtered = exams.filter((e) => String(e.id) !== String(id));
  await fs.writeFile(EXAMS_FILE, JSON.stringify(filtered, null, 2));
  return true;
}
