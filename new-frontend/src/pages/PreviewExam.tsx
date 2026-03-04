import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, RefreshCw, Save, Download } from 'lucide-react';
import {
  getExam,
  patchExam,
  postRegenerateQuestion,
  getExamExportPdfUrl,
  type Exam,
  type ExamQuestion,
} from '../api';

const TYPE_LABELS: Record<string, string> = {
  mcq: 'Multiple choice',
  truefalse: 'True / False',
  shortanswer: 'Short answer',
  essay: 'Essay',
};

export default function PreviewExam() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleExportPdf = async () => {
    if (!id) return;
    setExporting(true);
    try {
      const url = getExamExportPdfUrl(id);
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `exam-${(exam?.course_topic || 'exam').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert('PDF export failed: ' + (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const load = async () => {
    if (!id) return;
    try {
      const e = await getExam(id);
      setExam(e);
      if (!e?.questions_json) {
        setQuestions([]);
        return;
      }
      const raw = e.questions_json;
      const q = typeof raw === 'string' ? JSON.parse(raw) : raw;
      setQuestions(Array.isArray(q) ? q : []);
    } catch (err) {
      console.error('Failed to load exam:', err);
      setError('Failed to load exam questions');
      setQuestions([]);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateQuestion = (index: number, updates: Partial<ExamQuestion>) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      const opts = [...(q.options || [])];
      opts[optIndex] = value;
      q.options = opts;
      next[qIndex] = q;
      return next;
    });
  };

  const handleSave = async () => {
    if (!id) return;
    setError('');
    setSaving(true);
    setEditingIndex(null);
    try {
      await patchExam(id, { questions_json: questions });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async (questionIndex: number) => {
    if (!id) return;
    setError('');
    setRegeneratingIndex(questionIndex);
    try {
      const res = await postRegenerateQuestion(id, questionIndex);
      setQuestions(res.questions);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  if (!id) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p className="text-gray-500">Missing exam ID.</p>
        <Link to="/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export PDF
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save changes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Exam: {exam.course_topic || exam.course_ref_id}</h1>
          <p className="text-gray-500 mt-1">
            {exam.num_questions} questions · Difficulty: {exam.difficulty || 'mixed'}
          </p>
        </div>

        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="p-8 space-y-8">
          {questions.map((q, idx) => (
            <div key={idx} className="border border-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    {TYPE_LABELS[q.type] || q.type}
                  </span>
                  {q.points != null && (
                    <span className="text-xs text-gray-500">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit question"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRegenerate(idx)}
                    disabled={regeneratingIndex !== null}
                    className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Regenerate with AI"
                  >
                    {regeneratingIndex === idx ? (
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {editingIndex === idx ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Question</label>
                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                      rows={3}
                    />
                  </div>
                  {q.options && q.options.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Options</label>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <input
                            key={oi}
                            value={opt}
                            onChange={(e) => updateOption(idx, oi, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Correct answer</label>
                    <input
                      value={q.correct_answer || ''}
                      onChange={(e) => updateQuestion(idx, { correct_answer: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                      placeholder="Answer (e.g. A or exact text)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Explanation (optional)</label>
                    <textarea
                      value={q.explanation || ''}
                      onChange={(e) => updateQuestion(idx, { explanation: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium text-gray-900 mb-3">{q.question}</p>
                  {q.options && q.options.length > 0 && (
                    <ul className="list-disc list-inside text-gray-600 space-y-1 mb-3">
                      {q.options.map((opt, i) => (
                        <li key={i}>{opt}</li>
                      ))}
                    </ul>
                  )}
                  {q.correct_answer && (
                    <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <span className="font-medium text-gray-700">Answer: </span>
                      {q.correct_answer}
                    </div>
                  )}
                  {q.explanation && (
                    <p className="text-sm text-gray-500 mt-2 italic">{q.explanation}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
