import express from 'express';
import { signUpController } from '../src/signUp/controller.js';
import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import { validate } from '../middleware/validate.js';
import { checkEmailValidation } from '../validations/authValidation.js';
import {
  createSubscriptionValidation,
  verifySubscriptionValidation,
  getTransactionsValidation,
  renewSubscriptionValidation,
  verifyRenewSubscriptionValidation,
  signUpValidation,
} from '../validations/signUpValidation.js';
const router = express.Router();

router.post(
  '/create-subscription',
  tokenVerification,
  allowRoles('admin'),
  validate(createSubscriptionValidation),
  signUpController.createSubscription,
);
router.post(
  '/verify-subscription',
  tokenVerification,
  allowRoles('admin'),
  validate(verifySubscriptionValidation),
  signUpController.verifySubscription,
);
router.post(
  '/check-email',
  validate(checkEmailValidation),
  signUpController.checkEmail,
);
router.get('/plans', signUpController.getAllPlans);
router.get(
  '/transactions',
  tokenVerification,
  allowRoles('admin', 'superadmin'),
  validate(getTransactionsValidation),
  signUpController.getTransactions,
);
router.post(
  '/renew-subscription',
  tokenVerification,
  allowRoles('admin'),
  validate(renewSubscriptionValidation),
  signUpController.renewSubscription,
);
router.post(
  '/verify-renew-subscription',
  tokenVerification,
  allowRoles('admin'),
  validate(verifyRenewSubscriptionValidation),
  signUpController.verifyRenewSubscription,
);
router.post(
  '/create-user',
  validate(signUpValidation),
  signUpController.registerUser,
);
export const signUpRoutes = router;
