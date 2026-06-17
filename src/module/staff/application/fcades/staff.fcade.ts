import { inject, injectable } from 'tsyringe';
import IStaffService from '@/module/staff/domain/interfaces/staff.service.interface.js';
import { StaffDto } from '@/module/staff/application/dtos/create-staff-dto.js';
import IStaffFcade from '@/module/staff/domain/interfaces/staff.fcade.interface.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import httpStatus from 'http-status';
import IStaffPermissionService from '@/module/permissions/domain/interfaces/staff-permission.service.interface.js';
import { IRoleService } from '@/module/role/domain/interfaces/role.service.interface.js';
import IUserService from '@/module/user/domain/interfaces/user.services.interface.js';

@injectable()
class StaffFcade implements IStaffFcade {
  constructor(
    @inject('IStaffService') private readonly staffService: IStaffService,
    @inject('IStaffPermissionService')
    private readonly staffPermissionService: IStaffPermissionService,
    @inject('IRoleService') private readonly roleService: IRoleService,
    @inject('IUserService') private readonly userService: IUserService,
  ) {}

  create = async (staff: StaffDto & { permissions: string[] }): Promise<any> => {
    // remove user_id fk frim rrefresh token
    const role = await this.roleService.findOneById(staff.role_id);
    if (!role) throw new ApiError('Role not found', httpStatus.NOT_FOUND);

    const newStaff = await this.staffService.create(staff);

    const staffPermissions = await this.staffPermissionService.getAllStaffPermissions({
      staff_id: newStaff.id,
    });

    return { ...newStaff, permissions: staffPermissions };
  };

  createStaffUser = async (staff: StaffDto): Promise<any> => {
    let cu = await this.userService.findOne({ email: staff.email, tenant_id: staff.tenant_id });
    if (!cu) {
      cu = await this.userService.create({
        email: staff.email,
        name: staff.name,
        tenant_id: staff.tenant_id,
        gym_id: staff.gym_id,
        user_type: 'staff',
        password: staff.check_in_code?.toString() || 'defaultpassword',
      });
    }

    let cs = await this.staffService.findOne({
      user_id: cu.id,
      tenant_id: staff.tenant_id,
      gym_id: staff.gym_id,
    });

    if (cs)
      throw new ApiError(
        'Staff user with same email already exists in this gym',
        httpStatus.CONFLICT,
      );

    cs = await this.staffService.create({ ...staff, user_id: cu.id });
    return { staff: cs, user: cu };
  };
}

export default StaffFcade;
