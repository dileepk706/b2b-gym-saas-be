import { Router } from 'express';
//
import { container } from '@/config/container.js';
import IUserController from '@/module/user/domain/interfaces/user.controller.interface.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import { updateUserSchema } from '@/module/user/application/dtos/update-user.dto.js';

const userRouter = Router();

const getController = () => container.resolve<IUserController>('IUserController');

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get current user
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       404:
 *         description: User not found
 */
userRouter.get('/profile', asyncHandler(getController().findOne));

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists
 */
userRouter.put(
  '/profile',
  processRequestBody(updateUserSchema),
  asyncHandler(getController().updateSelf),
);

/**
 * @swagger
 * /api/user/{id}:
 *   put:
 *     summary: Update a user by ID (Admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists
 */
userRouter.put(
  '/:id',
  processRequestBody(updateUserSchema),
  asyncHandler(getController().updateById),
);

export const userRouteConfig: ModuleRouteConfig = {
  basePath: '/user',
  router: userRouter,
  group: 'admin',
};

export default userRouter;
