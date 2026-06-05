import IOnboardingController from '@/module/onboarding/domain/onboarding.controller.interface.js';
import IOnboardingFcade from '@/module/onboarding/domain/onboarding.fcade.interface.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import { sendSuccess } from '@/shared/response_handler.js';
import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';

@injectable()
class OnboardingController implements IOnboardingController {
  constructor(@inject('IOnboardingFcade') private readonly onboardingFcade: IOnboardingFcade) {}

  createWorkspaceAndOnboardOwner = async (req: Request, res: Response): Promise<any> => {
    const tenant_id = req.user?.tenant_id;
    const gym_id = req.user?.gym_id;
    if (tenant_id || gym_id)
      throw new ApiError('You are already onboarded', httpStatus.BAD_REQUEST);

    const result = await this.onboardingFcade.createWorkspaceAndOnboardOwner(
      req.body,
      req.user?.user_id as string,
    );

    return sendSuccess(res, result, 'Onboarded successfully', 200);
  };

  checkGymUrl = async (req: Request, res: Response): Promise<any> => {
    const url = req.query.url as string;
    if (!url) throw new ApiError('Gym URL is required', 400);

    const isAvailable = await this.onboardingFcade.checkGymUrl(url);

    return sendSuccess(res, { available: isAvailable }, 'Gym URL check successful', 200);
  };
}

export default OnboardingController;
