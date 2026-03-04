import { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  FileText,
  Zap,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import {
  getAdminStats,
  getAdminUsers,
  patchAdminUser,
  type AdminStats as AdminStatsType,
  type AdminUser,
} from '../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsType | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersList] = await Promise.all([getAdminStats(), getAdminUsers()]);
      setStats(statsRes);
      setUsers(usersList);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleActive = async (user: AdminUser) => {
    setTogglingId(user.id);
    try {
      const res = await patchAdminUser(user.id, { active: !user.active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, active: res.user.active } : u)));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setTogglingId(null);
    }
  };

  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
        <p className="font-medium">Failed to load admin data</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={load}
          className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-7 h-7 text-indigo-600" />
          Admin Dashboard
        </h1>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
        >
          <RefreshCw className={loading ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stats.usersCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stats.coursesCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Exams</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stats.examsCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total tokens</p>
                <p className="text-2xl font-bold text-gray-900">{formatTokens(stats.stats.totalTokens)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">Activate or deactivate accounts. Token usage is from AI generation.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Courses</th>
                <th className="px-5 py-3 font-medium">Exams</th>
                <th className="px-5 py-3 font-medium">Tokens</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-900">{u.email}</td>
                  <td className="px-5 py-3 text-gray-700">{u.name || '—'}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        u.role === 'admin'
                          ? 'px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700'
                          : 'px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'
                      }
                    >
                      {u.role === 'admin' ? (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3" /> User
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{u.coursesCount}</td>
                  <td className="px-5 py-3 text-gray-700">{u.examsCount}</td>
                  <td className="px-5 py-3 text-gray-700 font-mono text-sm">{formatTokens(u.totalTokens)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        u.active
                          ? 'text-emerald-600 text-sm font-medium'
                          : 'text-gray-400 text-sm font-medium'
                      }
                    >
                      {u.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={togglingId === u.id}
                      className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                      title={u.active ? 'Deactivate user' : 'Activate user'}
                    >
                      {togglingId === u.id ? (
                        <span className="inline-block w-8 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                      ) : u.active ? (
                        <ToggleRight className="w-8 h-8" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course titles */}
      {stats && stats.courseTitles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Course titles (recent)</h2>
          </div>
          <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {stats.courseTitles.map((c) => (
              <li key={c.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-900 font-medium truncate flex-1" title={c.topic}>
                  {c.topic || 'Untitled'}
                </span>
                <span className="text-gray-400 text-xs font-mono shrink-0">{c.id.slice(0, 8)}…</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Exam titles */}
      {stats && stats.examTitles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Exams (recent)</h2>
          </div>
          <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {stats.examTitles.map((e) => (
              <li key={e.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-700 flex-1">
                  Exam · <span className="font-mono text-xs text-gray-500">{e.num_questions} questions</span>
                </span>
                <span className="text-gray-400 text-xs font-mono shrink-0">{e.id.slice(0, 8)}…</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
