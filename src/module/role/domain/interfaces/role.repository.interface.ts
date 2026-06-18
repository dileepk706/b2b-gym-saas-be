import Role from '../entities/role.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

export interface IRoleRepository {
  findOne: (role: Partial<Role>, client?: QueryExecutor) => Promise<Role>;
  findAll: (role: Partial<Role> | null, client?: QueryExecutor) => Promise<Role[]>;
  findOneById: (id: string, client?: QueryExecutor) => Promise<Role>;
  findOneByIdAndTenant: (id: string, tenant_id: string, client?: QueryExecutor) => Promise<Role>;
  create: (role: Pick<Role, 'name' | 'tenant_id'>, client?: QueryExecutor) => Promise<Role>;
}
