import { Router } from 'express';
import { container } from '@/config/container.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import ITenantController from '@/module/tenant/domian/interfaces/tenant.controller.interface.js';

const tenantRouter = Router();

const getController = () => container.resolve<ITenantController>('ITenantController');

/**
 * @swagger
 * /api/tenant/:id:
 *   get:
 *     summary:
 *     tags:
 *     responses:
 *       200:
 *         description: Current subscription
 *       404:
 *         description: No active subscription
 */
tenantRouter.get('/:id', asyncHandler(getController().getOneById));

export const tenantRouterConfig: ModuleRouteConfig = {
  basePath: '/tenant',
  router: tenantRouter,
  group: 'tenant',
};

export default tenantRouter;
