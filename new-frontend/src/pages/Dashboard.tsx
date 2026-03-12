import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload, FileText, ArrowRight, Clock, Download, Trash2, Eye, CreditCard } from 'lucide-react';
import clsx from 'clsx';
import { getCourses, getExams, deleteCourse, deleteExam, getBillingMe, type Course, type Exam } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [coursesThisMonth, setCoursesThisMonth] = useState<number | null>(null);
  const [coursesQuota, setCoursesQuota] = useState<number | null>(null);
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const [c, e, billing] = await Promise.all([getCourses(), getExams(), getBillingMe()]);
      setCourses(c);
      setExams(e);
      setCoursesThisMonth(billing.usage?.coursesThisMonth ?? 0);
      setCoursesQuota(billing.usage?.coursesQuota ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeleteCourse = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this course?')) return;
    setDeletingId(id);
    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteExam = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this exam?')) return;
    setDeletingId(id);
    try {
      await deleteExam(id);
      setExams((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (ts?: number) => {
    if (!ts) return '—';
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - d;
    if (diff < 3600000) return `${Math.round(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)} hours ago`;
    return `${Math.round(diff / 86400000)} days ago`;
  };

  const recentCourses = courses.slice(0, 8);
  const recentExams = exams.slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back. Manage your courses and exams.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Billing quota pill */}
          <Link
            to="/billing"
            title="Voir mon forfait"
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            {coursesThisMonth === null
              ? '…'
              : coursesQuota === null
              ? `${coursesThisMonth} cours`
              : `${coursesThisMonth} / ${coursesQuota} cours`}
          </Link>
          <Link
            to="/generate-course"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Course
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/generate-course"
          className="group p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-indigo-100"
        >
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Generate Course</h3>
          <p className="text-sm text-gray-500">Create a new course with AI assistance</p>
        </Link>

        <Link
          to="/upload-course"
          className="group p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-indigo-100"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Upload Material</h3>
          <p className="text-sm text-gray-500">Upload PDF, DOCX, TXT, or MD</p>
        </Link>

        <Link
          to="/generate-exam"
          className="group p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-indigo-100"
        >
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Generate Exam</h3>
          <p className="text-sm text-gray-500">Create quizzes from course content</p>
        </Link>

        <Link
          to="/export-course"
          className="group p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-indigo-100"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Export Course</h3>
          <p className="text-sm text-gray-500">Download course as PDF</p>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Recent Courses</h2>
              <Link
                to="/courses"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentCourses.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No courses yet. Generate or upload one.</p>
              ) : (
                recentCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group"
                  >
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold flex-shrink-0 mr-4">
                      {course.topic.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/course/${course.id}`} className="block">
                        <h4 className="text-sm font-semibold text-gray-900 truncate hover:text-indigo-600">
                          {course.topic}
                        </h4>
                      </Link>
                      <div className="flex items-center text-xs text-gray-500 mt-1 gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(course.timemodified)}
                        </span>
                        <span className="capitalize">{course.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/course/${course.id}`}
                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/course-editor/${course.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={(e) => handleDeleteCourse(course.id, e)}
                        disabled={deletingId === course.id}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === course.id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Recent Exams</h2>
              <Link to="/exams" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recentExams.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No exams yet. Generate one from a course.</p>
              ) : (
                recentExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all bg-gray-50/50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Link to={`/exam/${exam.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
                        {exam.course_topic || 'Exam'} — {exam.num_questions} questions
                      </Link>
                      <span
                        className={clsx(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          exam.status === 'generated' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                        )}
                      >
                        {exam.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{exam.course_topic || exam.course_ref_id}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{exam.num_questions} Questions</span>
                      <div className="flex items-center gap-2">
                        <Link to={`/exam/${exam.id}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                          View
                        </Link>
                        <button
                          onClick={(e) => handleDeleteExam(exam.id, e)}
                          disabled={deletingId === exam.id}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
