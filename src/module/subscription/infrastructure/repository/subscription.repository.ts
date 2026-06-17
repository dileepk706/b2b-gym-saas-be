import { Pool } from 'pg';
import { inject, injectable } from 'tsyringe';
import ISubscriptionRepository from '@/module/subscription/domain/interfaces/subscription.repository.interface.js';
import Subscription, {
  TenantFeatureFlagRecord,
  TenantLimitRecord,
  Invoice,
  Payment,
  CheckoutSession,
} from '@/module/subscription/domain/entities/subscription.entity.js';
import SubscriptionPlan from '@/module/subscription/domain/entities/subscription-plan.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

@injectable()
class SubscriptionRepository implements ISubscriptionRepository {
  constructor(@inject(Pool) private readonly pool: Pool) {}

  private exec(client?: QueryExecutor): QueryExecutor {
    return client ?? this.pool;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Subscription read/write
  // ───────────────────────────────────────────────────────────────────────────

  findActiveByTenantId = async (
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<Subscription | null> => {
    const { rows } = await this.exec(client).query<Subscription>(
      `SELECT * FROM subscriptions
       WHERE tenant_id = $1
         AND status IN ('active','past_due','suspended')
       LIMIT 1`,
      [tenantId],
    );
    return rows[0] ?? null;
  };

  findById = async (id: string, client?: QueryExecutor): Promise<Subscription | null> => {
    const { rows } = await this.exec(client).query<Subscription>(
      'SELECT * FROM subscriptions WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  };

  findAllByTenantId = async (tenantId: string, client?: QueryExecutor): Promise<Subscription[]> => {
    const { rows } = await this.exec(client).query<Subscription>(
      `SELECT * FROM subscriptions WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return rows;
  };

  createSubscription = async (
    data: Omit<Subscription, 'id' | 'created_at'>,
    client?: QueryExecutor,
  ): Promise<Subscription> => {
    const { rows } = await this.exec(client).query<Subscription>(
      `INSERT INTO subscriptions (
         tenant_id, plan_id, status,
         starts_at, expires_at, cancelled_at,
         trial_ends_at, current_period_start, current_period_end,
         cancel_at_period_end, scheduled_plan_id, renewed_from_id, metadata
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        data.tenant_id,
        data.plan_id,
        data.status,
        data.starts_at,
        data.expires_at ?? null,
        data.cancelled_at ?? null,
        data.trial_ends_at ?? null,
        data.current_period_start,
        data.current_period_end ?? null,
        data.cancel_at_period_end ?? false,
        data.scheduled_plan_id ?? null,
        data.renewed_from_id ?? null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ],
    );
    return rows[0];
  };

  updateSubscription = async (
    id: string,
    data: Partial<Omit<Subscription, 'id' | 'tenant_id' | 'created_at'>>,
    client?: QueryExecutor,
  ): Promise<Subscription> => {
    const keys = Object.keys(data) as (keyof typeof data)[];
    const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const values = keys.map((k) => {
      const val = data[k];
      if (k === 'metadata' && val !== null && val !== undefined) {
        return JSON.stringify(val);
      }
      return val ?? null;
    });

    const { rows } = await this.exec(client).query<Subscription>(
      `UPDATE subscriptions SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    return rows[0];
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Background job batch queries — uses SELECT FOR UPDATE SKIP LOCKED
  // ───────────────────────────────────────────────────────────────────────────

  findDueForRenewal = async (now: Date, client?: QueryExecutor): Promise<Subscription[]> => {
    const { rows } = await this.exec(client).query<Subscription>(
      `SELECT * FROM subscriptions
       WHERE status = 'active'
         AND current_period_end IS NOT NULL
         AND current_period_end <= $1
       FOR UPDATE SKIP LOCKED`,
      [now],
    );
    return rows;
  };

  findPastDueForRetry = async (now: Date, client?: QueryExecutor): Promise<Subscription[]> => {
    // past_due subs that haven't been retried in the last 6 hours
    const { rows } = await this.exec(client).query<Subscription>(
      `SELECT s.* FROM subscriptions s
       JOIN invoices i ON i.subscription_id = s.id AND i.status = 'open'
       WHERE s.status = 'past_due'
         AND NOT EXISTS (
           SELECT 1 FROM payments p
           WHERE p.invoice_id = i.id
             AND p.created_at > (NOW() - interval '6 hours')
         )
       FOR UPDATE OF s SKIP LOCKED`,
      [],
    );
    return rows;
  };

  findCancelledPastPeriodEnd = async (
    now: Date,
    client?: QueryExecutor,
  ): Promise<Subscription[]> => {
    const { rows } = await this.exec(client).query<Subscription>(
      `SELECT * FROM subscriptions
       WHERE status = 'cancelled'
         AND current_period_end IS NOT NULL
         AND current_period_end <= $1
       FOR UPDATE SKIP LOCKED`,
      [now],
    );
    return rows;
  };

  findDueForDowngrade = async (now: Date, client?: QueryExecutor): Promise<Subscription[]> => {
    const { rows } = await this.exec(client).query<Subscription>(
      `SELECT * FROM subscriptions
       WHERE status = 'active'
         AND scheduled_plan_id IS NOT NULL
         AND current_period_end IS NOT NULL
         AND current_period_end <= $1
       FOR UPDATE SKIP LOCKED`,
      [now],
    );
    return rows;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Feature flags — effective-date aware
  // ───────────────────────────────────────────────────────────────────────────

  findActiveFeatureFlags = async (
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<TenantFeatureFlagRecord[]> => {
    const { rows } = await this.exec(client).query<TenantFeatureFlagRecord>(
      `SELECT * FROM feature_flags
       WHERE tenant_id = $1
         AND (effective_until IS NULL OR effective_until > now())
         AND (effective_from IS NULL OR effective_from <= now())
       ORDER BY feature_id ASC`,
      [tenantId],
    );
    return rows;
  };

  setActiveFeatureFlags = async (
    tenantId: string,
    features: SubscriptionPlan['features'],
    client?: QueryExecutor,
  ): Promise<TenantFeatureFlagRecord[]> => {
    const exec = this.exec(client);

    // Expire all current active flags immediately
    await exec.query(
      `UPDATE feature_flags
       SET effective_until = now()
       WHERE tenant_id = $1
         AND (effective_until IS NULL OR effective_until > now())`,
      [tenantId],
    );

    if (features.length === 0) return [];

    const values: Array<string | boolean | null> = [];
    const placeholders = features
      .map((f, i) => {
        const o = i * 4;
        values.push(tenantId, f.key, true, 'subscription');
        return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, now(), NULL)`;
      })
      .join(', ');

    const { rows } = await exec.query<TenantFeatureFlagRecord>(
      `INSERT INTO feature_flags (tenant_id, feature_id, enabled, source, effective_from, effective_until)
       VALUES ${placeholders}
       ON CONFLICT (tenant_id, feature_id)
       DO UPDATE SET
         enabled = EXCLUDED.enabled,
         source = EXCLUDED.source,
         effective_from = now(),
         effective_until = NULL
       RETURNING *`,
      values,
    );
    return rows;
  };

  scheduleFutureFeatureFlags = async (
    tenantId: string,
    features: SubscriptionPlan['features'],
    effectiveFrom: Date,
    client?: QueryExecutor,
  ): Promise<void> => {
    if (features.length === 0) return;

    // Remove any already-scheduled (future) flags not yet in effect
    await this.exec(client).query(
      `DELETE FROM feature_flags
       WHERE tenant_id = $1
         AND effective_from > now()
         AND source = 'scheduled'`,
      [tenantId],
    );

    const values: Array<string | boolean | Date | null> = [];
    const placeholders = features
      .map((f, i) => {
        const o = i * 5;
        values.push(tenantId, f.key, true, 'scheduled', effectiveFrom);
        return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, NULL)`;
      })
      .join(', ');

    await this.exec(client).query(
      `INSERT INTO feature_flags (tenant_id, feature_id, enabled, source, effective_from, effective_until)
       VALUES ${placeholders}
       ON CONFLICT (tenant_id, feature_id) DO NOTHING`,
      values,
    );
  };

  expireFeatureFlags = async (
    tenantId: string,
    expiresAt: Date,
    client?: QueryExecutor,
  ): Promise<void> => {
    await this.exec(client).query(
      `UPDATE feature_flags
       SET effective_until = $2
       WHERE tenant_id = $1
         AND (effective_until IS NULL OR effective_until > $2)
         AND source = 'subscription'`,
      [tenantId, expiresAt],
    );
  };

  activateScheduledFeatureFlags = async (
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<TenantFeatureFlagRecord[]> => {
    const exec = this.exec(client);

    // Expire current active flags
    await exec.query(
      `UPDATE feature_flags
       SET effective_until = now()
       WHERE tenant_id = $1
         AND source = 'subscription'
         AND (effective_until IS NULL OR effective_until > now())`,
      [tenantId],
    );

    // Promote scheduled flags to active
    const { rows } = await exec.query<TenantFeatureFlagRecord>(
      `UPDATE feature_flags
       SET source = 'subscription', effective_from = now(), effective_until = NULL
       WHERE tenant_id = $1
         AND source = 'scheduled'
       RETURNING *`,
      [tenantId],
    );
    return rows;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Tenant limits — effective-date aware
  // ───────────────────────────────────────────────────────────────────────────

  findActiveTenantLimits = async (
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<TenantLimitRecord[]> => {
    const { rows } = await this.exec(client).query<TenantLimitRecord>(
      `SELECT * FROM tenant_limits
       WHERE tenant_id = $1
         AND (effective_until IS NULL OR effective_until > now())
         AND (effective_from IS NULL OR effective_from <= now())
       ORDER BY key ASC`,
      [tenantId],
    );
    return rows;
  };

  setActiveTenantLimits = async (
    tenantId: string,
    limits: SubscriptionPlan['limits'],
    client?: QueryExecutor,
  ): Promise<TenantLimitRecord[]> => {
    const exec = this.exec(client);

    await exec.query(
      `UPDATE tenant_limits
       SET effective_until = now()
       WHERE tenant_id = $1
         AND (effective_until IS NULL OR effective_until > now())`,
      [tenantId],
    );

    if (limits.length === 0) return [];

    const values: Array<string | number | null> = [];
    const placeholders = limits
      .map((l, i) => {
        const o = i * 4;
        values.push(tenantId, l.key, l.value ?? null, 'subscription');
        return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, now(), NULL)`;
      })
      .join(', ');

    const { rows } = await exec.query<TenantLimitRecord>(
      `INSERT INTO tenant_limits (tenant_id, key, value, source, effective_from, effective_until)
       VALUES ${placeholders}
       ON CONFLICT (tenant_id, key)
       DO UPDATE SET
         value = EXCLUDED.value,
         source = EXCLUDED.source,
         effective_from = now(),
         effective_until = NULL
       RETURNING *`,
      values,
    );
    return rows;
  };

  schedulesFutureTenantLimits = async (
    tenantId: string,
    limits: SubscriptionPlan['limits'],
    effectiveFrom: Date,
    client?: QueryExecutor,
  ): Promise<void> => {
    if (limits.length === 0) return;

    await this.exec(client).query(
      `DELETE FROM tenant_limits
       WHERE tenant_id = $1
         AND effective_from > now()
         AND source = 'scheduled'`,
      [tenantId],
    );

    const values: Array<string | number | Date | null> = [];
    const placeholders = limits
      .map((l, i) => {
        const o = i * 5;
        values.push(tenantId, l.key, l.value ?? null, 'scheduled', effectiveFrom);
        return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, NULL)`;
      })
      .join(', ');

    await this.exec(client).query(
      `INSERT INTO tenant_limits (tenant_id, key, value, source, effective_from, effective_until)
       VALUES ${placeholders}
       ON CONFLICT (tenant_id, key) DO NOTHING`,
      values,
    );
  };

  expireTenantLimits = async (
    tenantId: string,
    expiresAt: Date,
    client?: QueryExecutor,
  ): Promise<void> => {
    await this.exec(client).query(
      `UPDATE tenant_limits
       SET effective_until = $2
       WHERE tenant_id = $1
         AND (effective_until IS NULL OR effective_until > $2)
         AND source = 'subscription'`,
      [tenantId, expiresAt],
    );
  };

  activateScheduledTenantLimits = async (
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<TenantLimitRecord[]> => {
    const exec = this.exec(client);

    await exec.query(
      `UPDATE tenant_limits
       SET effective_until = now()
       WHERE tenant_id = $1
         AND source = 'subscription'
         AND (effective_until IS NULL OR effective_until > now())`,
      [tenantId],
    );

    const { rows } = await exec.query<TenantLimitRecord>(
      `UPDATE tenant_limits
       SET source = 'subscription', effective_from = now(), effective_until = NULL
       WHERE tenant_id = $1
         AND source = 'scheduled'
       RETURNING *`,
      [tenantId],
    );
    return rows;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Invoices
  // ───────────────────────────────────────────────────────────────────────────

  createInvoice = async (
    data: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>,
    client?: QueryExecutor,
  ): Promise<Invoice> => {
    const { rows } = await this.exec(client).query<Invoice>(
      `INSERT INTO invoices (
         tenant_id, subscription_id, amount, currency, status,
         due_date, paid_at, period_start, period_end, description, idempotency_key
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        data.tenant_id,
        data.subscription_id ?? null,
        data.amount,
        data.currency,
        data.status,
        data.due_date ?? null,
        data.paid_at ?? null,
        data.period_start ?? null,
        data.period_end ?? null,
        data.description ?? null,
        data.idempotency_key ?? null,
      ],
    );
    return rows[0];
  };

  findInvoiceById = async (id: string, client?: QueryExecutor): Promise<Invoice | null> => {
    const { rows } = await this.exec(client).query<Invoice>(
      'SELECT * FROM invoices WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  };

  findInvoiceByIdempotencyKey = async (
    key: string,
    client?: QueryExecutor,
  ): Promise<Invoice | null> => {
    const { rows } = await this.exec(client).query<Invoice>(
      'SELECT * FROM invoices WHERE idempotency_key = $1',
      [key],
    );
    return rows[0] ?? null;
  };

  findInvoiceBySubscriptionId = async (
    subscriptionId: string,
    client?: QueryExecutor,
  ): Promise<Invoice> => {
    const { rows } = await this.exec(client).query<Invoice>(
      `SELECT * FROM invoices
       WHERE subscription_id = $1
       ORDER BY created_at DESC`,
      [subscriptionId],
    );
    return rows[0];
  };

  findInvoicesByTenantId = async (tenantId: string, client?: QueryExecutor): Promise<Invoice[]> => {
    const { rows } = await this.exec(client).query<Invoice>(
      `SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return rows;
  };

  findOpenInvoicesBySubscriptionId = async (
    subscriptionId: string,
    client?: QueryExecutor,
  ): Promise<Invoice[]> => {
    const { rows } = await this.exec(client).query<Invoice>(
      `SELECT * FROM invoices
       WHERE subscription_id = $1 AND status = 'open'
       ORDER BY created_at DESC`,
      [subscriptionId],
    );
    return rows;
  };

  updateInvoice = async (
    id: string,
    data: Partial<Omit<Invoice, 'id' | 'tenant_id' | 'created_at'>>,
    client?: QueryExecutor,
  ): Promise<Invoice> => {
    const keys = Object.keys(data) as (keyof typeof data)[];
    const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const values = keys.map((k) => data[k] ?? null);

    const { rows } = await this.exec(client).query<Invoice>(
      `UPDATE invoices SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    return rows[0];
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Payments
  // ───────────────────────────────────────────────────────────────────────────

  createPayment = async (
    data: Omit<Payment, 'id' | 'created_at'>,
    client?: QueryExecutor,
  ): Promise<Payment> => {
    const { rows } = await this.exec(client).query<Payment>(
      `INSERT INTO payments (
         invoice_id, tenant_id, amount, currency, status,
         provider, provider_payment_id, failure_reason, attempt_number, processed_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        data.invoice_id,
        data.tenant_id,
        data.amount,
        data.currency,
        data.status,
        data.provider,
        data.provider_payment_id ?? null,
        data.failure_reason ?? null,
        data.attempt_number,
        data.processed_at ?? null,
      ],
    );
    return rows[0];
  };

  findPaymentsByInvoiceId = async (
    invoiceId: string,
    client?: QueryExecutor,
  ): Promise<Payment[]> => {
    const { rows } = await this.exec(client).query<Payment>(
      `SELECT * FROM payments WHERE invoice_id = $1 ORDER BY created_at DESC`,
      [invoiceId],
    );
    return rows;
  };

  countPaymentAttemptsByInvoiceId = async (
    invoiceId: string,
    client?: QueryExecutor,
  ): Promise<number> => {
    const { rows } = await this.exec(client).query<{ count: string }>(
      `SELECT COUNT(*) as count FROM payments WHERE invoice_id = $1`,
      [invoiceId],
    );
    return parseInt(rows[0]?.count ?? '0', 10);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Checkout Sessions
  // ───────────────────────────────────────────────────────────────────────────

  createCheckoutSession = async (
    data: Omit<CheckoutSession, 'id' | 'created_at'>,
    client?: QueryExecutor,
  ): Promise<CheckoutSession> => {
    const { rows } = await this.exec(client).query<CheckoutSession>(
      `INSERT INTO checkout_sessions (tenant_id, plan_id, status, expires_at, completed_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.tenant_id, data.plan_id, data.status, data.expires_at, data.completed_at ?? null],
    );
    return rows[0];
  };

  findCheckoutSessionById = async (
    id: string,
    client?: QueryExecutor,
  ): Promise<CheckoutSession | null> => {
    const { rows } = await this.exec(client).query<CheckoutSession>(
      'SELECT * FROM checkout_sessions WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  };

  updateCheckoutSession = async (
    id: string,
    data: Partial<Omit<CheckoutSession, 'id' | 'tenant_id' | 'created_at'>>,
    client?: QueryExecutor,
  ): Promise<CheckoutSession> => {
    const keys = Object.keys(data) as (keyof typeof data)[];
    const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const values = keys.map((k) => data[k] ?? null);

    const { rows } = await this.exec(client).query<CheckoutSession>(
      `UPDATE checkout_sessions SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    return rows[0];
  };
}

export default SubscriptionRepository;
