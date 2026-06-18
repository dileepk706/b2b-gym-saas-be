import { Router } from 'express';
import { container } from '@/config/container.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';
import IStaffController from '@/module/staff/domain/interfaces/staff.controller.interface.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import { createStaffSchema } from '@/module/staff/application/dtos/create-staff-dto.js';
import { updateStaffSchema } from '@/module/staff/application/dtos/update-staff.dto.js';

const staffRoutes = Router();

const getController = () => container.resolve<IStaffController>('IStaffController');

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff management
 */

/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Create a new staff member
 *     description: >
 *       Creates a user account (user_type=staff) if one does not exist with that email
 *       under this tenant. Then creates a staff record in the current gym.
 *       Constraints: only one user with email per tenant; only one staff with user_id per gym.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               check_in_code:
 *                 type: integer
 *                 example: 1234
 *               password:
 *                 type: string
 *                 description: If omitted, check_in_code is used as password
 *     responses:
 *       201:
 *         description: Staff member created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Role not found
 *       409:
 *         description: Staff already exists in this gym
 */
staffRoutes.post(
  '/',
  processRequestBody(createStaffSchema),
  asyncHandler(getController().createStaffUser),
);

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Get all staff in the current gym
 *     description: Returns all staff belonging to the authenticated user's gym. Supports search filters via query params.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search by name (case-insensitive partial match)
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Search by email (case-insensitive partial match)
 *       - in: query
 *         name: role_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by role ID
 *     responses:
 *       200:
 *         description: Staff list fetched successfully
 *       401:
 *         description: Unauthorized
 */
staffRoutes.get('/', asyncHandler(getController().getStaff));

/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     summary: Get a staff member by ID
 *     description: Returns a single staff member scoped to the current gym.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Staff fetched successfully
 *       404:
 *         description: Staff not found
 */
staffRoutes.get('/:id', asyncHandler(getController().getStaffById));

/**
 * @swagger
 * /api/staff/{id}:
 *   put:
 *     summary: Update a staff member
 *     description: >
 *       Updates a staff record scoped to the current gym.
 *       If name/email/password are changed, the linked user account is also updated.
 *       Role must belong to the current tenant.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Staff ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               role_id:
 *                 type: string
 *                 format: uuid
 *               check_in_code:
 *                 type: integer
 *               password:
 *                 type: string
 *                 description: Updates the linked user's password
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Role does not belong to this tenant
 *       404:
 *         description: Staff not found
 */
staffRoutes.put(
  '/:id',
  processRequestBody(updateStaffSchema),
  asyncHandler(getController().updateStaff),
);

/**
 * @swagger
 * /api/staff/{id}:
 *   delete:
 *     summary: Delete a staff member
 *     description: >
 *       Removes the staff record from the current gym.
 *       The linked user account is retained (user may belong to other gyms).
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 *       404:
 *         description: Staff not found
 */
staffRoutes.delete('/:id', asyncHandler(getController().deleteStaff));

export const staffRouteConfig: ModuleRouteConfig = {
  basePath: '/staff',
  router: staffRoutes,
  group: 'protected',
};
