/**
 * Course outline and section content generation (Gemini) — port from plugin.
 */
import { generateContent, extractJsonFromResponse } from './gemini.js';

export function normalizeSectionContent(content) {
  if (typeof content !== 'string' || content === '') return content;
  return content.replace(/\r\n/g, '\n').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
}

export async function generateOutline(apikey, topic, keywords = [], level = 'intermediate', tone = 'professional') {
  const keywordsstr = keywords?.length ? keywords.join(', ') : 'general concepts';
  const prompt = `You are an expert course designer. Create a comprehensive course outline.

COURSE TOPIC: ${topic}
KEYWORDS: ${keywordsstr}
TARGET LEVEL: ${level}
TONE: ${tone}

Generate a structured course outline with 5-8 sections. Each section should build on previous ones.

Return ONLY valid JSON with this structure:
{
    "title": "Course Title",
    "description": "2-3 sentence description",
    "learning_objectives": ["objective 1", "objective 2", ...],
    "sections": [
        {
            "title": "Section Title",
            "description": "What this section covers",
            "key_topics": ["topic1", "topic2"],
            "order": 1
        }
    ],
    "estimated_duration_hours": 10,
    "difficulty_level": "beginner|intermediate|advanced"
}

CRITICAL: Return ONLY the JSON object, no markdown fences, no extra text.`;

  const { text, usage } = await generateContent(apikey, prompt, { temperature: 0.7, maxOutputTokens: 8192 });
  const outline = extractJsonFromResponse(text);
  return { outline, usage };
}

export async function generateSectionContent(apikey, courseTitle, sectionTitle, sectionDescription, keyTopics = [], level = 'intermediate', tone = 'professional') {
  const topicsstr = keyTopics?.length ? keyTopics.join(', ') : '';
  const prompt = `You are an expert educator writing course content.

COURSE: ${courseTitle}
SECTION: ${sectionTitle}
DESCRIPTION: ${sectionDescription}
KEY TOPICS: ${topicsstr}
TONE: ${tone}
LEVEL: ${level}

Write comprehensive educational content for this section. Include:
1. Clear explanations with examples
2. Real-world applications
3. Best practices and tips
4. Common mistakes to avoid

IMPORTANT: The "content" field must be a single JSON string. Escape all special characters properly.
Do NOT use triple backticks inside the content field. Use indentation instead for code examples.

Return ONLY valid JSON:
{
    "title": "${sectionTitle.replace(/"/g, '\\"')}",
    "content": "Full markdown content here (properly escaped for JSON)...",
    "summary": "2-3 sentence summary",
    "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
    "practice_questions": ["question 1?", "question 2?"]
}

CRITICAL: Return ONLY the JSON object, no markdown fences, no extra text.`;

  const { text, usage } = await generateContent(apikey, prompt, { temperature: 0.7, maxOutputTokens: 16384 });
  const data = extractJsonFromResponse(text);
  if (data?.content && typeof data.content === 'string') {
    data.content = normalizeSectionContent(data.content);
  }
  return { content: data, usage };
}

export async function generateFullCourse(apikey, topic, keywords = [], level = 'intermediate', tone = 'professional') {
  const outlineResult = await generateOutline(apikey, topic, keywords, level, tone);
  const outline = outlineResult?.outline;
  if (!outline) return { success: false, error: 'Failed to generate outline' };

  let totalUsage = outlineResult.usage || {};
  const sections = outline.sections ?? [];
  const sectionsContent = [];
  for (const section of sections) {
    const sectionResult = await generateSectionContent(
      apikey,
      outline.title ?? topic,
      section.title ?? 'Untitled Section',
      section.description ?? '',
      section.key_topics ?? [],
      level,
      tone
    );
    const content = sectionResult?.content;
    if (sectionResult?.usage) {
      totalUsage = {
        promptTokenCount: (totalUsage.promptTokenCount || 0) + (sectionResult.usage.promptTokenCount || 0),
        candidatesTokenCount: (totalUsage.candidatesTokenCount || 0) + (sectionResult.usage.candidatesTokenCount || 0),
        totalTokenCount: (totalUsage.totalTokenCount || 0) + (sectionResult.usage.totalTokenCount || 0),
      };
    }
    if (content) {
      sectionsContent.push(content);
    } else {
      sectionsContent.push({
        title: section.title ?? 'Untitled Section',
        content: `# ${section.title ?? 'Untitled Section'}\n\nContent generation failed for this section.`,
        summary: section.description ?? '',
        key_takeaways: [],
        practice_questions: [],
      });
    }
  }

  return {
    success: true,
    outline,
    sections: sectionsContent,
    total_sections: sectionsContent.length,
    totalUsage,
  };
}

/**
 * Regenerate a single section with optional commentary (teacher feedback).
 */
export async function regenerateSection(apikey, courseTitle, sectionData, commentary = '', level = 'intermediate', tone = 'professional') {
  const prompt = `You are an expert educator. Regenerate the following course section based on teacher feedback.

COURSE: ${courseTitle}
ORIGINAL SECTION:
${JSON.stringify(sectionData, null, 2)}

TEACHER COMMENTARY:
${commentary || 'No specific feedback — improve clarity and depth.'}

Please regenerate this section, incorporating the teacher's feedback.
Keep the same general topic but improve based on the commentary.
Level: ${level}, Tone: ${tone}

Return ONLY valid JSON with this structure:
{
    "title": "Section Title",
    "content": "Full markdown content here (properly escaped for JSON)...",
    "summary": "2-3 sentence summary",
    "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
    "practice_questions": ["question 1?", "question 2?"]
}

CRITICAL: Return ONLY the JSON object, no markdown fences, no extra text.`;

  const { text, usage } = await generateContent(apikey, prompt, { temperature: 0.7, maxOutputTokens: 16384 });
  const data = extractJsonFromResponse(text);
  if (data?.content && typeof data.content === 'string') {
    data.content = normalizeSectionContent(data.content);
  }
  return { content: data, usage };
}
