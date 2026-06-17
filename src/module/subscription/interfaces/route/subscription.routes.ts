import { Router } from 'express';
import { container } from '@/config/container.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { processRequestBody, processRequestParams } from '@/shared/middleware/validation.js';
import ISubscriptionController from '@/module/subscription/domain/interfaces/subscription.controller.interface.js';
import {
  createCheckoutSessionSchema,
  changePlanSchema,
} from '@/module/subscription/application/dtos/create-subscription.dto.js';
import { z } from 'zod';

const subscriptionRouter = Router();

const getController = () => container.resolve<ISubscriptionController>('ISubscriptionController');

const uuidParamSchema = z.object({ sessionId: z.string().uuid() });
const invoiceParamSchema = z.object({ invoiceId: z.string().uuid() });

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Tenant subscription lifecycle management
 */

/**
 * @swagger
 * /api/subscriptions/checkout:
 *   post:
 *     summary: Create a checkout session
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_id]
 *             properties:
 *               plan_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Checkout session created
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Plan not found
 */
subscriptionRouter.post(
  '/checkout',
  processRequestBody(createCheckoutSessionSchema),
  asyncHandler(getController().createCheckoutSession),
);

/**
 * @swagger
 * /api/subscriptions/checkout/{sessionId}/complete:
 *   post:
 *     summary: Complete a checkout session (processes mock payment and activates subscription)
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Subscription activated
 *       404:
 *         description: Checkout session not found
 *       409:
 *         description: Session already completed
 *       410:
 *         description: Session expired
 */
subscriptionRouter.post(
  '/checkout/:sessionId/complete',
  processRequestParams(uuidParamSchema),
  asyncHandler(getController().completeCheckout),
);

/**
 * @swagger
 * /api/subscriptions/current:
 *   get:
 *     summary: Get the current active subscription with plan, features and limits
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Current subscription
 *       404:
 *         description: No active subscription
 */
subscriptionRouter.get('/current', asyncHandler(getController().getCurrentSubscription));

/**
 * @swagger
 * /api/subscriptions/history:
 *   get:
 *     summary: Get all subscriptions (history) for the tenant
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Subscription history
 */
subscriptionRouter.get('/history', asyncHandler(getController().getSubscriptionHistory));

/**
 * @swagger
 * /api/subscriptions/upgrade:
 *   post:
 *     summary: Immediately upgrade to a higher-tier plan
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_id]
 *             properties:
 *               plan_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Upgrade successful
 *       400:
 *         description: Plan is not higher than current
 *       404:
 *         description: No active subscription or plan not found
 */
subscriptionRouter.post(
  '/upgrade',
  processRequestBody(changePlanSchema),
  asyncHandler(getController().upgrade),
);

/**
 * @swagger
 * /api/subscriptions/downgrade:
 *   post:
 *     summary: Schedule a downgrade to a lower-tier plan (effective at next billing period)
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_id]
 *             properties:
 *               plan_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Downgrade scheduled
 *       400:
 *         description: Plan is not lower than current
 *       404:
 *         description: No active subscription or plan not found
 */
subscriptionRouter.post(
  '/downgrade',
  processRequestBody(changePlanSchema),
  asyncHandler(getController().downgrade),
);

/**
 * @swagger
 * /api/subscriptions/cancel:
 *   post:
 *     summary: Cancel the subscription (access remains until billing period ends)
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *       404:
 *         description: No active subscription
 *       409:
 *         description: Already cancelled
 */
subscriptionRouter.post('/cancel', asyncHandler(getController().cancel));

/**
 * @swagger
 * /api/subscriptions/reactivate:
 *   post:
 *     summary: Reactivate a cancelled subscription
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Subscription reactivated
 *       404:
 *         description: No cancelled subscription found
 *       410:
 *         description: Subscription has already expired
 */
subscriptionRouter.post('/reactivate', asyncHandler(getController().reactivate));

/**
 * @swagger
 * /api/subscriptions/invoices:
 *   get:
 *     summary: Get all invoices for the tenant
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: List of invoices
 */
subscriptionRouter.get('/invoices', asyncHandler(getController().getInvoices));

/**
 * @swagger
 * /api/subscriptions/invoices/{invoiceId}:
 *   get:
 *     summary: Get a specific invoice by ID
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Invoice detail
 *       404:
 *         description: Invoice not found
 */
subscriptionRouter.get(
  '/invoices/:invoiceId',
  processRequestParams(invoiceParamSchema),
  asyncHandler(getController().getInvoiceById),
);

export const subscriptionRouteConfig: ModuleRouteConfig = {
  basePath: '/subscriptions',
  router: subscriptionRouter,
  group: 'tenant',
};

export default subscriptionRouter;
