import Staff from '@/module/staff/domain/entities/staff.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';
import { StaffSearchFilters } from '@/module/staff/domain/interfaces/staff.repository.interface.js';

export interface StaffWithRole extends Staff {
  role_name?: string;
}

interface IStaffService {
  create(staff: Partial<Staff>, client?: QueryExecutor): Promise<Staff>;
  findOne(staff: Partial<Staff>): Promise<Staff | null>;
  findById(id: string, gymId: string): Promise<StaffWithRole | null>;
  findAll(filters: StaffSearchFilters): Promise<StaffWithRole[]>;
  updateById(id: string, gymId: string, data: Partial<Staff>): Promise<StaffWithRole>;
  deleteById(id: string, gymId: string): Promise<Staff>;
}

export default IStaffService;
