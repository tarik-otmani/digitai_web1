import { useState, useEffect } from 'react';
import { getSubscriptionMe, SubscriptionData, PlanLimits, MonthlyUsage } from '../api';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Crown,
  Zap,
  Building,
  Star
} from 'lucide-react';

export default function SubscriptionStatus() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptionMe();
      setSubscriptionData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Star className="w-6 h-6 text-gray-600" />;
      case 'creator': return <Zap className="w-6 h-6 text-blue-600" />;
      case 'pro': return <Crown className="w-6 h-6 text-purple-600" />;
      case 'institution': return <Building className="w-6 h-6 text-orange-600" />;
      default: return <Star className="w-6 h-6 text-gray-600" />;
    }
  };

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (limit === null) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadSubscriptionData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { subscription, limits, usage } = subscriptionData!;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Your Subscription</h2>
          {subscription && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              subscription.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {subscription.status === 'active' ? 'Active' : subscription.status}
            </span>
          )}
        </div>

        {subscription ? (
          <div className="flex items-center gap-4 mb-6">
            {getPlanIcon(subscription.plan.id)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{subscription.plan.name}</h3>
              {subscription.plan.price !== null && subscription.plan.price > 0 && (
                <p className="text-gray-600">
                  ${subscription.plan.price}/{subscription.plan.billing_cycle}
                </p>
              )}
              {subscription.current_period_end && (
                <p className="text-sm text-gray-500">
                  Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">You're on the Free plan</p>
          </div>
        )}

        <div className="flex gap-4">
          <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
            Upgrade Plan
          </button>
          {subscription && subscription.status === 'active' && (
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Usage</h2>
        
        <div className="space-y-6">
          {/* Courses Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Courses Created</span>
              </div>
              <span className="text-sm text-gray-600">
                {usage.courses_created} / {limits.max_courses_per_month || '∞'}
              </span>
            </div>
            {limits.max_courses_per_month !== null && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(getUsagePercentage(usage.courses_created, limits.max_courses_per_month))}`}
                  style={{ width: `${getUsagePercentage(usage.courses_created, limits.max_courses_per_month)}%` }}
                />
              </div>
            )}
          </div>

          {/* Exams Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Exams Created</span>
              </div>
              <span className="text-sm text-gray-600">
                {usage.exams_created} / {limits.max_questions_per_exam ? 'Varies' : '∞'}
              </span>
            </div>
          </div>

          {/* Questions Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Questions Generated</span>
              </div>
              <span className="text-sm text-gray-600">
                {usage.questions_generated}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Available */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Available Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            {limits.pdf_export ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-700">PDF Export</span>
          </div>

          <div className="flex items-center gap-3">
            {limits.lms_export ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-700">LMS Export</span>
          </div>

          <div className="flex items-center gap-3">
            {limits.api_access ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-700">API Access</span>
          </div>

          <div className="flex items-center gap-3">
            {limits.mass_generation ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-700">Mass Generation</span>
          </div>

          <div className="flex items-center gap-3">
            {limits.watermark ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            <span className="text-sm text-gray-700">No Watermark</span>
          </div>
        </div>
      </div>
    </div>
  );
}
