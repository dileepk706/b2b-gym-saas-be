import { Request, Response } from 'express';

export default interface ISubscriptionPlanController {
  getAllPlans(req: Request, res: Response): Promise<any>;
}
