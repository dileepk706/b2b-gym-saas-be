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
    const result = await this.userService.create({ ...req.body, user_type: 'owner' });
    return sendSuccess(res, { user: result }, 'User created successfully', 201);
  };

  findOne = async (req: Request, res: Response) => {
    const result = await this.userService.findOne({
      id: req.user?.user_id as string,
    });
    if (!result) throw new ApiError('User not found', httpStatus.NOT_FOUND);
    return sendSuccess(res, { user: result }, 'User fetched successfully', 200);
  };

  updateSelf = async (req: Request, res: Response) => {
    let cu = await this.userService.findOne({ id: req.user?.user_id as string });
    if (!cu) throw new ApiError('User not found', httpStatus.NOT_FOUND);
    cu = await this.userService.validate({
      email: cu.email,
      password: req.body.currentPassword as string,
    });
    delete req.body.currentPassword;
    const result = await this.userService.updateById(req.user?.user_id as string, req.body);
    return sendSuccess(res, result, 'User updated successfully', 200);
  };

  updateById = async (req: Request, res: Response) => {
    const result = await this.userService.updateById(req.params.id as string, req.body);
    return sendSuccess(res, result, 'User updated successfully', 200);
  };
}

export default UserController;
