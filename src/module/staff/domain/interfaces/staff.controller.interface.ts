import { Request, Response } from 'express';

interface IStaffController {
  createStaffUser(req: Request, res: Response): Promise<any>;
  getStaff(req: Request, res: Response): Promise<any>;
  getStaffById(req: Request, res: Response): Promise<any>;
  updateStaff(req: Request, res: Response): Promise<any>;
  deleteStaff(req: Request, res: Response): Promise<any>;
}

export default IStaffController;
