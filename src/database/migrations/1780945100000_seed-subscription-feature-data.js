/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const PLAN_IDS = {
  free: '11111111-1111-4111-8111-111111111111',
  pro: '22222222-2222-4222-8222-222222222222',
  enterprise: '33333333-3333-4333-8333-333333333333',
};

const FEATURE_IDS = {
  memberManagement: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  staffManagement: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  multiBranch: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  basicAnalytics: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
  advancedAnalytics: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
  customRoles: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
  aiAssistant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
  payrollManagement: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8',
  epos: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    INSERT INTO subscription_plans (id, name, price,expires_in) VALUES
    ('${PLAN_IDS.free}', 'free', 0,30),
    ('${PLAN_IDS.pro}', 'pro', 2499,30),
    ('${PLAN_IDS.enterprise}', 'enterprise', 7999,30)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      price = EXCLUDED.price;
  `);

  pgm.sql(`
    INSERT INTO features (id, key, name) VALUES
    ('${FEATURE_IDS.memberManagement}', 'member_management', 'Member Management'),
    ('${FEATURE_IDS.staffManagement}', 'staff_management', 'Staff Management'),
    ('${FEATURE_IDS.multiBranch}', 'multi_branch', 'Multi-Branch'),
    ('${FEATURE_IDS.basicAnalytics}', 'basic_analytics', 'Basic Analytics'),
    ('${FEATURE_IDS.advancedAnalytics}', 'advanced_analytics', 'Advanced Analytics'),
    ('${FEATURE_IDS.customRoles}', 'custom_roles', 'Custom Roles'),
    ('${FEATURE_IDS.aiAssistant}', 'ai_assistant', 'AI Assistant'),
    ('${FEATURE_IDS.payrollManagement}', 'payroll_management', 'Payroll Management'),
    ('${FEATURE_IDS.epos}', 'epos', 'EPOS')
    ON CONFLICT (key) DO UPDATE SET
      id = EXCLUDED.id,
      name = EXCLUDED.name;
  `);

  pgm.sql(`
    INSERT INTO plan_features (plan_id, feature_id) VALUES
    ('${PLAN_IDS.free}', '${FEATURE_IDS.memberManagement}'),
    ('${PLAN_IDS.free}', '${FEATURE_IDS.staffManagement}'),
    ('${PLAN_IDS.free}', '${FEATURE_IDS.basicAnalytics}'),
    ('${PLAN_IDS.pro}', '${FEATURE_IDS.memberManagement}'),
    ('${PLAN_IDS.pro}', '${FEATURE_IDS.staffManagement}'),
    ('${PLAN_IDS.pro}', '${FEATURE_IDS.basicAnalytics}'),
    ('${PLAN_IDS.pro}', '${FEATURE_IDS.advancedAnalytics}'),
    ('${PLAN_IDS.pro}', '${FEATURE_IDS.multiBranch}'),
    ('${PLAN_IDS.pro}', '${FEATURE_IDS.customRoles}'),
    ('${PLAN_IDS.enterprise}', '${FEATURE_IDS.memberManagement}'),
    ('${PLAN_IDS.enterprise}', '${FEATURE_IDS.staffManagement}'),
    ('${PLAN_IDS.enterprise}', '${FEATURE_IDS.basicAnalytics}'),
    ('${PLAN_IDS.enterprise}', '${FEATURE_IDS.advancedAnalytics}'),
    ('${PLAN_IDS.enterprise}', '${FEATURE_IDS.multiBranch}'),
    ('${PLAN_IDS.enterprise}', '${FEATURE_IDS.customRoles}'),
    ('${PLAN_IDS.enterprise}', '${FEATURE_IDS.aiAssistant}'),
    ('${PLAN_IDS.enterprise}', '${FEATURE_IDS.payrollManagement}'),
    ('${PLAN_IDS.enterprise}', '${FEATURE_IDS.epos}')
    ON CONFLICT (plan_id, feature_id) DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO plan_limits (plan_id, key, value) VALUES
    ('${PLAN_IDS.free}', 'max_members', 10),
    ('${PLAN_IDS.free}', 'max_staffs', 5),
    ('${PLAN_IDS.free}', 'max_branches', 1),
    ('${PLAN_IDS.pro}', 'max_members', 15),
    ('${PLAN_IDS.pro}', 'max_staffs', 10),
    ('${PLAN_IDS.pro}', 'max_branches', 5),
    ('${PLAN_IDS.enterprise}', 'max_members', NULL),
    ('${PLAN_IDS.enterprise}', 'max_staffs', NULL),
    ('${PLAN_IDS.enterprise}', 'max_branches', NULL);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM plan_limits WHERE plan_id IN (
      '${PLAN_IDS.free}',
      '${PLAN_IDS.pro}',
      '${PLAN_IDS.enterprise}'
    );
  `);

  pgm.sql(`
    DELETE FROM plan_features WHERE plan_id IN (
      '${PLAN_IDS.free}',
      '${PLAN_IDS.pro}',
      '${PLAN_IDS.enterprise}'
    );
  `);

  pgm.sql(`
    DELETE FROM features WHERE id IN (
      '${FEATURE_IDS.memberManagement}',
      '${FEATURE_IDS.staffManagement}',
      '${FEATURE_IDS.multiBranch}',
      '${FEATURE_IDS.basicAnalytics}',
      '${FEATURE_IDS.advancedAnalytics}',
      '${FEATURE_IDS.customRoles}',
      '${FEATURE_IDS.aiAssistant}',
      '${FEATURE_IDS.payrollManagement}',
      '${FEATURE_IDS.epos}'
    );
  `);

  pgm.sql(`
    DELETE FROM subscription_plans WHERE id IN (
      '${PLAN_IDS.free}',
      '${PLAN_IDS.pro}',
      '${PLAN_IDS.enterprise}'
    );
  `);
};
