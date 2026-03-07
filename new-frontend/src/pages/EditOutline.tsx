import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, GripVertical, Trash2, Plus, ArrowRight, Pencil } from 'lucide-react';
import { getCourse, patchCourse, postCoursesConfirmGeneration, type Course, type CourseOutline, type OutlineSection } from '../api';

export default function EditOutline() {
  const location = useLocation();
  const navigate = useNavigate();
  const courseId = (location.state as { courseId?: string })?.courseId;
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<OutlineSection[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) {
      navigate('/generate-course');
      return;
    }
    let cancelled = false;
    (async () => {
      const c = await getCourse(courseId);
      if (cancelled) return;
      if (!c) {
        setError('Course not found');
        return;
      }
      setCourse(c);
      let outline: CourseOutline = { sections: [] };
      try {
        outline = typeof c.outline_json === 'string' ? JSON.parse(c.outline_json) : (c.outline_json as CourseOutline) || { sections: [] };
      } catch {}
      setTitle(outline.title ?? c.topic ?? '');
      setSections(outline.sections?.length ? outline.sections.map((s) => ({
        title: s.title ?? '',
        description: (s as { description?: string }).description ?? '',
        key_topics: s.key_topics ?? [],
      })) : []);
    })();
    return () => { cancelled = true; };
  }, [courseId, navigate]);

  const handleSaveOutline = async () => {
    if (!courseId || !course) return;
    setError('');
    setLoading(true);
    try {
      const outline: CourseOutline = {
        title: title || course.topic,
        sections: sections.map((s) => ({
          title: s.title,
          description: (s as { description?: string }).description,
          key_topics: s.key_topics,
        })),
      };
      await patchCourse(courseId, { outline_json: outline });
      setCourse((prev) => prev ? { ...prev, outline_json: JSON.stringify(outline) } : null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToContent = async () => {
    if (!courseId || !course) return;
    setError('');
    setConfirming(true);
    try {
      const outline: CourseOutline = {
        title: title || course.topic,
        sections: sections.map((s) => ({
          title: s.title,
          description: (s as { description?: string }).description,
          key_topics: s.key_topics,
        })),
      };
      await patchCourse(courseId, { outline_json: outline });
      await postCoursesConfirmGeneration(courseId);
      navigate('/generating-course', { state: { courseId } });
    } catch (err) {
      setError((err as Error).message);
      setConfirming(false);
    }
  };

  const addSection = () => {
    setSections((prev) => [...prev, { title: 'New Section', description: '', key_topics: [] }]);
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: 'title' | 'description', value: string) => {
    setSections((prev) => {
      const next = [...prev];
      const s = { ...next[index] };
      (s as Record<string, unknown>)[field] = value;
      next[index] = s;
      return next;
    });
  };

  if (!courseId) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/generate-course" className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Configuration
      </Link>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review & Edit Outline</h1>
          <p className="text-gray-500 mt-1">Edit section titles and descriptions, then generate full content.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSaveOutline}
            disabled={loading}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            {loading ? 'Saving...' : 'Save outline'}
          </button>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleContinueToContent}
              disabled={confirming || sections.length === 0}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {confirming ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating content...
                </>
              ) : (
                <>
                  Continue to Content
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <span className="text-xs text-slate-500">
              Estimated: ~{sections.length}–{sections.length * 2} min ({sections.length} section{sections.length !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Course title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
          placeholder="Course title"
        />
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-colors"
          >
            <div className="cursor-grab text-gray-400 hover:text-gray-600 p-2">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(index, 'title', e.target.value)}
                  className="font-semibold text-gray-900 bg-transparent border border-transparent hover:border-gray-300 hover:bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-2 py-1 w-full transition-all"
                  placeholder="Section Title"
                />
              </div>
              <div className="ml-9">
                <input
                  type="text"
                  value={(section as { description?: string }).description ?? ''}
                  onChange={(e) => updateSection(index, 'description', e.target.value)}
                  className="text-sm text-gray-500 bg-transparent border border-transparent hover:border-gray-300 hover:bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-2 py-1 w-full transition-all"
                  placeholder="Section Description"
                />
              </div>
            </div>
            <button
              onClick={() => removeSection(index)}
              className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        <button
          onClick={addSection}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Section
        </button>
      </div>
    </div>
  );
}
