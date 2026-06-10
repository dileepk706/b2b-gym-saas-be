import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import ISubscriptionController from '@/module/subscription/domain/interfaces/subscription.controller.interface.js';
import ISubscriptionService from '@/module/subscription/domain/interfaces/subscription.service.interface.js';
import { sendSuccess } from '@/shared/response_handler.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import httpStatus from 'http-status';

@injectable()
class SubscriptionController implements ISubscriptionController {
  constructor(
    @inject('ISubscriptionService')
    private readonly subscriptionService: ISubscriptionService,
  ) {}

  subscribeTenant = async (req: Request, res: Response): Promise<any> => {
    const result = await this.subscriptionService.subscribeTenant(
      req.user.tenant_id as string,
      req.body.plan_id,
    );

    const message = result.created
      ? 'Subscription created successfully'
      : 'Subscription updated successfully';

    return sendSuccess(res, result, message, result.created ? 201 : 200);
  };

  getCurrentSubscription = async (req: Request, res: Response): Promise<any> => {
    const result = await this.subscriptionService.getCurrentSubscription(
      req.user.tenant_id as string,
    );

    if (!result) {
      throw new ApiError('Current subscription not found', httpStatus.NOT_FOUND);
    }

    return sendSuccess(res, result, 'Current subscription fetched successfully', 200);
  };
}

export default SubscriptionController;
