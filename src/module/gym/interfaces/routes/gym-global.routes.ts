import { Router } from 'express';
import { container } from '@/config/container.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import IGymController from '@/module/gym/domain/interfaces/gym.controller.interface.js';

const gymGlobalRouter: Router = Router();

const getController = () => container.resolve<IGymController>('IGymController');

/**
 * @swagger
 * tags:
 *   name: Gym
 *   description: Gym management
 */

/**
 * @swagger
 * /api/gym/{id}:
 *   get:
 *     summary: Retrieve a gym by ID
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the gym
 *     responses:
 *       200:
 *         description: Gym details
 *       404:
 *         description: Gym not found
 *       401:
 *         description: Unauthorized
 */
gymGlobalRouter.get('/:id', (req, res) => getController().findById(req, res));

/**
 * @swagger
 * /api/gym:
 *   get:
 *     summary: Retrieve a list of gyms
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of gyms
 *       401:
 *         description: Unauthorized
 */
gymGlobalRouter.get('/', asyncHandler(getController().getGyms));

/**
 * @swagger
 * /api/gyms/tenant/{tenant_id}/user/{user_id}:
 *   get:
 *     summary: Retrieve a list of gyms
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of gyms
 *       401:
 *         description: Unauthorized
 */
gymGlobalRouter.get(
  '/tenant/:tenant_id/user/:user_id',
  asyncHandler(getController().findByTenantAndUserId),
);

export const gymGlobalRouteConfig: ModuleRouteConfig = {
  basePath: '/gyms/global',
  router: gymGlobalRouter,
  group: 'tenant',
};

export default gymGlobalRouter;
