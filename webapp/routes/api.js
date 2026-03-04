/**
 * DigiAI API routes — course generation, upload, exam, preview, PDF.
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import * as store from '../lib/store.js';
import { generateOutline, generateSectionContent, generateFullCourse, regenerateSection } from '../lib/courseGenerator.js';
import { generateQuestions, generateSingleQuestion } from '../lib/examGenerator.js';
import { extractText, isSupported } from '../lib/uploadParser.js';
import { structureUploadedContent } from '../lib/uploadAnalyzer.js';
import { getApiKey } from '../lib/gemini.js';
import { buildCoursePdf, buildExamPdf } from '../lib/pdfGenerator.js';
import * as userStore from '../lib/userStore.js';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../lib/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname || '.bin')),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

export const apiRouter = Router();

function getApikey(req) {
  return (req.body?.apikey || req.query?.apikey || getApiKey() || '').trim();
}

/**
 * Middleware to protect routes with JWT.
 */
async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : (req.body?.token || req.query?.token || null);
    if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });

    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ success: false, error: 'Invalid or expired token' });

    const user = await userStore.getUserById(payload.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    req.user = user;
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// ——— Auth ———
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    const emailTrim = String(email || '').trim().toLowerCase();
    const passwordVal = String(password || '');
    const nameTrim = String(name || '').trim() || emailTrim.split('@')[0];

    if (!emailTrim) return res.status(400).json({ success: false, error: 'Email is required' });
    if (passwordVal.length < 6) return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });

    const existing = await userStore.getUserByEmail(emailTrim);
    if (existing) return res.status(400).json({ success: false, error: 'Email already registered' });

    const user = await userStore.addUser({
      email: emailTrim,
      password: hashPassword(passwordVal),
      name: nameTrim,
    });

    const token = signToken({ id: user.id, email: user.email });
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailTrim = String(email || '').trim().toLowerCase();
    const passwordVal = String(password || '');

    if (!emailTrim || !passwordVal) return res.status(400).json({ success: false, error: 'Email and password required' });

    const user = await userStore.getUserByEmail(emailTrim);
    if (!user || !verifyPassword(passwordVal, user.password)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, email: user.email });
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.get('/auth/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ success: false, error: 'Invalid or expired token' });

    const user = await userStore.getUserById(payload.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ——— Courses ———
apiRouter.get('/courses', authenticate, async (req, res) => {
  try {
    const courses = await store.getCourses(req.user.id);
    res.json({ success: true, courses });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.get('/courses/:id', authenticate, async (req, res) => {
  try {
    const course = await store.getCourse(req.params.id, req.user.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    res.json({ success: true, course });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Update course (outline and/or content) — for editing plan before generate, or editing sections after.
apiRouter.patch('/courses/:id', authenticate, async (req, res) => {
  try {
    const course = await store.getCourse(req.params.id, req.user.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    const { topic, outline_json, content_json } = req.body || {};
    if (topic !== undefined) course.topic = topic;
    if (outline_json !== undefined) course.outline_json = typeof outline_json === 'string' ? outline_json : JSON.stringify(outline_json);
    if (content_json !== undefined) course.content_json = typeof content_json === 'string' ? content_json : JSON.stringify(content_json);
    course.timemodified = Date.now();
    await store.saveCourse(course);
    res.json({ success: true, course });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.post('/courses/outline', authenticate, async (req, res) => {
  try {
    const apikey = getApikey(req);
    const { topic, keywords, level, tone } = req.body || {};
    if (!topic) return res.status(400).json({ success: false, error: 'topic required' });
    const kw = typeof keywords === 'string' ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : [];
    const outline = await generateOutline(apikey, topic, kw, level || 'intermediate', tone || 'professional');
    const course = await store.addCourse({
      owner_id: req.user.id,
      topic,
      keywords: (kw || []).join(', '),
      level: level || 'intermediate',
      tone: tone || 'professional',
      source: 'generated',
      status: 'outline_generated',
      outline_json: JSON.stringify(outline),
    });
    res.json({
      success: true,
      recordid: course.id,
      status: 'outline_generated',
      outlinejson: outline,
      message: 'Outline generated. Confirm to generate full content.',
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.post('/courses/confirm-generation/:id', authenticate, async (req, res) => {
  try {
    const apikey = getApikey(req);
    const course = await store.getCourse(req.params.id, req.user.id);
    if (!course || course.status !== 'outline_generated') {
      return res.status(400).json({ success: false, error: 'Course not found or not in outline state' });
    }
    const outline = typeof course.outline_json === 'string' ? JSON.parse(course.outline_json) : course.outline_json;
    const sections = outline?.sections ?? [];
    course.status = 'generating';
    course.generation_progress = `0/${sections.length}`;
    await store.saveCourse(course);
    console.log(`Started generation for course ${course.id}. Total sections: ${sections.length}`);

    // Run section generation in background so client can poll progress
    const courseId = course.id;
    const ownerId = req.user.id;
    const runGeneration = async () => {
      const sectionsContent = [];
      let current = await store.getCourse(courseId, ownerId);
      if (!current || current.status !== 'generating') return;
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        try {
          const content = await generateSectionContent(
            apikey,
            outline.title ?? current.topic,
            sec.title ?? 'Section',
            sec.description ?? '',
            sec.key_topics ?? [],
            current.level ?? 'intermediate',
            current.tone ?? 'professional'
          );
          sectionsContent.push(
            content || {
              title: sec.title,
              content: `# ${sec.title}\n\nContent generation failed.`,
              summary: sec.description ?? '',
              key_takeaways: [],
              practice_questions: [],
            }
          );
        } catch (err) {
          sectionsContent.push({
            title: sec.title,
            content: `# ${sec.title}\n\nContent generation failed: ${err.message}`,
            summary: sec.description ?? '',
            key_takeaways: [],
            practice_questions: [],
          });
        }
        current = await store.getCourse(courseId, ownerId);
        if (!current) return;
        current.generation_progress = `${i + 1}/${sections.length}`;
        await store.saveCourse(current);
      }
      current = await store.getCourse(courseId, ownerId);
      if (!current) {
        console.error(`Course ${courseId} lost during generation!`);
        return;
      }
      current.status = 'generated';
      current.content_json = { outline, sections: sectionsContent };
      current.generation_progress = `${sections.length}/${sections.length}`;
      await store.saveCourse(current);
      console.log(`Finished generation for course ${courseId}.`);
    };
    setImmediate(runGeneration);

    res.json({
      success: true,
      recordid: course.id,
      status: 'generating',
      total_sections: sections.length,
      message: 'Generation started. Poll /api/status/course/:id for progress.',
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.post('/courses/generate', authenticate, async (req, res) => {
  try {
    const apikey = getApikey(req);
    const { topic, keywords, level, tone } = req.body || {};
    if (!topic) return res.status(400).json({ success: false, error: 'topic required' });
    const kw = typeof keywords === 'string' ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : [];
    const result = await generateFullCourse(apikey, topic, kw, level || 'intermediate', tone || 'professional');
    if (!result.success) return res.status(500).json({ success: false, error: result.error });

    const course = await store.addCourse({
      owner_id: req.user.id,
      topic,
      keywords: (kw || []).join(', '),
      level: level || 'intermediate',
      tone: tone || 'professional',
      source: 'generated',
      status: 'generated',
      outline_json: JSON.stringify(result.outline),
      content_json: JSON.stringify(result),
    });
    res.json({
      success: true,
      recordid: course.id,
      status: 'generated',
      previewurl: `/dashboard.html#course-${course.id}`,
      message: 'Course generated.',
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.post('/courses/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const suggestedTitle = req.body?.title || req.file.originalname?.replace(/\.[^.]+$/, '') || 'Uploaded course';
    if (!isSupported(req.file.originalname)) {
      return res.status(400).json({ success: false, error: 'Unsupported format. Use PDF, DOCX, TXT, or MD.' });
    }
    const apikey = getApikey(req);
    if (!apikey) {
      return res.status(400).json({ success: false, error: 'API key required. Set your Gemini API key in Settings to structure uploaded content into sections.' });
    }
    const fileContent = await extractText(req.file.path, req.file.originalname);
    const { outline, sections } = await structureUploadedContent(apikey, fileContent, suggestedTitle);
    const contentData = { outline, sections };
    const course = await store.addCourse({
      owner_id: req.user.id,
      topic: outline.title || suggestedTitle,
      source: 'uploaded',
      status: 'generated',
      file_content: fileContent,
      outline_json: JSON.stringify(outline),
      content_json: JSON.stringify(contentData),
    });
    res.json({
      success: true,
      recordid: course.id,
      status: 'generated',
      previewurl: `/course/${course.id}`,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.delete('/courses/:id', authenticate, async (req, res) => {
  try {
    await store.deleteCourse(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Regenerate a single section (optional commentary).
apiRouter.post('/courses/:id/regenerate-section', authenticate, async (req, res) => {
  try {
    const apikey = getApikey(req);
    const course = await store.getCourse(req.params.id, req.user.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    const { sectionIndex, commentary } = req.body || {};
    const idx = parseInt(sectionIndex, 10);
    if (isNaN(idx) || idx < 0) return res.status(400).json({ success: false, error: 'sectionIndex required' });
    let data = { outline: {}, sections: [] };
    try {
      data = typeof course.content_json === 'string' ? JSON.parse(course.content_json) : course.content_json;
    } catch { }
    const sections = data.sections || [];
    if (idx >= sections.length) return res.status(400).json({ success: false, error: 'Section index out of range' });
    const courseTitle = data.outline?.title || course.topic || 'Course';
    const sectionData = sections[idx];
    const newSection = await regenerateSection(
      apikey,
      courseTitle,
      sectionData,
      commentary || '',
      course.level || 'intermediate',
      course.tone || 'professional'
    );
    if (!newSection) return res.status(500).json({ success: false, error: 'Regeneration failed' });
    sections[idx] = newSection;
    data.sections = sections;
    course.content_json = JSON.stringify(data);
    course.timemodified = Date.now();
    await store.saveCourse(course);
    res.json({ success: true, section: newSection });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Export course as PDF.
apiRouter.get('/courses/:id/export-pdf', authenticate, async (req, res) => {
  try {
    const course = await store.getCourse(req.params.id, req.user.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    const pdfBuffer = await buildCoursePdf(course);
    const filename = `${(course.topic || 'course').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ——— Exams ———
apiRouter.get('/exams', authenticate, async (req, res) => {
  try {
    const exams = await store.getExams(req.user.id);
    const courses = await store.getCourses(req.user.id);
    const byId = Object.fromEntries(courses.map((c) => [c.id, c]));
    const withTopic = exams.map((e) => ({ ...e, course_topic: byId[e.course_ref_id]?.topic ?? 'Unknown' }));
    res.json({ success: true, exams: withTopic });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.get('/exams/:id', authenticate, async (req, res) => {
  try {
    const exam = await store.getExam(req.params.id, req.user.id);
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });
    const courses = await store.getCourses(req.user.id);
    const course = courses.find((c) => String(c.id) === String(exam.course_ref_id));
    const examWithTopic = { ...exam, course_topic: course?.topic ?? exam.course_topic ?? 'Unknown' };
    res.json({ success: true, exam: examWithTopic });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.post('/exams/generate', authenticate, async (req, res) => {
  try {
    const apikey = getApikey(req);
    const { course_ref_id, num_questions, difficulty, pct_mcq, pct_truefalse, pct_shortanswer, pct_essay, example_questions } = req.body || {};
    if (!course_ref_id) return res.status(400).json({ success: false, error: 'course_ref_id required' });
    const course = await store.getCourse(course_ref_id, req.user.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    let courseText = '';
    try {
      const data = typeof course.content_json === 'string' ? JSON.parse(course.content_json) : course.content_json;
      const sections = data?.sections ?? [];
      courseText = sections.map((s) => (s.content || s.title || '')).join('\n\n');
    } catch {
      courseText = course.file_content || course.topic || '';
    }
    if (!courseText) courseText = course.topic || 'General knowledge';

    const num = Math.min(50, Math.max(5, parseInt(num_questions, 10) || 20));
    const questions = await generateQuestions(
      apikey,
      course.topic,
      courseText,
      num,
      difficulty || 'mixed',
      example_questions || '',
      { pct_mcq, pct_truefalse, pct_shortanswer, pct_essay },
      'moodle'
    );

    const exam = await store.addExam({
      owner_id: req.user.id,
      course_ref_id: String(course_ref_id),
      status: 'generated',
      num_questions: questions.length,
      difficulty: difficulty || 'mixed',
      questions_json: questions,
    });
    console.log(`Generated exam ${exam.id} for course ${course_ref_id}`);
    res.json({
      success: true,
      recordid: exam.id,
      status: 'generated',
      previewurl: `/preview-exam.html?id=${exam.id}`,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

async function updateExamQuestions(req, res) {
  try {
    const exam = await store.getExam(req.params.id, req.user.id);
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });
    const { questions_json } = req.body || {};
    if (questions_json !== undefined) {
      exam.questions_json = typeof questions_json === 'string' ? questions_json : JSON.stringify(questions_json);
      exam.timemodified = Date.now();
      await store.saveExam(exam);
    }
    res.json({ success: true, exam });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

apiRouter.patch('/exams/:id', authenticate, updateExamQuestions);
apiRouter.post('/exams/:id/update', authenticate, updateExamQuestions);

apiRouter.post('/exams/:id/regenerate-question', authenticate, async (req, res) => {
  try {
    const apikey = getApikey(req);
    const exam = await store.getExam(req.params.id, req.user.id);
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });
    const { questionIndex } = req.body || {};
    const idx = parseInt(questionIndex, 10);
    if (isNaN(idx) || idx < 0) return res.status(400).json({ success: false, error: 'questionIndex required' });

    let questions = [];
    try {
      questions = typeof exam.questions_json === 'string' ? JSON.parse(exam.questions_json) : exam.questions_json;
      if (!Array.isArray(questions)) questions = [];
    } catch { }
    if (idx >= questions.length) return res.status(400).json({ success: false, error: 'Question index out of range' });

    const course = await store.getCourse(exam.course_ref_id, req.user.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    let courseText = '';
    try {
      const data = typeof course.content_json === 'string' ? JSON.parse(course.content_json) : course.content_json;
      const sections = data?.sections ?? [];
      courseText = sections.map((s) => (s.content || s.title || '')).join('\n\n');
    } catch {
      courseText = course.file_content || course.topic || '';
    }
    if (!courseText) courseText = course.topic || 'General knowledge';

    const existing = questions[idx];
    const qType = existing?.type || 'mcq';
    const difficulty = exam.difficulty || 'mixed';
    const newQuestion = await generateSingleQuestion(apikey, course.topic, courseText, qType, difficulty);
    if (!newQuestion || !newQuestion.question) return res.status(500).json({ success: false, error: 'Regeneration failed' });

    questions[idx] = { ...existing, ...newQuestion, type: newQuestion.type || qType };
    exam.questions_json = JSON.stringify(questions);
    exam.timemodified = Date.now();
    await store.saveExam(exam);

    res.json({ success: true, question: questions[idx], questions });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.get('/exams/:id/export-pdf', authenticate, async (req, res) => {
  try {
    const exam = await store.getExam(req.params.id, req.user.id);
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });
    const courses = await store.getCourses(req.user.id);
    const course = courses.find((c) => String(c.id) === String(exam.course_ref_id));
    const courseTopic = course?.topic || exam.course_topic || '';
    const pdfBuffer = await buildExamPdf(exam, courseTopic);
    const filename = `exam-${(courseTopic || 'exam').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.delete('/exams/:id', authenticate, async (req, res) => {
  try {
    await store.deleteExam(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ——— Status (for polling) ———
apiRouter.get('/status/course/:id', authenticate, async (req, res) => {
  try {
    const course = await store.getCourse(req.params.id, req.user.id);
    if (!course) return res.status(404).json({ success: false });
    res.json({ success: true, status: course.status, generation_progress: course.generation_progress });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});
