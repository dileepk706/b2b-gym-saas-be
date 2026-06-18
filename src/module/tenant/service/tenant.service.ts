import { inject, injectable } from 'tsyringe';
import ITenantService from '@/module/tenant/domian/interfaces/tenant.service.interface.js';
import ITenantRepository from '@/module/tenant/domian/interfaces/tenant.repository.interface.js';
import Tenant, { TenantPartial } from '@/module/tenant/domian/entities/tenant.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

@injectable()
class TenantService implements ITenantService {
  constructor(@inject('ITenantRepository') private tenantRepo: ITenantRepository) {}

  createTenant = async (tenant: TenantPartial, client?: QueryExecutor): Promise<Tenant> => {
    return await this.tenantRepo.create(tenant, client);
  };

  updateTenantById = async (
    id: string,
    tenant: TenantPartial,
    client?: QueryExecutor,
  ): Promise<Tenant | null> => {
    return await this.tenantRepo.updateById(id, tenant, client);
  };

  getOneById = async (id: string, client?: QueryExecutor) => {
    return await this.tenantRepo.findOneById(id, client);
  };
}

export default TenantService;
