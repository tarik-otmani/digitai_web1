import { useState, useEffect } from 'react';
import { getSubscriptionPlans, getSubscriptionMe, postSubscriptionSubscribe, postSubscriptionCancel, SubscriptionPlan, UserSubscription, PlanLimits, MonthlyUsage } from '../api';
import { Check, X, Crown, Zap, Building, Star } from 'lucide-react';

interface PricingCardProps {
  plan: SubscriptionPlan;
  currentSubscription?: UserSubscription | null;
  onSubscribe: (planId: string) => void;
  onCancel: () => void;
}

function PricingCard({ plan, currentSubscription, onSubscribe, onCancel }: PricingCardProps) {
  const isCurrentPlan = currentSubscription?.plan_id === plan.id;
  const canSubscribe = plan.price === 0 || !currentSubscription;
  
  const getPlanIcon = () => {
    switch (plan.id) {
      case 'free': return <Star className="w-6 h-6 text-gray-600" />;
      case 'creator': return <Zap className="w-6 h-6 text-blue-600" />;
      case 'pro': return <Crown className="w-6 h-6 text-purple-600" />;
      case 'institution': return <Building className="w-6 h-6 text-orange-600" />;
      default: return <Star className="w-6 h-6 text-gray-600" />;
    }
  };

  const getPlanColor = () => {
    switch (plan.id) {
      case 'free': return 'border-gray-300 bg-white';
      case 'creator': return 'border-blue-300 bg-blue-50';
      case 'pro': return 'border-purple-300 bg-purple-50';
      case 'institution': return 'border-orange-300 bg-orange-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className={`border-2 rounded-lg p-6 relative ${getPlanColor()} ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
      {isCurrentPlan && (
        <div className="absolute top-2 right-2">
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Current Plan</span>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getPlanIcon()}
          <h3 className="text-xl font-bold">{plan.name}</h3>
        </div>
      </div>

      <div className="mb-6">
        {plan.price === null ? (
          <p className="text-2xl font-bold">Contact Sales</p>
        ) : plan.price === 0 ? (
          <p className="text-2xl font-bold">Free</p>
        ) : (
          <p className="text-2xl font-bold">${plan.price}<span className="text-sm text-gray-600">/{plan.billing_cycle}</span></p>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
        
        {plan.watermark && (
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm">Includes watermark</span>
          </div>
        )}
        
        {plan.pdf_export && (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm">PDF export</span>
          </div>
        )}
        
        {plan.lms_export && (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm">LMS export</span>
          </div>
        )}
        
        {plan.api_access && (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm">API access</span>
          </div>
        )}
        
        {plan.mass_generation && (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm">Mass generation</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {isCurrentPlan ? (
          <button
            onClick={onCancel}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
          >
            Cancel Plan
          </button>
        ) : (
          <button
            onClick={() => onSubscribe(plan.id)}
            disabled={!canSubscribe}
            className={`w-full py-2 px-4 rounded transition-colors ${
              canSubscribe
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {plan.price === null ? 'Contact Sales' : plan.price === 0 ? 'Get Started' : 'Upgrade'}
          </button>
        )}
        
        {!canSubscribe && currentSubscription && (
          <p className="text-xs text-gray-500 text-center">
            You must cancel your current plan first
          </p>
        )}
      </div>
    </div>
  );
}

export default function Pricing() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes] = await Promise.all([
        getSubscriptionPlans(),
        getSubscriptionMe()
      ]);
      
      setPlans(plansRes.plans);
      setSubscription(subRes.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      await postSubscriptionSubscribe(planId);
      await loadData(); // Reload subscription data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to plan');
    }
  };

  const handleCancel = async () => {
    try {
      await postSubscriptionCancel();
      await loadData(); // Reload subscription data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 mb-8">
            Select the perfect plan for your educational content needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentSubscription={subscription}
              onSubscribe={handleSubscribe}
              onCancel={handleCancel}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need a Custom Solution?</h2>
          <p className="text-gray-600 mb-6">
            For institutions and large organizations, we offer custom solutions tailored to your specific needs.
          </p>
          <button className="bg-orange-500 text-white px-6 py-3 rounded hover:bg-orange-600 transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}
