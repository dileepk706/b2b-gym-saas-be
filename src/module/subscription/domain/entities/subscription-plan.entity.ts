export interface SubscriptionPlanFeature {
  id: string;
  key: string;
  name: string;
}

export interface SubscriptionPlanLimit {
  key: string;
  value: number | null;
}

export default interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  billing_interval: 'month' | 'year';
  trial_days: number;
  is_active: boolean;
  sort_order: number;
  expires_in: number | null;
  features: SubscriptionPlanFeature[];
  limits: SubscriptionPlanLimit[];
}
