import { NextFunction, Request, Response } from 'express';

export default interface IUserController {
  createUser(req: Request, res: Response, next: NextFunction): Promise<any>;
  findOne(req: Request, res: Response, next: NextFunction): Promise<any>;
  updateSelf(req: Request, res: Response, next: NextFunction): Promise<any>;
  updateById(req: Request, res: Response, next: NextFunction): Promise<any>;
}
