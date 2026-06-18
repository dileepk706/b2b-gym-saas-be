import { Request, Response } from 'express';

export default interface IGymController {
  findById(req: Request, res: Response): Promise<any>;
  create(req: Request, res: Response): Promise<any>;
  updateById(req: Request, res: Response): Promise<any>;
  getGyms(req: Request, res: Response): Promise<any>;
  findByTenantAndUserId(req: Request, res: Response): Promise<any>;
}
