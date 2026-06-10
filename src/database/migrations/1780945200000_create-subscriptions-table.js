/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('subscriptions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    tenant_id: {
      type: 'uuid',
      references: 'tenants(id)',
    },
    plan_id: {
      type: 'uuid',
      references: 'subscription_plans(id)',
    },
    status: {
      type: 'text',
      notNull: true,
    },
    starts_at: {
      type: 'timestamp',
      notNull: true,
    },
    expires_at: {
      type: 'timestamp',
    },
    cancelled_at: {
      type: 'timestamp',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()'),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('subscriptions');
};
