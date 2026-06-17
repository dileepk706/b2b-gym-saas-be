/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Converts any leftover 'trialing' subscriptions to 'active'.
 *
 * Root cause: When trial logic was removed, the findActiveByTenantId query
 * no longer looks for status = 'trialing'. If a tenant has an existing
 * 'trialing' subscription (created before trial logic was removed), the
 * lookup returns null, provisionNewSubscription is called, and the INSERT
 * fails on the unique constraint because the 'trialing' row still exists.
 *
 * Fix: Promote all 'trialing' subscriptions to 'active' so the system
 * treats them correctly going forward. Also resets current_period_end for
 * any trialing subs that used trial_ends_at as their period end.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Promote all trialing subs to active.
  // If their current_period_end was set to trial_ends_at (which is in the
  // past or near future), recalculate it to be 1 month from now so renewals
  // work correctly going forward.
  pgm.sql(`
    UPDATE subscriptions
    SET
      status              = 'active',
      trial_ends_at       = NULL,
      current_period_start = now(),
      current_period_end  = now() + interval '1 month'
    WHERE status = 'trialing'
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Cannot safely revert — we don't know which subs were originally trialing.
  // This is intentionally a no-op.
};
