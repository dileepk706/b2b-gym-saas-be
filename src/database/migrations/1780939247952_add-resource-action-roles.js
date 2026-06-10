/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // 1. Add columns without constraints first to avoid the NOT NULL error on existing rows
  pgm.addColumns('permissions', {
    resource: {
      type: 'varchar(255)',
    },
    action: {
      type: 'varchar(255)',
    },
  });

  // 2. Backfill existing data using the slug column (e.g. 'members.view' -> resource: 'members', action: 'view')
  pgm.sql(`
    UPDATE permissions
    SET resource = split_part(slug, '.', 1),
        action = split_part(slug, '.', 2)
    WHERE resource IS NULL OR action IS NULL;
  `);

  // 3. Apply the NOT NULL constraints
  pgm.alterColumn('permissions', 'resource', { notNull: true });
  pgm.alterColumn('permissions', 'action', { notNull: true });

  // 4. Add a composite UNIQUE constraint instead of individual ones, 
  // since multiple permissions can share the same resource or action.
  pgm.addConstraint('permissions', 'permissions_resource_action_unique', {
    unique: ['resource', 'action']
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropConstraint('permissions', 'permissions_resource_action_unique');
  pgm.dropColumns('permissions', ['resource', 'action']);
};
