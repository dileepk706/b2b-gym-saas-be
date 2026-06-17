import { StaffDto } from '@/module/staff/application/dtos/create-staff-dto.js';
import IStaffController from '@/module/staff/domain/interfaces/staff.controller.interface.js';
import IStaffFcade from '@/module/staff/domain/interfaces/staff.fcade.interface.js';
import IStaffService from '@/module/staff/domain/interfaces/staff.service.interface.js';
import { sendSuccess } from '@/shared/response_handler.js';
import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { z } from 'zod';

@injectable()
class StaffController implements IStaffController {
  constructor(
    @inject('IStaffService') private readonly staffService: IStaffService,
    @inject('IStaffFcade') private readonly staffFcade: IStaffFcade,
  ) {}

  createStaffUser = async (req: Request, res: Response): Promise<any> => {
    const s: StaffDto = {
      ...req.body,
      gym_id: req.user.gym_id,
      tenant_id: req.user.tenant_id,
    };

    // z.email({ message: 'Invalid email address' }).parse(req.body.email);
    const result = await this.staffFcade.createStaffUser(s);
    return sendSuccess(res, result, 'Staff created successfully', 201);
  };
}

export default StaffController;
