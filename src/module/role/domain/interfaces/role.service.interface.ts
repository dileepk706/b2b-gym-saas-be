import Role from '../entities/role.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

export interface IRoleService {
  findOneByName: (name: string, tenantId?: string, client?: QueryExecutor) => Promise<Role>;
  findOneById: (id: string, client?: QueryExecutor) => Promise<Role>;
  findOneByIdAndTenant: (id: string, tenant_id: string, client?: QueryExecutor) => Promise<Role>;
  findAll: (tenantId: string, client?: QueryExecutor) => Promise<Role[]>;
  replicateRoles: (tenantId: string, client?: QueryExecutor) => Promise<Role[]>;
}
