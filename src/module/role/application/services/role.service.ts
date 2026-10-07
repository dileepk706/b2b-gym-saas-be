import Role from '@/module/role/domain/entities/role.entity.js';
import { IRoleService } from '@/module/role/domain/interfaces/role.service.interface.js';
import { IRoleRepository } from '@/module/role/domain/interfaces/role.repository.interface.js';
import IStaffRepository from '@/module/staff/domain/interfaces/staff.repository.interface.js';
import { inject, injectable } from 'tsyringe';
import { QueryExecutor } from '@/shared/types/database.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import httpStatus from 'http-status';

@injectable()
class RoleService implements IRoleService {
  constructor(
    @inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
    @inject('IStaffRepository') private readonly staffRepository: IStaffRepository
  ) {}

  findOneByName = async (
    name: string,
    tenantId?: string,
    client?: QueryExecutor,
  ): Promise<Role> => {
    return this.roleRepository.findOne(
      { name, ...(tenantId ? { tenant_id: tenantId } : {}) },
      client,
    );
  };

  findOneById = async (id: string, client?: QueryExecutor): Promise<Role> => {
    return this.roleRepository.findOneById(id, client);
  };

  findOneByIdAndTenant = async (
    id: string,
    tenant_id: string,
    client?: QueryExecutor,
  ): Promise<Role> => {
    return this.roleRepository.findOneByIdAndTenant(id, tenant_id, client);
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

  createRole = async (data: Pick<Role, 'name'>, tenantId: string, client?: QueryExecutor): Promise<Role> => {
    return this.roleRepository.create({
      name: data.name,
      tenant_id: tenantId,
    }, client);
  };

  updateRole = async (id: string, data: Pick<Role, 'name'>, tenantId: string, client?: QueryExecutor): Promise<Role> => {
    const role = await this.roleRepository.findOneByIdAndTenant(id, tenantId, client);
    if (!role) {
      throw new ApiError('Role not found', httpStatus.NOT_FOUND);
    }
    return this.roleRepository.update(id, tenantId, { name: data.name }, client);
  };

  deleteRole = async (id: string, tenantId: string, client?: QueryExecutor): Promise<void> => {
    const role = await this.roleRepository.findOneByIdAndTenant(id, tenantId, client);
    if (!role) {
      throw new ApiError('Role not found', httpStatus.NOT_FOUND);
    }

    const assignedStaff = await this.staffRepository.findOne({ role_id: id }, client);
    if (assignedStaff) {
      throw new ApiError('Cannot delete role as it is assigned to one or more staff members', httpStatus.BAD_REQUEST);
    }

    await this.roleRepository.delete(id, tenantId, client);
  };
}

export default RoleService;
