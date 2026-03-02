import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Edit, Trash2, Download } from 'lucide-react';
import { getCourses, deleteCourse, type Course } from '../api';

export default function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getCourses().then(setCourses).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this course?')) return;
    setDeletingId(id);
    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <p className="text-gray-500">No courses yet. Generate or upload one from the dashboard.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {courses.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <Link to={`/course/${c.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 truncate block">
                    {c.topic}
                  </Link>
                  <p className="text-sm text-gray-500 capitalize">{c.status} · {c.source}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/course/${c.id}`}
                    className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/course-editor/${c.id}`}
                    className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <a
                    href={`/api/courses/${c.id}/export-pdf`}
                    download={`${c.topic.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    title="Export PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={(e) => handleDelete(c.id, e)}
                    disabled={deletingId === c.id}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === c.id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
