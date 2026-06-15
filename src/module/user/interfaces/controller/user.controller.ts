import IUserController from '@/module/user/domain/interfaces/user.controller.interface.js';
import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import IUserService from '@/module/user/domain/interfaces/user.services.interface.js';
import { sendSuccess } from '@/shared/response_handler.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import httpStatus from 'http-status';

@injectable()
class UserController implements IUserController {
  constructor(@inject('IUserService') private readonly userService: IUserService) {}

  createUser = async (req: Request, res: Response) => {
    const result = await this.userService.create(req.body);
    return sendSuccess(res, { user: result }, 'User created successfully', 201);
  };

  findOne = async (req: Request, res: Response) => {
    const result = await this.userService.findOne({
      id: req.user?.user_id as string,
    });
    if (!result) throw new ApiError('User not found', httpStatus.NOT_FOUND);
    return sendSuccess(res, { user: result }, 'User fetched successfully', 200);
  };
}

export default UserController;
