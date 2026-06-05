import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import IGymController from '@/module/gym/domain/interfaces/gym.controller.interface.js';
import { IGymService } from '@/module/gym/domain/interfaces/gym.service.interface.js';
import { sendSuccess } from '@/shared/response_handler.js';
import { ApiError } from '@/shared/middleware/error_handler.js';

@injectable()
class GymController implements IGymController {
  constructor(@inject('IGymService') private readonly gymService: IGymService) {}

  async findById(req: Request, res: Response): Promise<any> {
    const gym = await this.gymService.findById(req.params.id as string);

    if (!gym) throw new ApiError('Gym not found', 404);

    return sendSuccess(res, gym, 'Gym fetched successfully', 200);
  }

  create = async (req: Request, res: Response): Promise<any> => {
    const gym = await this.gymService.create(req.body);
    return sendSuccess(res, gym, 'Gym created successfully', 201);
  };

  updateById = async (req: Request, res: Response): Promise<any> => {
    const gym = await this.gymService.updateById(req.params.id as string, req.body);
    return sendSuccess(res, gym, 'Gym updated successfully', 200);
  };

  getGyms = async (req: Request, res: Response): Promise<any> => {
    const gyms = await this.gymService.find(
      req.user.tenant_id as string,
      req.user.user_id as string,
    );
    return sendSuccess(res, { gyms }, 'Gyms fetched successfully', 200);
  };
}

export default GymController;
