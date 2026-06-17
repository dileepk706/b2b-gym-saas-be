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
  // Drop the existing roles_name_key unique constraint
  pgm.dropConstraint('roles', 'roles_name_key');

  // Create unique index for tenant roles (tenant_id is not null)
  pgm.addIndex('roles', ['tenant_id', 'name'], {
    name: 'roles_tenant_id_name_unique_idx',
    unique: true,
    where: 'tenant_id IS NOT NULL',
  });

  // Create unique index for global roles (tenant_id is null)
  pgm.addIndex('roles', ['name'], {
    name: 'roles_global_name_unique_idx',
    unique: true,
    where: 'tenant_id IS NULL',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex('roles', [], { name: 'roles_global_name_unique_idx' });
  pgm.dropIndex('roles', [], { name: 'roles_tenant_id_name_unique_idx' });

  pgm.addConstraint('roles', 'roles_name_key', {
    unique: ['name'],
  });
};
