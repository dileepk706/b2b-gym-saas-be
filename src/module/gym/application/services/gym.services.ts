import { inject, injectable } from 'tsyringe';

import { IGymService } from '@/module/gym/domain/interfaces/gym.service.interface.js';
import IGymRepositoryImpl from '@/module/gym/domain/interfaces/gym.repository.interface.js';
import Gym, { GymPartial } from '@/module/gym/domain/entities/gym.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

@injectable()
class GymService implements IGymService {
  constructor(
    @inject('IGymRepositoryImpl') private readonly gymRepositoryImpl: IGymRepositoryImpl,
  ) {}

  async findById(id: string, client?: QueryExecutor): Promise<Gym | null> {
    return await this.gymRepositoryImpl.findById(id, client);
  }

  async create(gym: GymPartial, client?: QueryExecutor): Promise<Gym> {
    return await this.gymRepositoryImpl.create(gym, client);
  }

  async updateById(id: string, gym: GymPartial, client?: QueryExecutor): Promise<Gym | null> {
    const updatedGym = await this.gymRepositoryImpl.updateById(id, gym, client);
    return updatedGym;
  }

  async findOne(data: GymPartial, client?: QueryExecutor): Promise<Gym | null> {
    return await this.gymRepositoryImpl.findOne(data, client);
  }

  async find(tenant_id: string, user_id: string): Promise<Gym[]> {
    return await this.gymRepositoryImpl.find(tenant_id, user_id);
  }

  async findByTenantAndUserId(tenant_id: string, user_id: string): Promise<Gym[]> {
    return await this.gymRepositoryImpl.findByTenantAndUserId(tenant_id, user_id);
  }
}

export default GymService;
