import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GenerateCourse from './pages/GenerateCourse';
import EditOutline from './pages/EditOutline';
import CourseEditor from './pages/CourseEditor';
import GenerateExam from './pages/GenerateExam';
import UploadCourse from './pages/UploadCourse';
import ExportCourse from './pages/ExportCourse';
import Settings from './pages/Settings';
import PreviewCourse from './pages/PreviewCourse';
import PreviewExam from './pages/PreviewExam';
import CoursesList from './pages/CoursesList';
import ExamsList from './pages/ExamsList';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/generate-course" element={<GenerateCourse />} />
                <Route path="/edit-outline" element={<EditOutline />} />
                <Route path="/course-editor/:id" element={<CourseEditor />} />
                <Route path="/generate-exam" element={<GenerateExam />} />
                <Route path="/upload-course" element={<UploadCourse />} />
                <Route path="/export-course" element={<ExportCourse />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/course/:id" element={<PreviewCourse />} />
                <Route path="/exam/:id" element={<PreviewExam />} />
                <Route path="/courses" element={<CoursesList />} />
                <Route path="/exams" element={<ExamsList />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/help" element={<HelpPlaceholder />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function HelpPlaceholder() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Help & Support</h1>
      <p className="text-gray-600">
        Use <strong>Generate Course</strong> to create a new course with AI: enter a topic, then review and edit the outline before generating full content.
        Use <strong>Upload Material</strong> to import existing PDF, DOCX, TXT, or MD files. From any course you can <strong>Generate Exam</strong> and <strong>Export PDF</strong>.
        Set your Gemini API key in <strong>Settings</strong> for AI features (or configure it on the server).
      </p>
    </div>
  );
}
