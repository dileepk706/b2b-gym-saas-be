export type GymStatus = 'trial' | 'active' | 'suspended';

type Gym = {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  maximum_capacity?: number | null;
  gym_url: string;
  created_at: Date;
  updated_at: Date;
  deleted: boolean;
};

export default Gym;
export type GymPartial = Partial<Gym>;
