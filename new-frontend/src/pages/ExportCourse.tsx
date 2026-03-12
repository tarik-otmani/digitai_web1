import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { getCourses, getCourseExportPdfUrl, type Course } from '../api';

export default function ExportCourse() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCourses().then(setCourses).catch(console.error);
  }, []);

  const handleExportPdf = async () => {
    if (!selectedCourse) return;
    setError('');
    setLoading(true);
    try {
      const url = getCourseExportPdfUrl(selectedCourse);
      const res = await fetch(url);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(courses.find((c) => c.id === selectedCourse)?.topic || 'course').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError('Export failed: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <Download className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Export Course</h1>
          </div>
          <p className="text-gray-500 ml-13">Download your course as PDF. Other formats may be added later.</p>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Course to Export</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">-- Select a course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.topic}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => selectedCourse && handleExportPdf()}
                disabled={!selectedCourse || loading}
                className={clsx(
                  'p-4 border rounded-xl flex flex-col items-start gap-3 transition-all text-left relative overflow-hidden',
                  selectedCourse && !loading
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div
                  className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    selectedCourse ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                  )}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className={clsx('font-semibold block', selectedCourse ? 'text-indigo-900' : 'text-gray-900')}>
                    PDF Document
                  </span>
                  <span className="text-xs text-gray-500 mt-1 block">
                    Best for printing and reading offline.
                  </span>
                </div>
                {selectedCourse && (
                  <div className="absolute top-3 right-3 text-indigo-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
              </button>

              <div className="p-4 border border-gray-200 rounded-xl flex flex-col items-start gap-3 text-left opacity-60">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold block text-gray-900">SCORM Package</span>
                  <span className="text-xs text-gray-500 mt-1 block">Coming soon.</span>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-xl flex flex-col items-start gap-3 text-left opacity-60">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold block text-gray-900">HTML Website</span>
                  <span className="text-xs text-gray-500 mt-1 block">Coming soon.</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleExportPdf}
              disabled={!selectedCourse || loading}
              className={clsx(
                'w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2',
                !selectedCourse || loading
                  ? 'bg-gray-300 cursor-not-allowed shadow-none text-gray-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5'
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
