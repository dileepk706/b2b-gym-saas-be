import { inject, injectable } from 'tsyringe';
import ITenantService from '@/module/tenant/domian/interfaces/tenant.service.interface.js';
import { IGymService } from '@/module/gym/domain/interfaces/gym.service.interface.js';
import IOnboardingFcade from '@/module/onboarding/domain/onboarding.fcade.interface.js';
import IUserService from '@/module/user/domain/interfaces/user.services.interface.js';
import IStaffService from '@/module/staff/domain/interfaces/staff.service.interface.js';
import { IRoleService } from '@/module/role/domain/interfaces/role.service.interface.js';
import DbSharedService from '@/shared/services/db.shared.service.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import httpStatus from 'http-status';
import { CreateWorkspaceDto } from '@/module/onboarding/application/dtos/create-workspace.dto.js';
import { IRolePermissionService } from '@/module/role/domain/interfaces/role-permission.service.interface.js';

@injectable()
class OnboardingFcade implements IOnboardingFcade {
  constructor(
    @inject('ITenantService') private tenantService: ITenantService,
    @inject('IGymService') private gymService: IGymService,
    @inject('IUserService') private userService: IUserService,
    @inject('IStaffService') private staffService: IStaffService,
    @inject('IRoleService') private roleService: IRoleService,
    @inject('IRolePermissionService') private rolePermissionService: IRolePermissionService,
    @inject('DbSharedService') private dbSharedService: DbSharedService,
  ) {}

  createWorkspaceAndOnboardOwner = async (
    createWorkspaceDto: CreateWorkspaceDto,
    userId: string,
  ): Promise<any> => {
    const client = await this.dbSharedService.getClient();

    try {
      await client.query('BEGIN');

      const existingGym = await this.gymService.findOne({ gym_url: createWorkspaceDto.gym_url });
      if (existingGym) throw new ApiError('Gym url already taken', httpStatus.NOT_FOUND);

      const isAlreadyOnboarded = await this.userService.findOne({ id: userId });
      if (isAlreadyOnboarded?.tenant_id || isAlreadyOnboarded?.gym_id)
        throw new ApiError('User already onboarded', httpStatus.BAD_REQUEST);

      let tenant: any = await this.tenantService.createTenant(
        {
          name: createWorkspaceDto.name,
        },
        client,
      );

      const gym = await this.gymService.create(
        { ...createWorkspaceDto, tenant_id: tenant.id },
        client,
      );

      tenant = await this.tenantService.updateTenantById(
        tenant.id,
        { primary_gym_id: gym.id },
        client,
      );

      await this.roleService.replicateRoles(tenant.id, client);
      await this.rolePermissionService.replicateRolesPermission(tenant.id, client);

      const user = await this.userService.updateById(
        userId,
        {
          tenant_id: tenant.id,
          gym_id: gym.id,
          user_type: 'owner',
        },
        client,
      );

      const role = await this.roleService.findOneByName('owner', client);

      const staff = await this.staffService.create(
        {
          email: user?.email,
          gym_id: gym.id,
          name: user?.name,
          tenant_id: tenant.id,
          user_id: user?.id,
          role_id: role.id,
        },
        client,
      );

      await client.query('COMMIT');

      return { tenant, gym, user, staff };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  checkGymUrl = async (url: string): Promise<boolean> => {
    const existingGym = await this.gymService.findOne({ gym_url: url });
    return !existingGym;
  };
}

export default OnboardingFcade;
