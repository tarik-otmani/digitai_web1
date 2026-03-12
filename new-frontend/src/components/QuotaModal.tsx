import { X, Lock, ArrowRight, Zap } from 'lucide-react';

interface QuotaModalProps {
  used: number;
  limit: number;
  planName: string;
  onClose: () => void;
}

const UPGRADE_MAP: Record<string, { name: string; price: string }> = {
  Free:        { name: 'Creator', price: '$15/mois' },
  Creator:     { name: 'Pro',     price: '$29/mois' },
  Pro:         { name: 'Pro',     price: '$29/mois' },
  Institutions:{ name: 'Pro',     price: '$29/mois' },
};

export default function QuotaModal({ used, limit, planName, onClose }: QuotaModalProps) {
  const upgrade = UPGRADE_MAP[planName] ?? { name: 'Pro', price: '$29/mois' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn">

        {/* Top banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold">Quota atteint</h2>
          <p className="text-white/80 text-sm mt-1">
            Vous avez généré <strong>{used}/{limit} cours</strong> ce mois avec le forfait <strong>{planName}</strong>.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-indigo-50 rounded-xl p-4 flex items-start gap-3">
            <Zap className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-800">
              <p className="font-semibold">Passez au forfait {upgrade.name}</p>
              <p className="text-indigo-600 mt-0.5">
                {upgrade.name === 'Creator'
                  ? '20 cours / mois + export PDF'
                  : 'Cours illimités + questions illimitées'}
                {' '}— <span className="font-semibold">{upgrade.price}</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Le quota se renouvelle le 1er de chaque mois.
            Contactez votre administrateur pour changer de forfait.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
            <a
              href="/#pricing"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
            >
              Voir les forfaits <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
