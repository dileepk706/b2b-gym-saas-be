/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addConstraint('subscriptions', 'subscriptions_tenant_id_key', {
    unique: ['tenant_id'],
  });

  pgm.createTable('tenant_limits', {
    tenant_id: {
      type: 'uuid',
      notNull: true,
      references: 'tenants(id)',
      onDelete: 'CASCADE',
    },
    key: {
      type: 'text',
      notNull: true,
    },
    value: {
      type: 'integer',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint('tenant_limits', 'tenant_limits_pkey', {
    primaryKey: ['tenant_id', 'key'],
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('tenant_limits');
  pgm.dropConstraint('subscriptions', 'subscriptions_tenant_id_key');
};
