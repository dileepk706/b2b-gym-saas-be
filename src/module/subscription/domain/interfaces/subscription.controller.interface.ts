import { Request, Response } from 'express';

export default interface ISubscriptionController {
  subscribeTenant(req: Request, res: Response): Promise<any>;
  getCurrentSubscription(req: Request, res: Response): Promise<any>;
}
