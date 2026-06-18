import Tenant, { TenantPartial } from '@/module/tenant/domian/entities/tenant.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

interface ITenantRepository {
  create(tenant: TenantPartial, client?: QueryExecutor): Promise<Tenant>;
  findOneById(id: string, client?: QueryExecutor): Promise<Tenant>;
  updateById: (id: string, data: Partial<Tenant>, client?: QueryExecutor) => Promise<any>;
}

export default ITenantRepository;
