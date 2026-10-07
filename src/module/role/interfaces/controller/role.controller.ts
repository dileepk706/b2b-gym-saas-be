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

  createRole = async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id as string;
    const { name } = req.body;
    const role = await this.roleService.createRole({ name }, tenantId);
    return sendSuccess(res, role, 'Role created successfully', 201);
  };

  updateRole = async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id as string;
    const id = req.params.id as string;
    const { name } = req.body;
    const role = await this.roleService.updateRole(id, { name }, tenantId);
    return sendSuccess(res, role, 'Role updated successfully', 200);
  };

  deleteRole = async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id as string;
    const id = req.params.id as string;
    await this.roleService.deleteRole(id, tenantId);
    return sendSuccess(res, null, 'Role deleted successfully', 200);
  };
}

export default RoleController;
