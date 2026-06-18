import Staff from '@/module/staff/domain/entities/staff.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

export interface StaffSearchFilters {
  gym_id?: string;
  tenant_id?: string;
  name?: string;
  email?: string;
  role_id?: string;
}

interface IStaffRepository {
  create(staff: Partial<Staff>, client?: QueryExecutor): Promise<Staff>;
  findOne(staff: Partial<Staff>, client?: QueryExecutor): Promise<Staff | null>;
  findById(id: string, client?: QueryExecutor): Promise<Staff | null>;
  findAll(filters: StaffSearchFilters, client?: QueryExecutor): Promise<Staff[]>;
  updateById(id: string, data: Partial<Staff>, client?: QueryExecutor): Promise<Staff | null>;
  deleteById(id: string, client?: QueryExecutor): Promise<Staff | null>;
}

export default IStaffRepository;
