type Staff = {
  id: string;
  tenant_id: string;
  gym_id: string;
  user_id: string;
  role_id: string;
  name: string;
  email: string;
  phone: string;
  check_in_code: number;
  created_at: Date;
  updated_at: Date;
};

export default Staff;

export type StaffPartial = Partial<Staff>;
