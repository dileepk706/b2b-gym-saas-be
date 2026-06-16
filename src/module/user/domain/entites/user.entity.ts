type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  tenant_id: string;
  gym_id: string;
  user_type: 'staff' | 'member' | 'owner';
  created_at: Date;
  updated_at: Date;
};

export default User;

export type UserPartial = Partial<User>;
