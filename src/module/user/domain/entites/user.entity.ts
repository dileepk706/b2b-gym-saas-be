type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  tenant_id: string;
  gym_id: string;
  created_at: Date;
  updated_at: Date;
};

export default User;

export type UserPartial = Partial<User>;
