import Role, { RolePermission } from '../entities/role.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

export interface IRolePermissionRepository {
  findAll: (
    rolePermission: Partial<RolePermission> | null,
    client?: QueryExecutor,
  ) => Promise<RolePermission[]>;
  create: (
    rolePermission: Pick<RolePermission, 'tenant_id' | 'role_id' | 'permission_id'>,
    client?: QueryExecutor,
  ) => Promise<RolePermission>;
}
