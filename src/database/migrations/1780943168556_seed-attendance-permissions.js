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
  pgm.sql(`
    INSERT INTO permissions (resource, action) VALUES
    ('attendance', 'create'),
    ('attendance', 'update'),
    ('attendance', 'delete'),
    ('attendance', 'view'),
    ('attendance', 'mark'),
    ('attendance', 'report')
    ON CONFLICT (resource, action) DO NOTHING;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM permissions WHERE (resource, action) IN (
      ('attendance', 'create'),
      ('attendance', 'update'),
      ('attendance', 'delete'),
      ('attendance', 'view'),
      ('attendance', 'mark'),
      ('attendance', 'report')
    );
  `);
};
