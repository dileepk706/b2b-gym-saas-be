import { Pool } from 'pg';
import { inject, injectable } from 'tsyringe';
import ISubscriptionRepository from '@/module/subscription/domain/interfaces/subscription.repository.interface.js';
import Subscription, {
  TenantFeatureFlag,
  TenantLimit,
  TenantFeatureFlagRecord,
  TenantLimitRecord,
} from '@/module/subscription/domain/entities/subscription.entity.js';
import SubscriptionPlan from '@/module/subscription/domain/entities/subscription-plan.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

@injectable()
class SubscriptionRepository implements ISubscriptionRepository {
  constructor(@inject(Pool) private readonly pool: Pool) {}

  private getExecutor(client?: QueryExecutor) {
    return client || this.pool;
  }

  findActiveByTenantId = async (
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<Subscription | null> => {
    const exec = this.getExecutor(client);
    const result = await exec.query<Subscription>(
      `
        SELECT *
        FROM subscriptions
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [tenantId],
    );

    return result.rows[0] || null;
  };

  createOrUpdateSubscription = async (
    subscription: Pick<
      Subscription,
      'tenant_id' | 'plan_id' | 'status' | 'starts_at' | 'expires_at' | 'cancelled_at'
    >,
    client?: QueryExecutor,
  ): Promise<Subscription> => {
    const exec = this.getExecutor(client);
    const existing = await this.findActiveByTenantId(subscription.tenant_id, client);

    if (existing) {
      const result = await exec.query<Subscription>(
        `
          UPDATE subscriptions
          SET
            plan_id = $2,
            status = $3,
            starts_at = $4,
            expires_at = $5,
            cancelled_at = $6
          WHERE id = $1
          RETURNING *
        `,
        [
          existing.id,
          subscription.plan_id,
          subscription.status,
          subscription.starts_at,
          subscription.expires_at,
          subscription.cancelled_at,
        ],
      );

      return result.rows[0];
    }

    const result = await exec.query<Subscription>(
      `
        INSERT INTO subscriptions (
          tenant_id,
          plan_id,
          status,
          starts_at,
          expires_at,
          cancelled_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        subscription.tenant_id,
        subscription.plan_id,
        subscription.status,
        subscription.starts_at,
        subscription.expires_at,
        subscription.cancelled_at,
      ],
    );

    return result.rows[0];
  };

  replaceTenantFeatureFlags = async (
    tenantId: string,
    features: SubscriptionPlan['features'],
    client?: QueryExecutor,
  ): Promise<TenantFeatureFlag[]> => {
    const exec = this.getExecutor(client);
    await exec.query('DELETE FROM feature_flags WHERE tenant_id = $1', [tenantId]);

    if (features.length === 0) return [];

    const values: Array<string | boolean> = [];
    const placeholders = features
      .map((feature, index) => {
        const offset = index * 3;
        values.push(tenantId, feature.key, true);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
      })
      .join(', ');

    const result = await exec.query<TenantFeatureFlag>(
      `
        INSERT INTO feature_flags (tenant_id, feature_id, enabled)
        VALUES ${placeholders}
        RETURNING *
      `,
      values,
    );

    return result.rows;
  };

  replaceTenantLimits = async (
    tenantId: string,
    limits: SubscriptionPlan['limits'],
    client?: QueryExecutor,
  ): Promise<TenantLimit[]> => {
    const exec = this.getExecutor(client);
    await exec.query('DELETE FROM tenant_limits WHERE tenant_id = $1', [tenantId]);

    if (limits.length === 0) return [];

    const values: Array<string | number | null> = [];
    const placeholders = limits
      .map((limit, index) => {
        const offset = index * 3;
        values.push(tenantId, limit.key, limit.value ?? null);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
      })
      .join(', ');

    const result = await exec.query<TenantLimit>(
      `
        INSERT INTO tenant_limits (tenant_id, key, value)
        VALUES ${placeholders}
        RETURNING *
      `,
      values,
    );

    return result.rows;
  };

  findTenantFeatureFlags = async (
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<TenantFeatureFlagRecord[]> => {
    const exec = this.getExecutor(client);
    const result = await exec.query<TenantFeatureFlagRecord>(
      `
        SELECT *
        FROM feature_flags
        WHERE tenant_id = $1
        ORDER BY feature_id ASC
      `,
      [tenantId],
    );

    return result.rows;
  };

  findTenantLimits = async (
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<TenantLimitRecord[]> => {
    const exec = this.getExecutor(client);
    const result = await exec.query<TenantLimitRecord>(
      `
        SELECT *
        FROM tenant_limits
        WHERE tenant_id = $1
        ORDER BY key ASC
      `,
      [tenantId],
    );

    return result.rows;
  };
}

export default SubscriptionRepository;
