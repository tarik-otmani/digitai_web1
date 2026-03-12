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
import { buildCoursePdf, buildExamPdf } from '../lib/pdfGenerator.js';
import * as userStore from '../lib/userStore.js';
import * as usageStore from '../lib/usageStore.js';
import * as settingsStore from '../lib/settingsStore.js';
import * as feedbackStore from '../lib/feedbackStore.js';
import * as billingStore from '../lib/billingStore.js';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../lib/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname || '.bin')),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

export const apiRouter = Router();

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
    if (user.active === false) return res.status(403).json({ success: false, error: 'Account is disabled' });

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
      user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user', active: user.active !== false },
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
      user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user', active: user.active !== false },
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
      user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user', active: user.active !== false },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function authenticateAdmin(req, res, next) {
  authenticate(req, res, function adminCheck() {
    if (res.headersSent) return;
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
  });
}

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
    const quota = await billingStore.checkCourseQuota(req.user.id);
    if (!quota.allowed) {
      return res.status(403).json({ success: false, error: 'QUOTA_EXCEEDED', used: quota.used, limit: quota.quota, planName: quota.planName });
    }
    const { topic, keywords, level, tone } = req.body || {};
    if (!topic) return res.status(400).json({ success: false, error: 'topic required' });
    const kw = typeof keywords === 'string' ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : [];
    const outlineResult = await generateOutline(topic, kw, level || 'intermediate', tone || 'professional');
    const outline = outlineResult?.outline;
    if (outlineResult?.usage) await usageStore.recordUsage(req.user.id, 'course_outline', outlineResult.usage);
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
          const sectionResult = await generateSectionContent(
            outline.title ?? current.topic,
            sec.title ?? 'Section',
            sec.description ?? '',
            sec.key_topics ?? [],
            current.level ?? 'intermediate',
            current.tone ?? 'professional'
          );
          if (sectionResult?.usage) await usageStore.recordUsage(ownerId, 'course_section', sectionResult.usage);
          const content = sectionResult?.content;
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
        current.sections_partial = sectionsContent;
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
      current.sections_partial = null;
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
    const quota = await billingStore.checkCourseQuota(req.user.id);
    if (!quota.allowed) {
      return res.status(403).json({ success: false, error: 'QUOTA_EXCEEDED', used: quota.used, limit: quota.limit, planName: quota.planName });
    }
    const { topic, keywords, level, tone } = req.body || {};
    if (!topic) return res.status(400).json({ success: false, error: 'topic required' });
    const kw = typeof keywords === 'string' ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : [];
    const result = await generateFullCourse(topic, kw, level || 'intermediate', tone || 'professional');
    if (!result.success) return res.status(500).json({ success: false, error: result.error });
    if (result.totalUsage) await usageStore.recordUsage(req.user.id, 'course_full', result.totalUsage);

    const course = await store.addCourse({
      owner_id: req.user.id,
      topic,
      keywords: (kw || []).join(', '),
      level: level || 'intermediate',
      tone: tone || 'professional',
      source: 'generated',
      status: 'generated',
      outline_json: JSON.stringify(result.outline),
      content_json: JSON.stringify({ outline: result.outline, sections: result.sections }),
    });
    res.json({
      success: true,
      recordid: course.id,
      status: 'generated',
      previewurl: `/course/${course.id}`,
      message: 'Course generated.',
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.post('/courses/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const quota = await billingStore.checkCourseQuota(req.user.id);
    if (!quota.allowed) {
      return res.status(403).json({ success: false, error: 'QUOTA_EXCEEDED', used: quota.used, limit: quota.quota, planName: quota.planName });
    }
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const suggestedTitle = req.body?.title || req.file.originalname?.replace(/\.[^.]+$/, '') || 'Uploaded course';
    if (!isSupported(req.file.originalname)) {
      return res.status(400).json({ success: false, error: 'Unsupported format. Use PDF, DOCX, TXT, or MD.' });
    }
    const fileContent = await extractText(req.file.path, req.file.originalname);
    const uploadResult = await structureUploadedContent(fileContent, suggestedTitle);
    const { outline, sections, usage } = uploadResult;
    if (usage) await usageStore.recordUsage(req.user.id, 'upload_structure', usage);
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
    const regenResult = await regenerateSection(
      courseTitle,
      sectionData,
      commentary || '',
      course.level || 'intermediate',
      course.tone || 'professional'
    );
    const newSection = regenResult?.content;
    if (!newSection) return res.status(500).json({ success: false, error: 'Regeneration failed' });
    if (regenResult?.usage) await usageStore.recordUsage(req.user.id, 'course_regenerate_section', regenResult.usage);
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
    const examResult = await generateQuestions(
      course.topic,
      courseText,
      num,
      difficulty || 'mixed',
      example_questions || '',
      { pct_mcq, pct_truefalse, pct_shortanswer, pct_essay },
      'moodle'
    );
    const questions = examResult?.questions ?? [];
    if (examResult?.usage) await usageStore.recordUsage(req.user.id, 'exam_generate', examResult.usage);

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
    const singleResult = await generateSingleQuestion(course.topic, courseText, qType, difficulty);
    const newQuestion = singleResult?.question;
    if (!newQuestion || !newQuestion.question) return res.status(500).json({ success: false, error: 'Regeneration failed' });
    if (singleResult?.usage) await usageStore.recordUsage(req.user.id, 'exam_regenerate_question', singleResult.usage);

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
    const outline = course.outline_json || null;
    const sectionsPartial = course.sections_partial || null;
    res.json({
      success: true,
      status: course.status,
      generation_progress: course.generation_progress,
      outline,
      sections_partial: sectionsPartial,
    });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// ——— Admin ———
apiRouter.get('/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const [users, courses, exams, usageByUser, totalTokens] = await Promise.all([
      userStore.getUsers(),
      store.getAllCoursesForAdmin(),
      store.getAllExamsForAdmin(),
      usageStore.getUsageByUser(),
      usageStore.getTotalTokens(),
    ]);
    const usageMap = new Map(usageByUser.map((u) => [u.user_id, u]));
    const courseCountByUser = new Map();
    const examCountByUser = new Map();
    for (const c of courses) {
      const uid = c.owner_id;
      if (uid) courseCountByUser.set(uid, (courseCountByUser.get(uid) || 0) + 1);
    }
    for (const e of exams) {
      const uid = e.owner_id;
      if (uid) examCountByUser.set(uid, (examCountByUser.get(uid) || 0) + 1);
    }
    const courseTitles = courses.slice(0, 50).map((c) => ({ id: c.id, topic: c.topic, owner_id: c.owner_id }));
    const examTitles = exams.slice(0, 50).map((e) => ({ id: e.id, course_ref_id: e.course_ref_id, num_questions: e.num_questions, owner_id: e.owner_id }));
    res.json({
      success: true,
      stats: {
        usersCount: users.length,
        coursesCount: courses.length,
        examsCount: exams.length,
        totalTokens,
      },
      courseTitles,
      examTitles,
      usageByUser: usageByUser.map((u) => ({
        ...u,
        coursesCount: courseCountByUser.get(u.user_id) || 0,
        examsCount: examCountByUser.get(u.user_id) || 0,
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.get('/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const [users, courses, exams, usageByUser] = await Promise.all([
      userStore.getUsers(),
      store.getAllCoursesForAdmin(),
      store.getAllExamsForAdmin(),
      usageStore.getUsageByUser(),
    ]);
    const usageMap = new Map(usageByUser.map((u) => [u.user_id, u]));
    const courseCountByUser = new Map();
    const examCountByUser = new Map();
    for (const c of courses) {
      const uid = c.owner_id;
      if (uid) courseCountByUser.set(uid, (courseCountByUser.get(uid) || 0) + 1);
    }
    for (const e of exams) {
      const uid = e.owner_id;
      if (uid) examCountByUser.set(uid, (examCountByUser.get(uid) || 0) + 1);
    }
    const list = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role || 'user',
      active: u.active !== false,
      plan: u.plan || 'free',
      timecreated: u.timecreated,
      coursesCount: courseCountByUser.get(u.id) || 0,
      examsCount: examCountByUser.get(u.id) || 0,
      totalTokens: (usageMap.get(u.id) || {}).total_tokens || 0,
    }));
    res.json({ success: true, users: list });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.patch('/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { active, role } = req.body || {};
    const updates = {};
    if (typeof active === 'boolean') updates.active = active;
    if (role === 'admin' || role === 'user') updates.role = role;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'Provide active and/or role to update' });
    }
    const user = await userStore.updateUser(req.params.id, updates);
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user', active: user.active !== false } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ——— Admin: Gemini API key management ———
apiRouter.get('/admin/gemini-key', authenticateAdmin, async (req, res) => {
  try {
    const masked = await settingsStore.getMaskedGeminiKey();
    res.json({ success: true, maskedKey: masked, isSet: masked.length > 0 });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.post('/admin/gemini-key', authenticateAdmin, async (req, res) => {
  try {
    const { apiKey } = req.body || {};
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ success: false, error: 'apiKey is required' });
    }
    await settingsStore.setGeminiApiKey(apiKey, req.user.id);
    const masked = await settingsStore.getMaskedGeminiKey();
    res.json({ success: true, maskedKey: masked });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ——— User: token usage & cost ———
apiRouter.get('/usage/me', authenticate, async (req, res) => {
  try {
    const data = await settingsStore.getUserTokenStats(req.user.id);
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ——— Course feedback ———
apiRouter.post('/courses/:id/feedback', authenticate, async (req, res) => {
  try {
    const course = await store.getCourse(req.params.id, req.user.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    const { rating, comment } = req.body || {};
    const r = parseInt(rating, 10);
    if (!r || r < 1 || r > 5) return res.status(400).json({ success: false, error: 'rating must be 1–5' });
    const fb = await feedbackStore.upsertFeedback(req.params.id, req.user.id, r, comment || '');
    res.json({ success: true, feedback: fb });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

apiRouter.get('/courses/:id/feedback', authenticate, async (req, res) => {
  try {
    const fb = await feedbackStore.getFeedback(req.params.id, req.user.id);
    res.json({ success: true, feedback: fb });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ——— Admin: feedback stats ———
apiRouter.get('/admin/feedback-stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await feedbackStore.getAdminFeedbackStats();
    res.json({ success: true, ...stats });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ——— User: billing / plan ———
apiRouter.get('/billing/me', authenticate, async (req, res) => {
  try {
    const billing = await billingStore.getUserBilling(req.user.id);
    res.json({ success: true, ...billing });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ——— Admin: update user plan ———
apiRouter.patch('/admin/users/:id/plan', authenticateAdmin, async (req, res) => {
  try {
    const { plan } = req.body || {};
    const validPlans = ['free', 'creator', 'pro', 'institution'];
    if (!plan || !validPlans.includes(plan)) {
      return res.status(400).json({ success: false, error: `plan must be one of: ${validPlans.join(', ')}` });
    }
    const user = await userStore.updateUser(req.params.id, { plan });
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user', active: user.active !== false, plan: user.plan || 'free' } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
