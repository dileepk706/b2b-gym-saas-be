/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('subscription_plans', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    name: {
      type: 'text',
      notNull: true,
    },
    price: {
      type: 'numeric',
    },
    expires_in: {
      type: 'integer',
    },
  });

  pgm.createTable('features', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    key: {
      type: 'text',
      unique: true,
      notNull: true,
    },
    name: {
      type: 'text',
      notNull: true,
    },
  });

  pgm.createTable('plan_features', {
    plan_id: {
      type: 'uuid',
      notNull: true,
      references: 'subscription_plans(id)',
    },
    feature_id: {
      type: 'uuid',
      notNull: true,
      references: 'features(id)',
    },
  });
  pgm.addConstraint('plan_features', 'plan_features_pkey', {
    primaryKey: ['plan_id', 'feature_id'],
  });

  pgm.createTable('feature_flags', {
    tenant_id: {
      type: 'uuid',
      notNull: true,
    },
    feature_id: {
      type: 'text',
      notNull: true,
    },
    enabled: {
      type: 'boolean',
      default: true,
    },
  });
  pgm.addConstraint('feature_flags', 'feature_flags_pkey', {
    primaryKey: ['tenant_id', 'feature_id'],
  });

  pgm.createTable('plan_limits', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    plan_id: {
      type: 'uuid',
      references: 'subscription_plans(id)',
    },
    key: {
      type: 'text',
      notNull: true,
    },
    value: {
      type: 'integer',
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('plan_limits');
  pgm.dropTable('feature_flags');
  pgm.dropTable('plan_features');
  pgm.dropTable('features');
  pgm.dropTable('subscription_plans');
};
