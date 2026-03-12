import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getCourseStatus, type GeneratedSection, type CourseOutline } from '../api';
import FeedbackModal from '../components/FeedbackModal';

interface SectionState {
  title: string;
  status: 'pending' | 'generating' | 'done';
  content?: GeneratedSection;
}

export default function GeneratingCourse() {
  const location = useLocation();
  const navigate = useNavigate();
  const courseId = (location.state as { courseId?: string })?.courseId;

  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [sectionStates, setSectionStates] = useState<SectionState[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDoneRef = useRef(0);

  useEffect(() => {
    if (!courseId) {
      navigate('/generate-course');
      return;
    }
    startPolling();
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [courseId]);

  // Auto-expand the most recently completed section
  useEffect(() => {
    if (doneCount > prevDoneRef.current) {
      setExpandedIndex(doneCount - 1);
      prevDoneRef.current = doneCount;
    }
  }, [doneCount]);

  const startPolling = async () => {
    const poll = async () => {
      try {
        const st = await getCourseStatus(courseId!);

        // Set outline once available
        if (st.outline && !outline) {
          setOutline(st.outline);
          const allSections = st.outline.sections ?? [];
          setTotalCount(allSections.length);
          setSectionStates(
            allSections.map((s) => ({ title: s.title ?? 'Section', status: 'pending' }))
          );
        }

        // Parse progress
        const [curr, total] = (st.generation_progress ?? '0/0')
          .split('/')
          .map(Number);
        setDoneCount(curr);
        if (total > 0) setTotalCount(total);

        // Update section states from partial data
        const partial = st.sections_partial ?? [];
        setSectionStates((prev) => {
          const next = prev.length > 0 ? [...prev] : Array.from({ length: total || 0 }, (_, i) => ({
            title: `Section ${i + 1}`,
            status: 'pending' as const,
          }));

          for (let i = 0; i < next.length; i++) {
            if (i < partial.length) {
              next[i] = { ...next[i], status: 'done', content: partial[i] };
            } else if (i === partial.length && st.status === 'generating') {
              next[i] = { ...next[i], status: 'generating' };
            } else {
              next[i] = { ...next[i], status: 'pending' };
            }
          }
          return next;
        });

        if (st.status === 'generated') {
          setFinished(true);
          // Show feedback modal 1.5s after completion so the user sees the "ready" banner first
          setTimeout(() => setShowFeedback(true), 1500);
          return;
        }

        if (st.status === 'generating') {
          pollingRef.current = setTimeout(poll, 2500);
        }
      } catch {
        pollingRef.current = setTimeout(poll, 3000);
      }
    };
    poll();
  };

  if (!courseId) return null;

  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {showFeedback && courseId && (
        <FeedbackModal
          courseId={courseId}
          courseTitle={outline?.title}
          onClose={() => setShowFeedback(false)}
        />
      )}
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
          <Sparkles className="w-4 h-4 animate-pulse" />
          AI Course Generation
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {outline?.title ?? 'Generating your course…'}
        </h1>
        {outline?.description && (
          <p className="text-gray-500 mt-1 text-sm">{outline.description}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            {finished
              ? 'All sections generated!'
              : doneCount === 0
              ? 'Starting generation…'
              : `Generating section ${doneCount + 1} of ${totalCount}…`}
          </span>
          <span className="text-sm font-bold text-indigo-600">{progressPct}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              finished ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {finished
            ? `${totalCount} sections ready`
            : `${doneCount} / ${totalCount} sections completed — stay on this page`}
        </p>
      </div>

      {/* Sections list */}
      <div className="space-y-3">
        {sectionStates.map((sec, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
              sec.status === 'done'
                ? 'border-emerald-200'
                : sec.status === 'generating'
                ? 'border-indigo-300'
                : 'border-gray-100 opacity-50'
            }`}
          >
            {/* Section header */}
            <button
              className="w-full flex items-center gap-3 px-5 py-4 text-left"
              onClick={() => sec.status === 'done' && setExpandedIndex(expandedIndex === i ? null : i)}
              disabled={sec.status !== 'done'}
            >
              <div className="shrink-0">
                {sec.status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : sec.status === 'generating' ? (
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`font-semibold text-sm truncate block ${
                    sec.status === 'done'
                      ? 'text-gray-900'
                      : sec.status === 'generating'
                      ? 'text-indigo-700'
                      : 'text-gray-400'
                  }`}
                >
                  {i + 1}. {sec.title}
                </span>
                {sec.status === 'generating' && (
                  <span className="text-xs text-indigo-500 animate-pulse">Writing content…</span>
                )}
                {sec.status === 'done' && sec.content?.summary && (
                  <span className="text-xs text-gray-400 truncate block">{sec.content.summary}</span>
                )}
              </div>
              {sec.status === 'done' && (
                <span className="text-xs text-gray-400 shrink-0">
                  {expandedIndex === i ? 'Hide ▲' : 'Preview ▼'}
                </span>
              )}
            </button>

            {/* Expandable content preview */}
            {sec.status === 'done' && expandedIndex === i && sec.content && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-4 animate-fadeIn">
                {/* Content preview */}
                <div className="prose prose-sm max-w-none text-gray-700 max-h-48 overflow-y-auto">
                  <ReactMarkdown>{sec.content.content?.slice(0, 800) + (sec.content.content?.length > 800 ? '…' : '')}</ReactMarkdown>
                </div>

                {/* Key takeaways */}
                {sec.content.key_takeaways && sec.content.key_takeaways.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Key takeaways</p>
                    <ul className="space-y-1">
                      {sec.content.key_takeaways.slice(0, 3).map((kt, ki) => (
                        <li key={ki} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          {kt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Generating skeleton */}
            {sec.status === 'generating' && (
              <div className="border-t border-indigo-100 px-5 py-4 space-y-2">
                {[100, 90, 75, 60].map((w, j) => (
                  <div
                    key={j}
                    className="h-3 bg-indigo-50 rounded animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Completion CTA */}
      {finished && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Your course is ready!</p>
              <p className="text-sm text-emerald-700">All {totalCount} sections have been generated.</p>
            </div>
          </div>
          <Link
            to={`/course-editor/${courseId}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
          >
            Open Course <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
