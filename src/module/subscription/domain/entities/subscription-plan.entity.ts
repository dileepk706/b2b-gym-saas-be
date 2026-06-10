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
  price: string;
  features: SubscriptionPlanFeature[];
  limits: SubscriptionPlanLimit[];
}
