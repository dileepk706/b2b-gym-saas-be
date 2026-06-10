type Tenant = {
  id: string;
  name: string;
  primary_gym_id: string;
  subscription_plan: string | null;
  created_at: Date;
  updated_at: Date;
};

export default Tenant;

export type TenantPartial = Partial<Tenant>;
