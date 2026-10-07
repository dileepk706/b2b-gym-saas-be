import { Request, Response } from 'express';

export default interface IRoleController {
  getAllStaffRoles: (req: Request, res: Response) => Promise<any>;
  createRole: (req: Request, res: Response) => Promise<any>;
  updateRole: (req: Request, res: Response) => Promise<any>;
  deleteRole: (req: Request, res: Response) => Promise<any>;
}
