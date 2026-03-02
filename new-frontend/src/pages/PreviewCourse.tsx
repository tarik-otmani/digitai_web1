import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Pencil, RefreshCw, Save, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getCourse,
  getCourseExportPdfUrl,
  patchCourse,
  postRegenerateSection,
  type Course,
} from '../api';

interface SectionData {
  title: string;
  content: string;
  summary?: string;
  key_takeaways?: string[];
  practice_questions?: string[];
}

interface CourseContent {
  outline?: { title?: string };
  sections: SectionData[];
}

/** Remove leading markdown heading or "Welcome to [title]..." that duplicates the section title. */
function stripDuplicateSectionTitle(sectionTitle: string, content: string): string {
  if (!content?.trim()) return content || '';
  const title = (sectionTitle || '').trim();
  let text = content.trim();
  const lines = text.split('\n');
  let start = 0;
  const first = lines[0]?.trim() || '';
  const firstWithoutHash = first.replace(/^#+\s*/, '').trim();
  if (title && (firstWithoutHash === title || first === title)) {
    start = 1;
  } else if (first.startsWith('#') && title && (firstWithoutHash.includes(title) || title.includes(firstWithoutHash))) {
    start = 1;
  }
  text = lines.slice(start).join('\n').trimStart();
  if (title && text.toLowerCase().startsWith('welcome to')) {
    const firstSentenceEnd = text.indexOf('. ');
    if (firstSentenceEnd !== -1) {
      const firstSentence = text.slice(0, firstSentenceEnd + 1);
      if (firstSentence.toLowerCase().includes(title.toLowerCase())) {
        text = text.slice(firstSentenceEnd + 2).trimStart();
      }
    }
  }
  return text;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-5 mb-2 text-slate-700">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-6 mb-2 text-indigo-800">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-2 text-indigo-900">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="text-slate-700">$1</em>')
    .replace(/\n\n/g, '</p><p class="mb-3 text-slate-600 leading-relaxed">')
    .replace(/\n/g, '<br/>');
}

export default function PreviewCourse() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [content, setContent] = useState<CourseContent | null>(null);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState<number | null>(null);
  const [commentary, setCommentary] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const load = async () => {
    if (!id) return;
    const c = await getCourse(id);
    setCourse(c);
    if (!c) return;
    try {
      let data: CourseContent = { sections: [] };
      const raw = c.content_json;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === 'object') {
          data.outline = parsed.outline || data.outline;
          if (Array.isArray(parsed.sections) && parsed.sections.length > 0) {
            data.sections = parsed.sections;
          } else if (Array.isArray(parsed.outline?.sections) && parsed.outline.sections.length > 0) {
            data.sections = parsed.outline.sections.map((s: { title?: string; description?: string }) => ({
              title: s.title || 'Section',
              content: (s as { description?: string }).description || '',
              summary: '',
              key_takeaways: [],
              practice_questions: [],
            }));
          }
        }
      }
      setContent(data);
    } catch {
      setContent({ sections: [] });
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSave = async () => {
    if (!id || !content) return;
    setSaving(true);
    try {
      await patchCourse(id, { content_json: content });
      setEditingSection(null);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateSection = async (sectionIndex: number) => {
    if (!id) return;
    setRegenerating(sectionIndex);
    try {
      const res = await postRegenerateSection(id, sectionIndex, commentary[sectionIndex] || '');
      if (content && res.section) {
        const newSections = [...content.sections];
        newSections[sectionIndex] = res.section as SectionData;
        setContent({ ...content, sections: newSections });
      }
      setCommentary((prev) => ({ ...prev, [sectionIndex]: '' }));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setRegenerating(null);
    }
  };

  const updateSection = (sectionIndex: number, updates: Partial<SectionData>) => {
    if (!content) return;
    const next = { ...content, sections: [...content.sections] };
    next.sections[sectionIndex] = { ...next.sections[sectionIndex], ...updates };
    setContent(next);
  };

  if (!id) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p className="text-gray-500">Missing course ID.</p>
        <Link to="/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  if (!course || !content) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = content.sections || [];
  const title = content.outline?.title ?? course.topic;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        <div className="flex gap-3">
          <Link
            to={`/course-editor/${id}`}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Full editor
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || editingSection === null}
            className="px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save changes
          </button>
          <a
            href={getCourseExportPdfUrl(id)}
            download={`${(course.topic || 'course').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-indigo-100 bg-gradient-to-b from-indigo-50/60 to-white">
          <h1 className="text-2xl font-bold text-indigo-900 tracking-tight">{title}</h1>
          {course.source === 'uploaded' && (
            <p className="text-sm text-indigo-600/80 mt-1 font-medium">Uploaded course</p>
          )}
          <p className="text-sm text-slate-500 mt-0.5">{sections.length} section{sections.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-8 space-y-8">
          {sections.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border border-gray-100 rounded-xl bg-gray-50/50">
              No sections in this course yet. Use the full editor or generate content first.
            </div>
          ) : (
          sections.map((sec, idx) => {
            const isEditing = editingSection === idx;
            const isRegenerating = regenerating === idx;
            const isExpanded = expanded[idx] !== false;

            return (
              <div key={idx} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <div
                  className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-gray-50/80 transition-colors"
                  onClick={() => !isEditing && setExpanded((prev) => ({ ...prev, [idx]: !isExpanded }))}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                      {idx + 1}
                    </span>
                    <h2 className="text-lg font-semibold text-indigo-900 truncate">
                      {sec.title || `Section ${idx + 1}`}
                    </h2>
                    <span className="flex-shrink-0 text-gray-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingSection(isEditing ? null : idx);
                        if (!isEditing) setExpanded((prev) => ({ ...prev, [idx]: true }));
                      }}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Modify section"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRegenerateSection(idx)}
                      disabled={isRegenerating}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Generate / Regenerate section"
                    >
                      {isRegenerating ? (
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Section title</label>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => updateSection(idx, { title: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                        placeholder="Section title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Content (Markdown supported)</label>
                      <textarea
                        value={sec.content}
                        onChange={(e) => updateSection(idx, { content: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm min-h-[180px] resize-y"
                        placeholder="Section content..."
                        rows={6}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: '<p class="mb-3 text-slate-600 leading-relaxed">' + renderMarkdown(stripDuplicateSectionTitle(sec.title || '', sec.content || '')) + '</p>',
                      }}
                    />
                    {sec.key_takeaways && sec.key_takeaways.length > 0 && (
                      <div className="mt-4 p-4 bg-amber-50/80 rounded-xl border border-amber-100">
                        <h4 className="text-sm font-semibold text-amber-800 mb-2">Key takeaways</h4>
                        <ul className="list-disc list-inside text-sm text-amber-900/90 space-y-1">
                          {sec.key_takeaways.map((k, i) => (
                            <li key={i}>{k}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-end gap-3">
                  <input
                    type="text"
                    value={commentary[idx] ?? ''}
                    onChange={(e) => setCommentary((prev) => ({ ...prev, [idx]: e.target.value }))}
                    placeholder="Optional: instructions for regeneration"
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                  />
                  <button
                    onClick={() => handleRegenerateSection(idx)}
                    disabled={isRegenerating}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {isRegenerating ? (
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Generate
                  </button>
                </div>
                </div>
                )}
              </div>
            );
          }) )}
        </div>
      </div>
    </div>
  );
}
