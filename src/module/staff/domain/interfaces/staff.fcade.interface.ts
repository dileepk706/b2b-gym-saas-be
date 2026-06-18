import Staff from '@/module/staff/domain/entities/staff.entity.js';

interface IStaffFcade {
  createStaffUser(staff: Partial<Staff> & { password?: string }): Promise<any>;
  updateStaffUser(
    staffId: string,
    gymId: string,
    tenantId: string,
    data: Partial<Staff> & { password?: string },
  ): Promise<any>;
  deleteStaffUser(staffId: string, gymId: string): Promise<any>;
}

export default IStaffFcade;
