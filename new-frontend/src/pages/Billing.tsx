import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, BookOpen, FileText, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { getBillingMe, type BillingData } from '../api';

const PLAN_STYLES: Record<string, { border: string; badge: string; bar: string }> = {
  free:        { border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-600',     bar: 'bg-gray-400' },
  creator:     { border: 'border-indigo-300', badge: 'bg-indigo-100 text-indigo-700', bar: 'bg-indigo-500' },
  pro:         { border: 'border-violet-300', badge: 'bg-violet-100 text-violet-700', bar: 'bg-violet-500' },
  institution: { border: 'border-amber-300',  badge: 'bg-amber-100 text-amber-700',   bar: 'bg-amber-500' },
};

function QuotaBar({
  label, icon, used, quota, barColor,
}: {
  label: string; icon: React.ReactNode; used: number; quota: number | null; barColor: string;
}) {
  const unlimited = quota === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / quota!) * 100));
  const nearLimit = !unlimited && pct >= 80;
  const atLimit = !unlimited && used >= quota!;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium text-gray-700">
          {icon} {label}
        </span>
        <span className={`font-semibold ${atLimit ? 'text-red-600' : nearLimit ? 'text-amber-600' : 'text-gray-900'}`}>
          {unlimited ? (
            <span className="text-emerald-600 font-medium">Illimité</span>
          ) : (
            `${used} / ${quota}`
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${atLimit ? 'bg-red-500' : nearLimit ? 'bg-amber-500' : barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {atLimit && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Quota atteint — passez à un forfait supérieur pour continuer.
        </p>
      )}
      {nearLimit && !atLimit && (
        <p className="text-xs text-amber-600">
          Vous approchez de votre limite mensuelle.
        </p>
      )}
    </div>
  );
}

export default function Billing() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getBillingMe()
      .then((d) => setBilling(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const styles = PLAN_STYLES[billing?.planId || 'free'];

  const resetLabel = billing?.resetDate
    ? new Date(billing.resetDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
    : '';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour au tableau de bord
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-500" />
          Billing
        </h1>
        <p className="text-sm text-gray-500 mt-1">Votre forfait actuel et l'utilisation de ce mois.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      ) : billing ? (
        <>
          {/* Plan card */}
          <div className={`bg-white rounded-2xl border-2 ${styles.border} shadow-sm p-6 space-y-4`}>
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold mb-2 ${styles.badge}`}>
                  Forfait actuel
                </span>
                <h2 className="text-2xl font-bold text-gray-900">{billing.plan.name}</h2>
                <p className="text-gray-500 text-sm mt-0.5">{billing.plan.price}</p>
              </div>
              <div className="text-right text-xs text-gray-400">
                <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                Renouvellement le {resetLabel}
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2">
              {billing.plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Usage quotas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">
              Utilisation ce mois
            </h3>

            <QuotaBar
              label="Cours générés"
              icon={<BookOpen className="w-4 h-4 text-gray-400" />}
              used={billing.usage.coursesThisMonth}
              quota={billing.usage.coursesQuota}
              barColor={styles.bar}
            />

            <QuotaBar
              label="Questions d'examen"
              icon={<FileText className="w-4 h-4 text-gray-400" />}
              used={billing.usage.questionsThisMonth}
              quota={billing.usage.questionsQuota}
              barColor={styles.bar}
            />
          </div>

          {/* Upgrade CTA — only for non-pro/institution plans */}
          {(billing.planId === 'free' || billing.planId === 'creator') && (
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">Besoin de plus ?</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {billing.planId === 'free' ? 'Passez à Creator ($15/mois) pour 20 cours et 50 questions.' : 'Passez à Pro ($29/mois) pour un accès illimité.'}
                </p>
              </div>
              <a
                href="/#pricing"
                className="shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Voir les forfaits
              </a>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
