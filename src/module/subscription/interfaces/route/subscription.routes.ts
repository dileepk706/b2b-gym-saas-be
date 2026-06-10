import { Router } from 'express';
import { container } from '@/config/container.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import ISubscriptionController from '@/module/subscription/domain/interfaces/subscription.controller.interface.js';
import { createSubscriptionSchema } from '@/module/subscription/application/dtos/create-subscription.dto.js';

const subscriptionRouter = Router();

const getController = () => container.resolve<ISubscriptionController>('ISubscriptionController');

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Tenant subscription management
 */

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: Create or update the current tenant subscription
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan_id
 *             properties:
 *               plan_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *       201:
 *         description: Subscription created successfully
 */
subscriptionRouter.post(
  '/',
  processRequestBody(createSubscriptionSchema),
  asyncHandler(getController().subscribeTenant),
);

/**
 * @swagger
 * /api/subscriptions/current:
 *   get:
 *     summary: Get the current tenant subscription
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Current subscription fetched successfully
 *       404:
 *         description: Current subscription not found
 */
subscriptionRouter.get('/current', asyncHandler(getController().getCurrentSubscription));

export const subscriptionRouteConfig: ModuleRouteConfig = {
  basePath: '/subscriptions',
  router: subscriptionRouter,
  group: 'tenant',
};

export default subscriptionRouter;
