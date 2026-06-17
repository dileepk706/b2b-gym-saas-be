import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { IRoleService } from '@/module/role/domain/interfaces/role.service.interface.js';
import IRoleController from '@/module/role/domain/interfaces/role.controller.interface.js';
import { sendSuccess } from '@/shared/response_handler.js';

@injectable()
class RoleController implements IRoleController {
  constructor(@inject('IRoleService') private readonly roleService: IRoleService) {}

  getAllStaffRoles = async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id as string;
    const roles = await this.roleService.findAll(tenantId);
    return sendSuccess(res, roles, 'Staff roles fetched successfully', 200);
  };
}

export default RoleController;
