import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { checkSubscription } from '../middleware/checkSubscription.js';
import { allowRoles } from '../middleware/permission.js';
import { validate } from '../middleware/validate.js';
import controller from '../src/auth/controller.js';
import {
  registerValidator,
  loginValidator,
  logoutValidator,
} from '../validations/authValidation.js';
const router = express.Router();

router.post('/register', validate(registerValidator), controller.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginValidator), controller.login);
router.post(
  '/logout',
  tokenVerification,
  validate(logoutValidator),
  controller.logout,
);
/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Send forgot password email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Reset password email sent
 *       400:
 *         description: Bad request
 */

router.post('/forgot-password', controller.forgotPassword);
/**
 * @openapi
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password/:token', controller.resetPassword);
/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get logged in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/me',
  tokenVerification,
  allowRoles('admin', 'superadmin'),
  checkSubscription,
  controller.me,
);
/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/change-password',
  tokenVerification,
  allowRoles('admin', 'superadmin'),
  controller.changePassword,
);

export default router;
