import Role, { RolePermission } from '@/module/role/domain/entities/role.entity.js';
import { Pool } from 'pg';
import { inject, injectable } from 'tsyringe';
import { QueryExecutor } from '@/shared/types/database.js';
import { insertQueryBuilder, queryBuilder } from '@/utils/db.psql.util.js';
import { IRolePermissionRepository } from '@/module/role/domain/interfaces/role-permission.repository.interface.js';

@injectable()
class RolePermissionRepository implements IRolePermissionRepository {
  constructor(@inject(Pool) private readonly pool: Pool) {}

  findAll = async (
    rolePermission: Partial<RolePermission> | null,
    client?: QueryExecutor,
  ): Promise<RolePermission[]> => {
    const exec = client || this.pool;
    if (rolePermission && 'tenant_id' in rolePermission && rolePermission.tenant_id === null) {
      const r = await exec.query('SELECT * FROM role_permissions WHERE tenant_id IS NULL');
      return r.rows;
    }
    const { query, values } = queryBuilder('role_permissions', rolePermission);
    const r = await exec.query(query, values);
    return r.rows;
  };

  create = async (
    rolePermission: Pick<RolePermission, 'tenant_id' | 'role_id' | 'permission_id'>,
    client?: QueryExecutor,
  ): Promise<RolePermission> => {
    const exec = client || this.pool;

    const { query, values } = insertQueryBuilder('role_permissions', {
      tenant_id: rolePermission.tenant_id,
      role_id: rolePermission.role_id,
      permission_id: rolePermission.permission_id,
    });

    const r = await exec.query(query, values);
    return r.rows[0];
  };
}

export default RolePermissionRepository;
