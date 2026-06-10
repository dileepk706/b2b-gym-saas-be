export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export default interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: Date;
  expires_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date | null;
}

export interface TenantFeatureFlag {
  tenant_id: string;
  feature_id: string;
  enabled: boolean;
}

export interface TenantLimit {
  tenant_id: string;
  key: string;
  value: number | null;
}

export interface TenantFeatureFlagRecord {
  tenant_id: string;
  feature_id: string;
  enabled: boolean;
}

export interface TenantLimitRecord {
  tenant_id: string;
  key: string;
  value: number | null;
}
