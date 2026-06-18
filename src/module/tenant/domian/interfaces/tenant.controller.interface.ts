import { Request, Response } from 'express';

interface ITenantController {
  getOneById(req: Request, res: Response): any;
}

export default ITenantController;
