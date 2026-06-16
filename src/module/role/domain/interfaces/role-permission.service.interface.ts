import { RolePermission } from '../entities/role.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

export interface IRolePermissionService {
  replicateRolesPermission: (tenantId: string, client?: QueryExecutor) => Promise<RolePermission[]>;
  findAll: (tenantId: string, client?: QueryExecutor) => Promise<RolePermission[]>;
}
