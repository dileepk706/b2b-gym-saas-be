import ISubscriptionPlanController from '@/module/subscription/domain/interfaces/subscription-plan.controller.interface.js';
import ISubscriptionPlanService from '@/module/subscription/domain/interfaces/subscription-plan.service.interface.js';
import { sendSuccess } from '@/shared/response_handler.js';
import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

@injectable()
class SubscriptionPlanController implements ISubscriptionPlanController {
  constructor(
    @inject('ISubscriptionPlanService')
    private readonly subscriptionPlanService: ISubscriptionPlanService,
  ) {}

  getAllPlans = async (req: Request, res: Response) => {
    const plans = await this.subscriptionPlanService.getAllPlans();
    return sendSuccess(res, plans, 'Subscription plans fetched successfully', 200);
  };
}

export default SubscriptionPlanController;
