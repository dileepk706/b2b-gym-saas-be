import IStaffController from '@/module/staff/domain/interfaces/staff.controller.interface.js';
import IStaffFcade from '@/module/staff/domain/interfaces/staff.fcade.interface.js';
import IStaffService from '@/module/staff/domain/interfaces/staff.service.interface.js';
import { ApiError } from '@/shared/middleware/error_handler.js';
import { sendSuccess } from '@/shared/response_handler.js';
import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';

@injectable()
class StaffController implements IStaffController {
  constructor(
    @inject('IStaffService') private readonly staffService: IStaffService,
    @inject('IStaffFcade') private readonly staffFcade: IStaffFcade,
  ) {}

  /**
   * POST /api/staff
   * Create a new staff member (creates user if not exists, then staff).
   */
  createStaffUser = async (req: Request, res: Response): Promise<any> => {
    const gymId = req.user.gym_id as string;
    const tenantId = req.user.tenant_id as string;

    const result = await this.staffFcade.createStaffUser({
      ...req.body,
      gym_id: gymId,
      tenant_id: tenantId,
    });
    return sendSuccess(res, result, 'Staff created successfully', 201);
  };

  /**
   * GET /api/staff
   * List all staff in the current gym. Supports search by name, email, role_id via query params.
   */
  getStaff = async (req: Request, res: Response): Promise<any> => {
    const gymId = req.user.gym_id as string;
    const tenantId = req.user.tenant_id as string;
    const { name, email, role_id } = req.query as Record<string, string | undefined>;

    const staffList = await this.staffService.findAll({
      gym_id: gymId,
      tenant_id: tenantId,
      name,
      email,
      role_id,
    });
    return sendSuccess(
      res,
      { staffs: staffList, total: staffList.length },
      'Staff fetched successfully',
      200,
    );
  };

  /**
   * GET /api/staff/:id
   * Get a single staff member by ID (scoped to current gym).
   */
  getStaffById = async (req: Request, res: Response): Promise<any> => {
    const gymId = req.user.gym_id as string;
    const id = req.params.id as string;

    const staff = await this.staffService.findById(id, gymId);
    if (!staff) throw new ApiError('Staff not found', httpStatus.NOT_FOUND);

    return sendSuccess(res, staff, 'Staff fetched successfully', 200);
  };

  /**
   * PUT /api/staff/:id
   * Update a staff member (scoped to current gym). Also syncs linked user record.
   */
  updateStaff = async (req: Request, res: Response): Promise<any> => {
    const gymId = req.user.gym_id as string;
    const tenantId = req.user.tenant_id as string;
    const id = req.params.id as string;

    const result = await this.staffFcade.updateStaffUser(id, gymId, tenantId, req.body);
    return sendSuccess(res, { staff: result }, 'Staff updated successfully', 200);
  };

  /**
   * DELETE /api/staff/:id
   * Delete a staff member (scoped to current gym). Retains user record.
   */
  deleteStaff = async (req: Request, res: Response): Promise<any> => {
    const gymId = req.user.gym_id as string;
    const id = req.params.id as string;

    const result = await this.staffFcade.deleteStaffUser(id, gymId);
    return sendSuccess(res, { staff: result }, 'Staff deleted successfully', 200);
  };
}

export default StaffController;
