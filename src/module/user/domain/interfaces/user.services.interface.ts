import { CreateUserDto } from '@/module/user/application/dtos/create-user.dto.js';
import User from '@/module/user/domain/entites/user.entity.js';
import { QueryExecutor } from '@/shared/types/database.js';

export default interface IUserService {
  create(
    user: CreateUserDto & {
      tenant_id?: string;
      gym_id?: string;
      user_type?: 'staff' | 'member' | 'owner';
    },
    client?: QueryExecutor,
  ): Promise<User>;
  findByEmail: (email: string, client?: QueryExecutor) => Promise<User | null>;
  validate: (user: { email: string; password: string }, client?: QueryExecutor) => Promise<User>;
  updateById: (
    id: string,
    user: Partial<CreateUserDto> & {
      tenant_id?: string;
      gym_id?: string;
      user_type?: 'staff' | 'member' | 'owner';
    },
    client?: QueryExecutor,
  ) => Promise<User>;
  findOne: (user: Partial<User>) => Promise<User | null>;
}
