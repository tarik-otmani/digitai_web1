/**
 * AI-based structuring of uploaded course content into sections.
 * Uses Gemini to split raw text into sections, generate learning objectives, and key takeaways.
 */
import { generateContent, extractJsonFromResponse } from './gemini.js';

const MAX_INPUT_CHARS = 120000; // ~30k tokens, leave room for prompt

/**
 * Structure uploaded document text into a course with sections, learning objectives, and key takeaways.
 * @param {string} apikey - Gemini API key
 * @param {string} rawText - Extracted text from PDF/DOCX/TXT/MD
 * @param {string} [suggestedTitle] - Optional title (e.g. filename)
 * @returns {Promise<{ outline: object, sections: Array }>}
 */
export async function structureUploadedContent(rawText, suggestedTitle = '') {
  const rawContent = String(rawText || '').trim();
  if (!rawContent) throw new Error('No content to analyze');

  let input = rawContent;
  if (input.length > MAX_INPUT_CHARS) {
    input = input.slice(0, MAX_INPUT_CHARS) + '\n\n[... document truncated for analysis ...]';
  }

  const titleHint = suggestedTitle ? `Suggested title from filename: "${suggestedTitle}"` : '';

  const prompt = `You are an expert course designer. Analyze the following document and structure it as a course with logical sections.

${titleHint}

DOCUMENT CONTENT:
---
${input}
---

Your task:
1. Split the content into 3-12 logical sections (chapters, topics, or themes). Each section should be a coherent unit.
2. Create a course title (use the suggested title if it fits, or derive one from the content).
3. Write 3-6 learning objectives for the entire course.
4. For each section: extract or summarize the content, and generate 2-4 key takeaways.

Return ONLY valid JSON with this exact structure:
{
  "outline": {
    "title": "Course Title",
    "description": "2-3 sentence course description",
    "learning_objectives": ["objective 1", "objective 2", "objective 3"]
  },
  "sections": [
    {
      "title": "Section 1 Title",
      "content": "Full markdown content for this section. Preserve the original content as much as possible, just organized. Use \\n for newlines.",
      "key_takeaways": ["takeaway 1", "takeaway 2"]
    }
  ]
}

CRITICAL:
- Return ONLY the JSON object, no markdown fences, no extra text.
- The "content" of each section must preserve the original document content for that part. Do not invent new content.
- Escape quotes and newlines properly in JSON strings.
- Use \\n for line breaks inside content strings.`;

  const { text, usage } = await generateContent(prompt, {
    temperature: 0.3,
    maxOutputTokens: 32768,
  });

  const data = extractJsonFromResponse(text);
  if (!data || typeof data !== 'object') throw new Error('Invalid structure from AI');

  const outline = data.outline || {};
  let sections = Array.isArray(data.sections) ? data.sections : [];

  // Normalize sections to match expected format
  sections = sections.map((s, i) => ({
    title: s.title || `Section ${i + 1}`,
    content: normalizeContent(s.content || ''),
    summary: s.summary || '',
    key_takeaways: Array.isArray(s.key_takeaways) ? s.key_takeaways : [],
    practice_questions: Array.isArray(s.practice_questions) ? s.practice_questions : [],
  }));

  return {
    outline: {
      title: outline.title || suggestedTitle || 'Uploaded Course',
      description: outline.description || '',
      learning_objectives: Array.isArray(outline.learning_objectives) ? outline.learning_objectives : [],
    },
    sections,
    usage,
  };
}

function normalizeContent(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\r\n/g, '\n').trim();
}
