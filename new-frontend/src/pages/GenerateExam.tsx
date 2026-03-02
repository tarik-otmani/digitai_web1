import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import clsx from 'clsx';
import { getCourses, postExamsGenerate, type Course } from '../api';

export default function GenerateExam() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [numQuestions, setNumQuestions] = useState(20);
  const [difficulty, setDifficulty] = useState('mixed');
  const [pctMcq, setPctMcq] = useState(50);
  const [pctTf, setPctTf] = useState(20);
  const [pctShort, setPctShort] = useState(20);
  const [pctEssay, setPctEssay] = useState(10);
  const [exampleQuestions, setExampleQuestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCourses().then(setCourses).catch(console.error);
  }, []);

  const handleGenerate = async () => {
    if (!courseId) return;
    setError('');
    setLoading(true);
    try {
      const res = await postExamsGenerate({
        course_ref_id: courseId,
        num_questions: Math.min(50, Math.max(5, numQuestions)),
        difficulty,
        pct_mcq: pctMcq,
        pct_truefalse: pctTf,
        pct_shortanswer: pctShort,
        pct_essay: pctEssay,
        example_questions: exampleQuestions.trim() || undefined,
      });
      navigate(`/exam/${res.recordid}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Generate AI Exam</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Course *</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.topic} {c.status !== 'generated' ? `(${c.status})` : ''}
                </option>
              ))}
            </select>
            {courses.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No courses yet. Create or upload a course first.</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions (5–50)</label>
              <input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value, 10) || 20)}
                min={5}
                max={50}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question type distribution (%)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-500">MCQ</label>
                <input
                  type="number"
                  value={pctMcq}
                  onChange={(e) => setPctMcq(parseInt(e.target.value, 10) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">True/False</label>
                <input
                  type="number"
                  value={pctTf}
                  onChange={(e) => setPctTf(parseInt(e.target.value, 10) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Short Answer</label>
                <input
                  type="number"
                  value={pctShort}
                  onChange={(e) => setPctShort(parseInt(e.target.value, 10) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Essay</label>
                <input
                  type="number"
                  value={pctEssay}
                  onChange={(e) => setPctEssay(parseInt(e.target.value, 10) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Example questions (optional)</label>
            <textarea
              value={exampleQuestions}
              onChange={(e) => setExampleQuestions(e.target.value)}
              placeholder="Paste example questions to mimic style..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none h-24 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!courseId || loading}
            className={clsx(
              'w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2',
              !courseId || loading ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            )}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Exam...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generate Exam
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
