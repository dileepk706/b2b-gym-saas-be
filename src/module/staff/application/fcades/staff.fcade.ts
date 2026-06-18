import { inject, injectable } from 'tsyringe';
import IStaffService from '@/module/staff/domain/interfaces/staff.service.interface.js';
import IStaffFcade from '@/module/staff/domain/interfaces/staff.fcade.interface.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import httpStatus from 'http-status';
import { IRoleService } from '@/module/role/domain/interfaces/role.service.interface.js';
import IUserService from '@/module/user/domain/interfaces/user.services.interface.js';
import DbSharedService from '@/shared/services/db.shared.service.js';
import Staff from '@/module/staff/domain/entities/staff.entity.js';

@injectable()
class StaffFcade implements IStaffFcade {
  constructor(
    @inject('IStaffService') private readonly staffService: IStaffService,
    @inject('IRoleService') private readonly roleService: IRoleService,
    @inject('IUserService') private readonly userService: IUserService,
    @inject('DbSharedService') private readonly dbSharedService: DbSharedService,
  ) {}

  createStaffUser = async (staff: Partial<Staff> & { password?: string }): Promise<any> => {
    const { email, name, phone, role_id, check_in_code, gym_id, tenant_id, password } =
      staff as any;

    // Validate role belongs to this tenant
    const role = await this.roleService.findOneByIdAndTenant(role_id, tenant_id);
    if (!role) throw new ApiError('Role does not belong to this tenant', httpStatus.FORBIDDEN);

    const client = await this.dbSharedService.getClient();
    try {
      await client.query('BEGIN');

      // Find or create user — only one user with email per tenant
      let user = await this.userService.findOne({ email, tenant_id });
      if (user)
        throw new ApiError(
          'User email already registered under another tenant',
          httpStatus.CONFLICT,
        );

      user = await this.userService.create(
        {
          email,
          name,
          tenant_id,
          gym_id,
          user_type: 'staff',
          password: password || check_in_code?.toString() || 'changeme123',
        },
        client,
      );

      // Only one staff with user_id in one gym
      const existingStaff = await this.staffService.findOne({ user_id: user.id, gym_id });
      if (existingStaff) {
        throw new ApiError('This user is already a staff member in this gym', httpStatus.CONFLICT);
      }

      const newStaff = await this.staffService.create(
        {
          name: name || user.name,
          email: email || user.email,
          phone,
          role_id,
          check_in_code,
          gym_id,
          tenant_id,
          user_id: user.id,
        },
        client,
      );

      await client.query('COMMIT');
      return { staff: newStaff, user };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  updateStaffUser = async (
    staffId: string,
    gymId: string,
    tenantId: string,
    data: Partial<Staff> & { password?: string },
  ): Promise<any> => {
    const { role_id, email, name, password, phone, check_in_code } = data as any;

    if (role_id) {
      const role = await this.roleService.findOneByIdAndTenant(role_id, tenantId);
      if (!role) throw new ApiError('Role not found', httpStatus.NOT_FOUND);
    }

    const client = await this.dbSharedService.getClient();
    try {
      await client.query('BEGIN');

      // Build staff update payload (exclude password)
      const staffUpdateData: Partial<Staff> = {};
      if (name !== undefined) staffUpdateData.name = name;
      if (email !== undefined) staffUpdateData.email = email;
      if (phone !== undefined) staffUpdateData.phone = phone;
      if (role_id !== undefined) staffUpdateData.role_id = role_id;
      if (check_in_code !== undefined) staffUpdateData.check_in_code = check_in_code;

      const updatedStaff = await this.staffService.updateById(staffId, gymId, staffUpdateData);

      await client.query('COMMIT');
      return updatedStaff;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  /**
   * deleteStaffUser:
   * Deletes the staff record from the gym.
   * The user record is retained (user may belong to other gyms / be an owner).
   */
  deleteStaffUser = async (staffId: string, gymId: string): Promise<any> => {
    const deleted = await this.staffService.deleteById(staffId, gymId);
    return deleted;
  };
}

export default StaffFcade;
