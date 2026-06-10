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
  pgm.dropColumns('permissions', ['slug', 'group']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.addColumns('permissions', {
    slug: {
      type: 'varchar(255)',
    },
    group: {
      type: 'varchar(255)',
    },
  });

  pgm.sql(`
    UPDATE permissions
    SET slug = resource || '.' || action
    WHERE resource IS NOT NULL AND action IS NOT NULL;
  `);
};
