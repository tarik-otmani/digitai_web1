import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, DollarSign, Clock, BarChart2 } from 'lucide-react';
import { getUsageMe, UsageRow, UsageTotals } from '../api';
import SubscriptionStatus from '../components/SubscriptionStatus';

const OPERATION_LABELS: Record<string, string> = {
  course_outline: 'Course Outline',
  course_section: 'Course Section',
  course_full: 'Full Course',
  course_regenerate_section: 'Section Regeneration',
  upload_structure: 'Upload Analysis',
  exam_generate: 'Exam Generation',
  exam_regenerate_question: 'Question Regeneration',
};

function formatDate(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatCost(usd: number) {
  if (usd < 0.001) return '<$0.001';
  return `$${usd.toFixed(4)}`;
}

export default function Settings() {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [totals, setTotals] = useState<UsageTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsageMe()
      .then((d) => {
        setRows(d.rows || []);
        setTotals(d.totals);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your subscription and track usage.</p>
      </div>

      {/* Subscription Status */}
      <SubscriptionStatus />

      {/* Token Usage */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Token Usage</h2>
        <p className="text-sm text-gray-500 mb-6">Track how many tokens you've consumed and the estimated cost.</p>
      </div>

      {/* Summary cards */}
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<Zap className="w-5 h-5 text-indigo-600" />} label="Total Tokens" value={totals.total.toLocaleString()} />
          <StatCard icon={<BarChart2 className="w-5 h-5 text-blue-600" />} label="Input Tokens" value={totals.prompt.toLocaleString()} />
          <StatCard icon={<BarChart2 className="w-5 h-5 text-violet-600" />} label="Output Tokens" value={totals.completion.toLocaleString()} />
          <StatCard icon={<DollarSign className="w-5 h-5 text-green-600" />} label="Est. Cost" value={formatCost(totals.estimatedCostUsd)} />
        </div>
      )}

      {/* Recent operations table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-800 text-sm">Recent Activity</h2>
          <span className="ml-auto text-xs text-gray-400">Last 50 operations</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No token usage yet. Generate a course or exam to see stats here.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Operation</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Input</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Output</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-gray-700">
                      {OPERATION_LABELS[r.operation] || r.operation}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.prompt_tokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.completion_tokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{r.total_tokens.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-400">{formatDate(r.timecreated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Cost estimate based on Gemini 2.5 Pro pricing: $1.25/1M input tokens · $10.00/1M output tokens.
      </p>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
