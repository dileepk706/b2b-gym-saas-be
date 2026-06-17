/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Production-ready subscription schema migration.
 *
 * Changes:
 * 1. Drops the UNIQUE(tenant_id) constraint on `subscriptions` (blocks history)
 * 2. Creates `subscription_status` ENUM
 * 3. Adds billing-lifecycle columns to `subscriptions`
 * 4. Adds trial/billing columns to `subscription_plans`
 * 5. Creates `invoices`, `payments`, `checkout_sessions` tables
 * 6. Adds partial unique index (only one active/trialing/past_due per tenant)
 * 7. Adds effective-date columns to `feature_flags` and `tenant_limits`
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // ─── 1. Drop the blocker UNIQUE constraint ────────────────────────────────
  pgm.dropConstraint('subscriptions', 'subscriptions_tenant_id_key', {
    ifExists: true,
  });

  // ─── 2. Subscription status ENUM ─────────────────────────────────────────
  pgm.createType('subscription_status', [
    'trialing',
    'active',
    'past_due',
    'cancelled',
    'expired',
    'suspended',
  ]);

  // ─── 3. Alter subscriptions: status column + new lifecycle columns ─────────
  pgm.sql(`
    ALTER TABLE subscriptions
      ALTER COLUMN status TYPE subscription_status
        USING CASE status
          WHEN 'active'    THEN 'active'::subscription_status
          WHEN 'cancelled' THEN 'cancelled'::subscription_status
          WHEN 'expired'   THEN 'expired'::subscription_status
          ELSE 'active'::subscription_status
        END,
      ALTER COLUMN starts_at TYPE timestamptz USING starts_at::timestamptz,
      ALTER COLUMN expires_at TYPE timestamptz USING expires_at::timestamptz,
      ALTER COLUMN cancelled_at TYPE timestamptz USING cancelled_at::timestamptz,
      ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz
  `);

  pgm.addColumns('subscriptions', {
    trial_ends_at: {
      type: 'timestamptz',
    },
    current_period_start: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    current_period_end: {
      type: 'timestamptz',
    },
    cancel_at_period_end: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    scheduled_plan_id: {
      type: 'uuid',
      references: 'subscription_plans(id)',
      onDelete: 'SET NULL',
    },
    renewed_from_id: {
      type: 'uuid',
    },
    metadata: {
      type: 'jsonb',
    },
  });

  // Self-referencing FK for renewal chain (added after column creation)
  pgm.sql(`
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_renewed_from_id_fkey
        FOREIGN KEY (renewed_from_id) REFERENCES subscriptions(id) ON DELETE SET NULL
  `);

  // Partial unique: only one active subscription per tenant at a time
  pgm.sql(`
    CREATE UNIQUE INDEX subscriptions_one_active_per_tenant
      ON subscriptions (tenant_id)
      WHERE status IN ('trialing', 'active', 'past_due', 'suspended')
  `);

  // Performance indexes
  pgm.createIndex('subscriptions', ['tenant_id', 'status']);
  pgm.createIndex('subscriptions', ['current_period_end']);
  pgm.createIndex('subscriptions', ['trial_ends_at']);

  // ─── 4. Alter subscription_plans ─────────────────────────────────────────
  pgm.addColumns('subscription_plans', {
    billing_interval: {
      type: 'text',
      notNull: true,
      default: 'month',
    },
    trial_days: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    sort_order: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    description: {
      type: 'text',
    },
    currency: {
      type: 'text',
      notNull: true,
      default: 'GBP',
    },
  });

  // ─── 5. Create invoices table ─────────────────────────────────────────────
  pgm.createTable('invoices', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    tenant_id: {
      type: 'uuid',
      notNull: true,
      references: 'tenants(id)',
      onDelete: 'CASCADE',
    },
    subscription_id: {
      type: 'uuid',
      references: 'subscriptions(id)',
      onDelete: 'SET NULL',
    },
    amount: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    currency: {
      type: 'text',
      notNull: true,
      default: 'GBP',
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'draft',
    },
    due_date: {
      type: 'timestamptz',
    },
    paid_at: {
      type: 'timestamptz',
    },
    period_start: {
      type: 'timestamptz',
    },
    period_end: {
      type: 'timestamptz',
    },
    description: {
      type: 'text',
    },
    idempotency_key: {
      type: 'text',
      unique: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('invoices', ['tenant_id', 'status']);
  pgm.createIndex('invoices', ['subscription_id']);
  pgm.sql(`
    ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
      CHECK (status IN ('draft','open','paid','void','uncollectible'))
  `);

  // ─── 6. Create payments table ─────────────────────────────────────────────
  pgm.createTable('payments', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    invoice_id: {
      type: 'uuid',
      notNull: true,
      references: 'invoices(id)',
      onDelete: 'CASCADE',
    },
    tenant_id: {
      type: 'uuid',
      notNull: true,
      references: 'tenants(id)',
      onDelete: 'CASCADE',
    },
    amount: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    currency: {
      type: 'text',
      notNull: true,
      default: 'INR',
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'pending',
    },
    provider: {
      type: 'text',
      notNull: true,
      default: 'mock',
    },
    provider_payment_id: {
      type: 'text',
    },
    failure_reason: {
      type: 'text',
    },
    attempt_number: {
      type: 'integer',
      notNull: true,
      default: 1,
    },
    processed_at: {
      type: 'timestamptz',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('payments', ['invoice_id']);
  pgm.createIndex('payments', ['tenant_id', 'status']);
  pgm.sql(`
    ALTER TABLE payments ADD CONSTRAINT payments_status_check
      CHECK (status IN ('pending','succeeded','failed','refunded'))
  `);

  // ─── 7. Create checkout_sessions table ───────────────────────────────────
  pgm.createTable('checkout_sessions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    tenant_id: {
      type: 'uuid',
      notNull: true,
      references: 'tenants(id)',
      onDelete: 'CASCADE',
    },
    plan_id: {
      type: 'uuid',
      notNull: true,
      references: 'subscription_plans(id)',
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'pending',
    },
    expires_at: {
      type: 'timestamptz',
      notNull: true,
    },
    completed_at: {
      type: 'timestamptz',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('checkout_sessions', ['tenant_id', 'status']);
  pgm.sql(`
    ALTER TABLE checkout_sessions ADD CONSTRAINT checkout_sessions_status_check
      CHECK (status IN ('pending','completed','expired'))
  `);

  // ─── 8. Extend feature_flags with effective-date columns ─────────────────
  pgm.addColumns('feature_flags', {
    source: {
      type: 'text',
      notNull: true,
      default: 'subscription',
    },
    effective_from: {
      type: 'timestamptz',
      default: pgm.func('now()'),
    },
    effective_until: {
      type: 'timestamptz',
    },
  });

  // ─── 9. Extend tenant_limits with effective-date columns ─────────────────
  pgm.addColumns('tenant_limits', {
    source: {
      type: 'text',
      notNull: true,
      default: 'subscription',
    },
    effective_from: {
      type: 'timestamptz',
      default: pgm.func('now()'),
    },
    effective_until: {
      type: 'timestamptz',
    },
  });

  // ─── 10. Update subscription_plans seed: add trial days ──────────────────
  pgm.sql(`
    UPDATE subscription_plans SET
      billing_interval = 'month',
      trial_days = CASE name
        WHEN 'free'       THEN 0
        WHEN 'pro'        THEN 14
        WHEN 'enterprise' THEN 14
        ELSE 0
      END,
      sort_order = CASE name
        WHEN 'free'       THEN 1
        WHEN 'pro'        THEN 2
        WHEN 'enterprise' THEN 3
        ELSE 99
      END,
      is_active = true,
      currency = 'GBP'
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Remove effective-date columns from tenant_limits
  pgm.dropColumns('tenant_limits', ['source', 'effective_from', 'effective_until'], {
    ifExists: true,
  });

  // Remove effective-date columns from feature_flags
  pgm.dropColumns('feature_flags', ['source', 'effective_from', 'effective_until'], {
    ifExists: true,
  });

  // Drop new tables
  pgm.dropTable('checkout_sessions', { ifExists: true });
  pgm.dropTable('payments', { ifExists: true });
  pgm.dropTable('invoices', { ifExists: true });

  // Remove plan columns
  pgm.dropColumns('subscription_plans', [
    'billing_interval',
    'trial_days',
    'is_active',
    'sort_order',
    'description',
    'currency',
  ]);

  // Drop partial unique index
  pgm.sql('DROP INDEX IF EXISTS subscriptions_one_active_per_tenant');

  // Drop indexes
  pgm.dropIndex('subscriptions', ['tenant_id', 'status'], { ifExists: true });
  pgm.dropIndex('subscriptions', ['current_period_end'], { ifExists: true });
  pgm.dropIndex('subscriptions', ['trial_ends_at'], { ifExists: true });

  // Remove subscription columns
  pgm.sql(`
    ALTER TABLE subscriptions
      DROP CONSTRAINT IF EXISTS subscriptions_renewed_from_id_fkey
  `);
  pgm.dropColumns('subscriptions', [
    'trial_ends_at',
    'current_period_start',
    'current_period_end',
    'cancel_at_period_end',
    'scheduled_plan_id',
    'renewed_from_id',
    'metadata',
  ]);

  // Revert status column type
  pgm.sql(`
    ALTER TABLE subscriptions
      ALTER COLUMN status TYPE text USING status::text
  `);

  // Drop enum
  pgm.dropType('subscription_status');

  // Re-add original unique constraint
  pgm.addConstraint('subscriptions', 'subscriptions_tenant_id_key', {
    unique: ['tenant_id'],
  });
};
