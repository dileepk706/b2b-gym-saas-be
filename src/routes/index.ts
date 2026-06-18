import { Router } from 'express';
import { logger } from '@/shared/logger.js';
import { authenticate } from '@/shared/middleware/auth.middleware.js';
import type { ModuleRouteConfig, RouteGroupMiddleware } from '@/routes/route.types.js';

import { gymRouteConfig } from '@/module/gym/interfaces/routes/gym.routes.js';
import { userRouteConfig } from '@/module/user/interfaces/route/user.routes.js';
import { tokenRouteConfig } from '@/module/token/interfaces/token.routes.js';
import { onboardingRouteConfig } from '@/module/onboarding/interfaces/onboarding.routes.js';
import tenantMiddleware, { gymMiddleware } from '@/shared/middleware/tenant.middleware.js';
import { staffRouteConfig } from '@/module/staff/interfaces/staff.routes.js';
import { permissionRouteConfig } from '@/module/permissions/interfaces/route/permission.routes.js';
import { roleRouteConfig } from '@/module/role/interfaces/route/role.routes.js';
import { userAuthRouteConfig } from '@/module/user/interfaces/route/user.auth.routes.js';
import { authorizeAdmin } from '@/shared/middleware/admin.middleware.js';
import { gymGlobalRouteConfig } from '@/module/gym/interfaces/routes/gym-global.routes.js';
import { subscriptionPlanRouteConfig } from '@/module/subscription/interfaces/route/subscription-plan.routes.js';
import { subscriptionRouteConfig } from '@/module/subscription/interfaces/route/subscription.routes.js';
import { tenantRouterConfig } from '@/module/tenant/interface/tenant.routes.js';

const moduleRoutes: ModuleRouteConfig[] = [
  subscriptionPlanRouteConfig,
  subscriptionRouteConfig,
  gymGlobalRouteConfig,
  gymRouteConfig,
  userRouteConfig,
  tokenRouteConfig,
  onboardingRouteConfig,
  staffRouteConfig,
  permissionRouteConfig,
  roleRouteConfig,
  userAuthRouteConfig,
  tenantRouterConfig,
];

const groupMiddleware: RouteGroupMiddleware = {
  public: [],
  protected: [authenticate, tenantMiddleware, gymMiddleware],
  admin: [authenticate, authorizeAdmin],
  tenant: [authenticate, tenantMiddleware],
  auth: [authenticate],
};

const API_PREFIX = '/api';

export function registerRoutes(): Router {
  const rootRouter = Router();

  for (const { basePath, router, group } of moduleRoutes) {
    const fullPath = `${API_PREFIX}${basePath}`;
    const middleware = groupMiddleware[group];

    rootRouter.use(fullPath, ...middleware, router);

    logger.info(`Registered routes: ${fullPath}  [${group}]`);
  }

  return rootRouter;
}
