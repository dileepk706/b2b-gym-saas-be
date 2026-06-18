import Tenant, { TenantPartial } from '@/module/tenant/domian/entities/tenant.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

interface ITenantService {
  createTenant(tenant: TenantPartial, client?: QueryExecutor): Promise<Tenant>;
  getOneById(id: string, client?: QueryExecutor): Promise<Tenant>;
  updateTenantById(
    id: string,
    tenant: TenantPartial,
    client?: QueryExecutor,
  ): Promise<Tenant | null>;
}

export default ITenantService;
