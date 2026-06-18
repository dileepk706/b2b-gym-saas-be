import Staff from '@/module/staff/domain/entities/staff.entity.js';
import IStaffRepository, {
  StaffSearchFilters,
} from '@/module/staff/domain/interfaces/staff.repository.interface.js';
import IStaffService, {
  StaffWithRole,
} from '@/module/staff/domain/interfaces/staff.service.interface.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import { inject, injectable } from 'tsyringe';
import { QueryExecutor } from '@/shared/types/database.js';
import httpStatus from 'http-status';

@injectable()
class StaffService implements IStaffService {
  constructor(@inject('IStaffRepository') private staffRepo: IStaffRepository) {}

  create = async (staff: Partial<Staff>, client?: QueryExecutor): Promise<Staff> => {
    // Enforce: only one staff with user_id in one gym
    const existingByUser = await this.staffRepo.findOne(
      { user_id: staff.user_id, gym_id: staff.gym_id },
      client,
    );
    if (existingByUser) {
      throw new ApiError('Staff already exists for this user in this gym', httpStatus.CONFLICT);
    }

    const result = await this.staffRepo.create(staff, client);
    return result;
  };

  findOne = async (filters: Partial<Staff>): Promise<Staff | null> => {
    return this.staffRepo.findOne(filters);
  };

  findById = async (id: string, gymId: string): Promise<StaffWithRole | null> => {
    const staff = await this.staffRepo.findById(id);
    if (!staff || staff.gym_id !== gymId) return null;
    return staff as StaffWithRole;
  };

  findAll = async (filters: StaffSearchFilters): Promise<StaffWithRole[]> => {
    return this.staffRepo.findAll(filters) as Promise<StaffWithRole[]>;
  };

  updateById = async (id: string, gymId: string, data: Partial<Staff>): Promise<StaffWithRole> => {
    const existing = await this.staffRepo.findById(id);
    if (!existing || existing.gym_id !== gymId) {
      throw new ApiError('Staff not found', httpStatus.NOT_FOUND);
    }

    const updated = await this.staffRepo.updateById(id, data);
    if (!updated) throw new ApiError('Staff update failed', httpStatus.INTERNAL_SERVER_ERROR);

    // Re-fetch with role join
    const result = await this.staffRepo.findById(id);
    return result as StaffWithRole;
  };

  deleteById = async (id: string, gymId: string): Promise<Staff> => {
    const existing = await this.staffRepo.findById(id);
    if (!existing || existing.gym_id !== gymId) {
      throw new ApiError('Staff not found', httpStatus.NOT_FOUND);
    }

    const deleted = await this.staffRepo.deleteById(id);
    if (!deleted) throw new ApiError('Staff deletion failed', httpStatus.INTERNAL_SERVER_ERROR);
    return deleted;
  };
}

export default StaffService;
