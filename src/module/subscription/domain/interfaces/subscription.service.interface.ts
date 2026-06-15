import SubscriptionPlan from '@/module/subscription/domain/entities/subscription-plan.entity.js';
import Subscription, {
  TenantFeatureFlag,
  TenantLimit,
} from '@/module/subscription/domain/entities/subscription.entity.js';

export interface SubscriptionProvisionResult {
  tenant: Record<string, unknown>;
  subscription: Subscription;
  plan: SubscriptionPlan;
  feature_flags: TenantFeatureFlag[];
  limits: TenantLimit[];
  created: boolean;
}

export interface CurrentSubscriptionResult {
  tenant: Record<string, unknown>;
  subscription: Subscription;
  plan: SubscriptionPlan;
  feature_flags: TenantFeatureFlag[];
  limits: TenantLimit[];
}

export default interface ISubscriptionService {
  subscribeTenant(tenantId: string, planId: string): Promise<SubscriptionProvisionResult>;
  getCurrentSubscription(tenantId: string): Promise<CurrentSubscriptionResult | null>;
}
