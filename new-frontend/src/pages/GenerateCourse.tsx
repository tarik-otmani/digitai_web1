import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { postCoursesOutline } from '../api';
import QuotaModal from '../components/QuotaModal';

interface QuotaInfo { used: number; limit: number; planName: string }

export default function GenerateCourse() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [tone, setTone] = useState('professional');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);

  const handleGenerateOutline = async () => {
    if (!topic.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await postCoursesOutline({
        topic: topic.trim(),
        keywords: keywords.trim() || undefined,
        level,
        tone,
      });
      navigate('/edit-outline', { state: { courseId: res.recordid } });
    } catch (err: unknown) {
      const e = err as Error & { apiData?: { used?: number; limit?: number; planName?: string } };
      if (e.message === 'QUOTA_EXCEEDED') {
        setQuotaInfo({
          used: e.apiData?.used ?? 0,
          limit: e.apiData?.limit ?? 0,
          planName: e.apiData?.planName ?? '',
        });
        return;
      }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {quotaInfo && (
      <QuotaModal
        used={quotaInfo.used}
        limit={quotaInfo.limit}
        planName={quotaInfo.planName}
        onClose={() => setQuotaInfo(null)}
      />
    )}
    <div className="max-w-3xl mx-auto">
      <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Generate New Course</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course Topic *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Introduction to Quantum Computing"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (optional, comma-separated)</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., algorithms, data structures"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
              >
                <option value="academic">Academic</option>
                <option value="casual">Casual</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Instructions (Optional)</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Any specific requirements or focus areas..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all h-32 resize-none"
            />
          </div>

          <div className="space-y-1">
            <button
              onClick={handleGenerateOutline}
              disabled={!topic.trim() || loading}
              className={clsx(
                'w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2',
                !topic.trim() || loading
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
              )}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Outline...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Course Outline
                </>
              )}
            </button>
            <p className="text-center text-sm text-slate-500">
              {loading ? 'Estimated: ~30 seconds' : 'Usually takes ~30 seconds'}
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
