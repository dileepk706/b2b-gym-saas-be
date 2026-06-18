import { CreateUserDto } from '@/module/user/application/dtos/create-user.dto.js';
import User, { UserPartial } from '@/module/user/domain/entites/user.entity.js';
import IUserRepository from '@/module/user/domain/interfaces/user.repository.inteface.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import { comparePassword, hashPassword } from '@/utils/hash.util.js';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import IUserService from '@/module/user/domain/interfaces/user.services.interface.js';
import { LoginUserDto } from '@/module/user/application/dtos/login-user.dto.js';
import { QueryExecutor } from '@/shared/types/database.js';

@injectable()
class UserService implements IUserService {
  constructor(@inject('IUserRepository') private readonly userRepository: IUserRepository) {}

  create = async (user: CreateUserDto, client?: QueryExecutor): Promise<User> => {
    const existingUser = await this.userRepository.findOne({ email: user.email });
    if (existingUser)
      throw new ApiError('User with same email already exists', httpStatus.CONFLICT);
    const hashedPassword = await hashPassword(user.password);
    return this.userRepository.create({ ...user, password: hashedPassword }, client);
  };

  findByEmail = async (email: string, client?: QueryExecutor): Promise<User | null> => {
    return this.userRepository.findByEmail(email, client);
  };

  validate = async (user: LoginUserDto, client?: QueryExecutor): Promise<User> => {
    const registerdUser = await this.findByEmail(user.email, client);
    if (!registerdUser) throw new ApiError('Invalid credentials', httpStatus.NOT_FOUND);
    const isPasswordValid = await comparePassword(user.password, registerdUser.password as string);
    if (!isPasswordValid) throw new ApiError('Invalid credentials', httpStatus.NOT_FOUND);
    delete registerdUser.password;
    return registerdUser;
  };

  updateById = async (id: string, user: UserPartial, client?: QueryExecutor): Promise<User> => {
    if (Object.keys(user).length === 0) {
      const existingUser = await this.userRepository.findOne({ id });
      if (!existingUser) throw new ApiError('User not found', httpStatus.NOT_FOUND);
      return existingUser;
    }

    if (user.email) {
      const existingUser = await this.userRepository.findOne({ email: user.email });
      if (existingUser && existingUser.id !== id) {
        throw new ApiError('User with same email already exists', httpStatus.CONFLICT);
      }
    }

    const updates = { ...user };
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    const res = await this.userRepository.updateById(id, updates, client);
    if (!res) throw new ApiError('User not found', httpStatus.NOT_FOUND);
    return res;
  };

  findOne = async (user: Partial<User>): Promise<User | null> => {
    if (Object.keys(user).length === 0) return null;
    return this.userRepository.findOne(user);
  };
}

export default UserService;
