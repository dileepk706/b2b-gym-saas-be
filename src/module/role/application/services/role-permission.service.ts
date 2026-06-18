import { RolePermission } from '@/module/role/domain/entities/role.entity.js';
import { inject, injectable } from 'tsyringe';
import { QueryExecutor } from '@/shared/types/database.js';
import { IRolePermissionService } from '@/module/role/domain/interfaces/role-permission.service.interface.js';
import { IRolePermissionRepository } from '@/module/role/domain/interfaces/role-permission.repository.interface.js';
import { IRoleRepository } from '@/module/role/domain/interfaces/role.repository.interface.js';

@injectable()
class RolePermissionService implements IRolePermissionService {
  constructor(
    @inject('IRolePermissionRepository')
    private readonly rolePermissionRepository: IRolePermissionRepository,
    @inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}

  findAll = async (tenantId: string, client?: QueryExecutor): Promise<RolePermission[]> => {
    return await this.rolePermissionRepository.findAll({ tenant_id: tenantId }, client);
  };

  replicateRolesPermission = async (
    tenantId: string,
    client?: QueryExecutor,
  ): Promise<RolePermission[]> => {
    const tenantRoles = await this.roleRepository.findAll({ tenant_id: tenantId }, client);
    const globalRoles = await this.roleRepository.findAll({ tenant_id: null } as any, client);

    const roleIdMap = new Map<string, string>();
    for (const gRole of globalRoles) {
      const tRole = tenantRoles.find((r) => r.name === gRole.name);
      if (tRole) {
        roleIdMap.set(gRole.id, tRole.id);
      }
    }

    const existingRolePermissions = await this.rolePermissionRepository.findAll(
      { tenant_id: null } as any,
      client,
    );

    for (const rp of existingRolePermissions) {
      const tenantRoleId = roleIdMap.get(rp.role_id);
      if (tenantRoleId) {
        await this.rolePermissionRepository.create(
          {
            permission_id: rp.permission_id,
            tenant_id: tenantId,
            role_id: tenantRoleId,
          },
          client,
        );
      }
    }

    return await this.rolePermissionRepository.findAll({ tenant_id: tenantId }, client);
  };
}

export default RolePermissionService;
