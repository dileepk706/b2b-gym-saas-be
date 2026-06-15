import { Router } from 'express';
import { container } from '@/config/container.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import ISubscriptionPlanController from '@/module/subscription/domain/interfaces/subscription-plan.controller.interface.js';

const subscriptionPlanRouter = Router();

const getController = () =>
  container.resolve<ISubscriptionPlanController>('ISubscriptionPlanController');

/**
 * @swagger
 * tags:
 *   name: Subscription Plans
 *   description: Subscription plan catalogue
 */

/**
 * @swagger
 * /api/subscription-plans:
 *   get:
 *     summary: Get all subscription plans with features and limits
 *     tags: [Subscription Plans]
 *     responses:
 *       200:
 *         description: Subscription plans fetched successfully
 */
subscriptionPlanRouter.get('/', asyncHandler(getController().getAllPlans));

export const subscriptionPlanRouteConfig: ModuleRouteConfig = {
  basePath: '/subscription-plans',
  router: subscriptionPlanRouter,
  group: 'public',
};

export default subscriptionPlanRouter;
