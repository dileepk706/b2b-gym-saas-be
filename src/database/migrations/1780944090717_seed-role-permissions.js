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
  // Clear any existing role permissions to start fresh
  pgm.sql(`DELETE FROM role_permissions;`);

  // Owner - all permissions
  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id 
    FROM roles r, permissions p 
    WHERE r.name = 'owner';
  `);

  // Manager
  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id 
    FROM roles r, permissions p 
    WHERE r.name = 'manager' 
    AND (
      (p.resource = 'member' AND p.action IN ('create', 'update', 'view', 'suspend')) OR
      (p.resource = 'plan' AND p.action IN ('create', 'update', 'view')) OR
      (p.resource = 'class' AND p.action IN ('create', 'update', 'delete', 'view', 'enroll', 'unenroll')) OR
      (p.resource = 'staff' AND p.action IN ('create', 'update', 'view')) OR
      (p.resource = 'invoice' AND p.action IN ('create', 'update', 'view', 'pay', 'refund')) OR
      (p.resource = 'equipment' AND p.action IN ('create', 'update', 'view', 'reserve')) OR
      (p.resource = 'attendance' AND p.action IN ('mark', 'view', 'report')) OR
      (p.resource = 'report' AND p.action IN ('generate', 'view', 'export'))
    );
  `);

  // Trainer
  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id 
    FROM roles r, permissions p 
    WHERE r.name = 'trainer' 
    AND (
      (p.resource = 'class' AND p.action IN ('view', 'enroll', 'unenroll')) OR
      (p.resource = 'attendance' AND p.action IN ('mark', 'view')) OR
      (p.resource = 'member' AND p.action IN ('view'))
    );
  `);

  // Front Desk
  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id 
    FROM roles r, permissions p 
    WHERE r.name = 'front desk' 
    AND (
      (p.resource = 'member' AND p.action IN ('create', 'update', 'view')) OR
      (p.resource = 'class' AND p.action IN ('enroll', 'unenroll', 'view')) OR
      (p.resource = 'invoice' AND p.action IN ('create', 'view', 'pay')) OR
      (p.resource = 'attendance' AND p.action IN ('mark', 'view'))
    );
  `);

  // Receptionist
  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id 
    FROM roles r, permissions p 
    WHERE r.name = 'receptionist' 
    AND (
      (p.resource = 'member' AND p.action IN ('view')) OR
      (p.resource = 'class' AND p.action IN ('view', 'enroll')) OR
      (p.resource = 'attendance' AND p.action IN ('mark', 'view')) OR
      (p.resource = 'invoice' AND p.action IN ('view', 'pay'))
    );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DELETE FROM role_permissions;`);
};
