import { useEffect, useState } from 'react';
import {
  Users, BookOpen, FileText, Zap, RefreshCw, ToggleLeft, ToggleRight,
  Shield, User as UserIcon, Key, Save, Eye, EyeOff, DollarSign,
} from 'lucide-react';
import {
  getAdminStats, getAdminUsers, patchAdminUser,
  getAdminGeminiKey, postAdminGeminiKey,
  type AdminStats as AdminStatsType, type AdminUser,
} from '../api';

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function estimateCost(tokens: number) {
  // Gemini 2.5 Pro blended estimate ~$3/1M total tokens
  const usd = (tokens / 1_000_000) * 3.0;
  if (usd < 0.001) return '<$0.001';
  return `$${usd.toFixed(4)}`;
}

// ——— Gemini Key Editor ———
function GeminiKeyEditor() {
  const [maskedKey, setMaskedKey] = useState('');
  const [isSet, setIsSet] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    getAdminGeminiKey()
      .then((d) => { setMaskedKey(d.maskedKey); setIsSet(d.isSet); })
      .catch((e) => setErr(e.message));
  }, []);

  const handleSave = async () => {
    if (!newKey.trim()) return;
    setSaving(true);
    setErr('');
    try {
      const d = await postAdminGeminiKey(newKey.trim());
      setMaskedKey(d.maskedKey);
      setIsSet(true);
      setNewKey('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <Key className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gemini API Key</h2>
          <p className="text-sm text-gray-500">
            {isSet ? (
              <>Current key: <code className="font-mono text-xs bg-gray-100 px-1 rounded">{maskedKey}</code></>
            ) : (
              'No key configured — all AI generation will fail until you set one.'
            )}
          </p>
        </div>
        {isSet && (
          <span className="ml-auto px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
            Configured
          </span>
        )}
        {!isSet && (
          <span className="ml-auto px-2.5 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
            Not set
          </span>
        )}
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={isSet ? 'Enter new key to replace…' : 'Enter Gemini API key…'}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-sm pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !newKey.trim()}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 text-sm shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Key'}
        </button>
      </div>
    </div>
  );
}

// ——— Main dashboard ———
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

  useEffect(() => { load(); }, []);

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
        <button onClick={load} className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
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

      {/* Gemini Key editor */}
      <GeminiKeyEditor />

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Users className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-100', label: 'Users', value: stats.stats.usersCount },
            { icon: <BookOpen className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-100', label: 'Courses', value: stats.stats.coursesCount },
            { icon: <FileText className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-100', label: 'Exams', value: stats.stats.examsCount },
            { icon: <Zap className="w-5 h-5 text-violet-600" />, bg: 'bg-violet-100', label: 'Total Tokens', value: formatTokens(stats.stats.totalTokens) },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>{card.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage accounts and view AI consumption per user.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium text-right">Courses</th>
                <th className="px-5 py-3 font-medium text-right">Exams</th>
                <th className="px-5 py-3 font-medium text-right">
                  <span className="flex items-center justify-end gap-1"><Zap className="w-3.5 h-3.5" /> Tokens</span>
                </th>
                <th className="px-5 py-3 font-medium text-right">
                  <span className="flex items-center justify-end gap-1"><DollarSign className="w-3.5 h-3.5" /> Est. Cost</span>
                </th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Toggle</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-900 font-medium">{u.email}</td>
                  <td className="px-5 py-3 text-gray-600">{u.name || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                      u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role === 'admin' ? <><Shield className="w-3 h-3" /> Admin</> : <><UserIcon className="w-3 h-3" /> User</>}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">{u.coursesCount}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{u.examsCount}</td>
                  <td className="px-5 py-3 text-right font-mono text-gray-700">{formatTokens(u.totalTokens)}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{estimateCost(u.totalTokens)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold ${u.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {u.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={togglingId === u.id}
                      title={u.active ? 'Deactivate user' : 'Activate user'}
                      className="text-indigo-600 hover:text-indigo-700 disabled:opacity-40"
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
            <h2 className="text-base font-semibold text-gray-900">Recent Courses</h2>
          </div>
          <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {stats.courseTitles.map((c) => (
              <li key={c.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-900 truncate flex-1" title={c.topic}>{c.topic || 'Untitled'}</span>
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
            <h2 className="text-base font-semibold text-gray-900">Recent Exams</h2>
          </div>
          <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {stats.examTitles.map((e) => (
              <li key={e.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-700 flex-1">Exam · <span className="font-mono text-xs text-gray-500">{e.num_questions} questions</span></span>
                <span className="text-gray-400 text-xs font-mono shrink-0">{e.id.slice(0, 8)}…</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
