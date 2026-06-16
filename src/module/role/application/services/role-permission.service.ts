import { RolePermission } from '@/module/role/domain/entities/role.entity.js';
import { inject, injectable } from 'tsyringe';
import { QueryExecutor } from '@/shared/types/database.js';
import { IRolePermissionService } from '@/module/role/domain/interfaces/role-permission.service.interface.js';
import { IRolePermissionRepository } from '@/module/role/domain/interfaces/role-permission.repository.interface.js';

@injectable()
class RolePermissionService implements IRolePermissionService {
  constructor(
    @inject('IRolePermissionRepository')
    private readonly rolePermissionRepository: IRolePermissionRepository,
  ) {}

  findAll = async (tenantId: string, client?: QueryExecutor): Promise<RolePermission[]> => {
    return await this.rolePermissionRepository.findAll({ tenant_id: tenantId }, client);
  };

  replicateRolesPermission = async (
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<RolePermission[]> => {
    const existingRolePermissions = await this.rolePermissionRepository.findAll(null, client);

    for (const rp of existingRolePermissions) {
      await this.rolePermissionRepository.create(
        {
          permission_id: rp.permission_id,
          tenant_id: tenantId,
          role_id: rp.role_id,
        },
        client,
      );
    }

    return await this.rolePermissionRepository.findAll({ tenant_id: tenantId }, client);
  };
}

export default RolePermissionService;
