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
    ('member', 'create'),
    ('member', 'update'),
    ('member', 'delete'),
    ('member', 'view'),
    ('member', 'suspend'),
    ('member', 'assign_plan'),
    ('plan', 'create'),
    ('plan', 'update'),
    ('plan', 'delete'),
    ('plan', 'view'),
    ('class', 'create'),
    ('class', 'update'),
    ('class', 'delete'),
    ('class', 'view'),
    ('class', 'enroll'),
    ('class', 'unenroll'),
    ('staff', 'create'),
    ('staff', 'update'),
    ('staff', 'delete'),
    ('staff', 'view'),
    ('staff', 'assign_role'),
    ('invoice', 'create'),
    ('invoice', 'update'),
    ('invoice', 'delete'),
    ('invoice', 'view'),
    ('invoice', 'pay'),
    ('invoice', 'refund'),
    ('equipment', 'create'),
    ('equipment', 'update'),
    ('equipment', 'delete'),
    ('equipment', 'view'),
    ('equipment', 'reserve'),
    ('report', 'generate'),
    ('report', 'view'),
    ('report', 'export'),
    ('settings', 'update'),
    ('settings', 'view'),
    ('role', 'create'),
    ('role', 'update'),
    ('role', 'delete'),
    ('role', 'assign')
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
      ('member', 'create'), ('member', 'update'), ('member', 'delete'), ('member', 'view'), ('member', 'suspend'), ('member', 'assign_plan'),
      ('plan', 'create'), ('plan', 'update'), ('plan', 'delete'), ('plan', 'view'),
      ('class', 'create'), ('class', 'update'), ('class', 'delete'), ('class', 'view'), ('class', 'enroll'), ('class', 'unenroll'),
      ('staff', 'create'), ('staff', 'update'), ('staff', 'delete'), ('staff', 'view'), ('staff', 'assign_role'),
      ('invoice', 'create'), ('invoice', 'update'), ('invoice', 'delete'), ('invoice', 'view'), ('invoice', 'pay'), ('invoice', 'refund'),
      ('equipment', 'create'), ('equipment', 'update'), ('equipment', 'delete'), ('equipment', 'view'), ('equipment', 'reserve'),
      ('report', 'generate'), ('report', 'view'), ('report', 'export'),
      ('settings', 'update'), ('settings', 'view'),
      ('role', 'create'), ('role', 'update'), ('role', 'delete'), ('role', 'assign')
    );
  `);
};
