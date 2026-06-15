import Subscription, {
  TenantFeatureFlag,
  TenantLimit,
  TenantFeatureFlagRecord,
  TenantLimitRecord,
} from '@/module/subscription/domain/entities/subscription.entity.js';
import SubscriptionPlan from '@/module/subscription/domain/entities/subscription-plan.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

export default interface ISubscriptionRepository {
  findActiveByTenantId(tenantId: string, client?: QueryExecutor): Promise<Subscription | null>;
  createOrUpdateSubscription(
    subscription: Pick<
      Subscription,
      'tenant_id' | 'plan_id' | 'status' | 'starts_at' | 'expires_at' | 'cancelled_at'
    >,
    client?: QueryExecutor,
  ): Promise<Subscription>;
  replaceTenantFeatureFlags(
    tenantId: string,
    features: SubscriptionPlan['features'],
    client?: QueryExecutor,
  ): Promise<TenantFeatureFlag[]>;
  replaceTenantLimits(
    tenantId: string,
    limits: SubscriptionPlan['limits'],
    client?: QueryExecutor,
  ): Promise<TenantLimit[]>;
  findTenantFeatureFlags(
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<TenantFeatureFlagRecord[]>;
  findTenantLimits(tenantId: string, client?: QueryExecutor): Promise<TenantLimitRecord[]>;
}
