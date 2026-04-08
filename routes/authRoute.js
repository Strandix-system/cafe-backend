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
router.post('/login', validate(loginValidator), controller.login);
router.post(
  '/logout',
  tokenVerification,
  validate(logoutValidator),
  controller.logout,
);

router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password/:token', controller.resetPassword);
router.get(
  '/me',
  tokenVerification,
  allowRoles('admin', 'superadmin', 'manager', 'staff'),
  checkSubscription,
  controller.me,
);
router.post(
  '/change-password',
  tokenVerification,
  allowRoles('admin', 'superadmin', 'manager'),
  controller.changePassword,
);

export default router;
