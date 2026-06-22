import type { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { ApiError } from '@/shared/middleware/error_handler.js';

const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) throw new ApiError('Tenant ID is required.', httpStatus.NOT_FOUND);
  next();
};

export default tenantMiddleware;

export const gymMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const gymId = req.user?.gym_id || req.headers.gym_id || req.query.gym_id;
  if (!gymId) throw new ApiError('Gym ID is required.', httpStatus.NOT_FOUND);
  next();
};

// staff logined to the gym they staff
// staff try to access other gym data by swtih gym barch tab
// we need to check that staff is authorized to access the gym data
//

// staff user have app role as staff
// gym 1 staff has user id
// has staff with user_id and gym_id
// if exist then allow
// if not exist then throw error
