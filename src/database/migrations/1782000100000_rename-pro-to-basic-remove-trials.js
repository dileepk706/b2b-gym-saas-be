/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Cleans up plan data for a free-plan-first model:
 * 1. Renames the 'pro' plan to 'basic' (matching the new 3-tier: free / basic / enterprise)
 * 2. Sets trial_days = 0 for all plans — no trials, free plan is the entry point
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Rename 'pro' → 'basic'
  pgm.sql(`
    UPDATE subscription_plans
    SET name = 'basic'
    WHERE name = 'pro'
  `);

  // Remove all trial periods — free plan is the trial replacement
  pgm.sql(`
    UPDATE subscription_plans
    SET trial_days = 0
  `);

  // Update sort order to match new naming
  pgm.sql(`
    UPDATE subscription_plans SET sort_order = CASE name
      WHEN 'free'       THEN 1
      WHEN 'basic'      THEN 2
      WHEN 'enterprise' THEN 3
      ELSE 99
    END
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    UPDATE subscription_plans
    SET name = 'pro'
    WHERE name = 'basic'
  `);

  pgm.sql(`
    UPDATE subscription_plans SET sort_order = CASE name
      WHEN 'free'       THEN 1
      WHEN 'pro'        THEN 2
      WHEN 'enterprise' THEN 3
      ELSE 99
    END
  `);
};
