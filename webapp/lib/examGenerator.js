/**
 * Exam question generation from course content (Gemini) — port from plugin.
 */
import { generateContent, extractJsonFromResponse } from './gemini.js';

function calculateDistribution(numQuestions, percentages = {}) {
  const pctMcq = percentages.pct_mcq ?? 50;
  const pctTf = percentages.pct_truefalse ?? 20;
  const pctSa = percentages.pct_shortanswer ?? 20;
  const pctEssay = percentages.pct_essay ?? 10;
  const n = numQuestions;
  return {
    mcq: Math.round((n * pctMcq) / 100),
    truefalse: Math.round((n * pctTf) / 100),
    shortanswer: Math.round((n * pctSa) / 100),
    essay: Math.max(0, n - Math.round((n * pctMcq) / 100) - Math.round((n * pctTf) / 100) - Math.round((n * pctSa) / 100)),
  };
}

export async function generateQuestions(apikey, courseTitle, courseContent, numQuestions = 20, difficulty = 'mixed', exampleQuestions = '', percentages = {}, examType = 'moodle') {
  const contentPreview = (courseContent || '').slice(0, 8000);
  const dist = calculateDistribution(numQuestions, percentages);
  const examplesBlock = (exampleQuestions || '').trim();
  const examplesPrompt = examplesBlock ? `EXAMPLE QUESTIONS TO MIMIC STYLE:\n${examplesBlock}\n\n` : '';

  const prompt = `You are an expert educational assessment designer. Generate ${numQuestions} exam questions based on the following course content.

COURSE: ${courseTitle}
EXAM OUTPUT TYPE: ${examType}

COURSE CONTENT:
${contentPreview}

${examplesPrompt}

REQUIRED DISTRIBUTION:
- Multiple choice (MCQ): ${dist.mcq} questions
- True/False: ${dist.truefalse} questions
- Short answer: ${dist.shortanswer} questions
- Essay: ${dist.essay} questions

DIFFICULTY: ${difficulty}

Return ONLY a valid JSON array of questions. Each question must have:
{
  "type": "mcq" | "truefalse" | "shortanswer" | "essay",
  "question": "Question text",
  "options": ["A", "B", "C", "D"] (only for mcq),
  "correct_answer": "exact answer or option letter for mcq",
  "explanation": "Brief explanation of the correct answer",
  "points": 1,
  "difficulty": "easy" | "medium" | "hard"
}

CRITICAL: Return ONLY the JSON array, no markdown fences, no extra text.`;

  const text = await generateContent(apikey, prompt, { temperature: 0.6, maxOutputTokens: 16384 });
  const parsed = extractJsonFromResponse(text);
  const questions = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? [parsed] : []);
  return questions;
}

/**
 * Generate a single question of the given type (for regenerate).
 * @returns {Promise<object>} One question object.
 */
export async function generateSingleQuestion(apikey, courseTitle, courseContent, questionType = 'mcq', difficulty = 'mixed') {
  const contentPreview = (courseContent || '').slice(0, 6000);
  const typeLabel = { mcq: 'Multiple choice', truefalse: 'True/False', shortanswer: 'Short answer', essay: 'Essay' }[questionType] || questionType;

  const prompt = `You are an expert educational assessment designer. Generate exactly ONE exam question based on the following course content.

COURSE: ${courseTitle}

COURSE CONTENT:
${contentPreview}

REQUIREMENTS:
- Question type: ${typeLabel} (${questionType})
- Difficulty: ${difficulty}

Return ONLY a valid JSON object (no array, no markdown). The object must have:
{
  "type": "${questionType}",
  "question": "Question text",
  "options": ["A", "B", "C", "D"] (only for mcq; omit for other types),
  "correct_answer": "exact answer or option letter for mcq",
  "explanation": "Brief explanation of the correct answer",
  "points": 1,
  "difficulty": "easy" | "medium" | "hard"
}

CRITICAL: Return ONLY the JSON object, no markdown fences, no extra text.`;

  const text = await generateContent(apikey, prompt, { temperature: 0.6, maxOutputTokens: 2048 });
  const parsed = extractJsonFromResponse(text);
  return parsed && typeof parsed === 'object' ? parsed : {};
}
