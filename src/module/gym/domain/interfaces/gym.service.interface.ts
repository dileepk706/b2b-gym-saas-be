import Gym, { GymPartial } from '@/module/gym/domain/entities/gym.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

export interface IGymService {
  findById(id: string, client?: QueryExecutor): Promise<Gym | null>;
  create(gym: GymPartial, client?: QueryExecutor): Promise<Gym>;
  updateById(id: string, gym: GymPartial, client?: QueryExecutor): Promise<Gym | null>;
  findOne(data: GymPartial, client?: QueryExecutor): Promise<Gym | null>;
  find(tenant_id: string, user_id: string): Promise<Gym[]>;
  findByTenantAndUserId(tenant_id: string, user_id: string): Promise<Gym[]>;
}
