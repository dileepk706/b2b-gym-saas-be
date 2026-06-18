import ITenantService from '@/module/tenant/domian/interfaces/tenant.service.interface.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import { sendSuccess } from '@/shared/response_handler.js';
import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

@injectable()
class TenantController {
  constructor(@inject('ITenantService') private readonly tenantService: ITenantService) {}

  getOneById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!id) throw new ApiError('tenant id is required');
    const result = await this.tenantService.getOneById(id);
    return sendSuccess(res, result, 'Tenant fetched', 200);
  };
}

export default TenantController;
