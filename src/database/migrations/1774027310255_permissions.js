import { commonColumns } from '../migration-utils.js';

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
  pgm.createTable('permissions', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    slug: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    group: {
      type: 'varchar(255)',
      notNull: true,
    },
    ...commonColumns(pgm),
  });

  pgm.createTable('role_permissions', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    role_id: {
      type: 'uuid',
      notNull: true,
      references: 'roles(id)',
    },
    permission_id: {
      type: 'uuid',
      notNull: true,
      references: 'permissions(id)',
      onDelete: 'CASCADE',
    },
    ...commonColumns(pgm),
  });

  pgm.createTable('staff_permissions', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    staff_id: {
      type: 'uuid',
      notNull: true,
      references: 'staff(id)',
    },
    permission_id: {
      type: 'uuid',
      notNull: true,
      references: 'permissions(id)',
    },
    allowed: {
      type: 'boolean',
      default: true,
    },
    ...commonColumns(pgm),
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {};
