import Role from '@/module/role/domain/entities/role.entity.js';
import { IRoleService } from '@/module/role/domain/interfaces/role.service.interface.js';
import { IRoleRepository } from '@/module/role/domain/interfaces/role.repository.interface.js';
import { inject, injectable } from 'tsyringe';
import { QueryExecutor } from '@/shared/types/database.js';

@injectable()
class RoleService implements IRoleService {
  constructor(@inject('IRoleRepository') private readonly roleRepository: IRoleRepository) {}

  findOneByName = async (name: string, tenantId?: string, client?: QueryExecutor): Promise<Role> => {
    return this.roleRepository.findOne({ name, ...(tenantId ? { tenant_id: tenantId } : {}) }, client);
  };

  findOneById = async (id: string, client?: QueryExecutor): Promise<Role> => {
    return this.roleRepository.findOneById(id, client);
  };

  findAll = async (tenantId: string, client?: QueryExecutor): Promise<Role[]> => {
    return this.roleRepository.findAll({ tenant_id: tenantId }, client);
  };

  replicateRoles = async (tenantId: string, client?: QueryExecutor): Promise<Role[]> => {
    const existingRoles = await this.roleRepository.findAll({ tenant_id: null } as any, client);

    for (const role of existingRoles) {
      await this.roleRepository.create(
        {
          name: role.name,
          tenant_id: tenantId,
        },
        client,
      );
    }

    return await this.roleRepository.findAll({ tenant_id: tenantId }, client);
  };
}

export default RoleService;
