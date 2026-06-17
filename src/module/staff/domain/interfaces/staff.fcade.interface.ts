import { StaffDto } from '@/module/staff/application/dtos/create-staff-dto.js';

interface IStaffFcade {
  create(staff: StaffDto): Promise<any>;
  createStaffUser(staff: StaffDto): Promise<any>;
}

export default IStaffFcade;
