import express from 'express';

import { tokenVerification } from '../../middleware/auth.js';
import { allowRoles } from '../../middleware/permission.js';
import { uploadAdminImages } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import controller from '../../src/admin/controller.js';
import { dashboardController } from '../../src/admin/Dashboard/controller.js';
import visitController from '../../src/admin/visit/controller.js';
import { portfolioController } from '../../src/portfolio/controller.js';
import { parseJSONFields } from '../../utils/helper.js';
import {
  createAdminValidator,
  createOutletManagerValidator,
  updateAdminValidator,
  deleteAdminValidator,
  updateSuperAdmin,
} from '../../validations/createValidation.js';
import {
  dashboardAdminAnalyticsValidator,
  dashboardItemPerformanceValidator,
  dashboardPeakTimeValidator,
  dashboardPlatformSalesValidator,
  dashboardSalesValidator,
  dashboardStatsValidator,
  dashboardTablePerformanceValidator,
  dashboardTopCafesValidator,
  dashboardTopCustomersValidator,
} from '../../validations/dashboard.validation.js';
import { updateFeedbackValidator } from '../../validations/portfolio.validation.js';

const router = express.Router();

router.post(
  '/create',
  tokenVerification,
  allowRoles('superadmin'),
  uploadAdminImages.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 },
  ]),
  parseJSONFields(['socialLinks', 'hours', 'address', 'gst']),
  validate(createAdminValidator),
  controller.createAdmin,
);

router.post(
  '/create-outlet-manager',
  tokenVerification,
  allowRoles('admin'),
  uploadAdminImages.none(),
  parseJSONFields(['address', 'hours']),
  validate(createOutletManagerValidator),
  controller.createOutletManager,
);

router.get(
  '/get-outlets',
  tokenVerification,
  allowRoles('admin'),
  controller.getOutlets,
);
router.get(
  '/get-outlet/:id',
  tokenVerification,
  allowRoles('admin'),
  controller.getOutletById,
);
router.patch(
  '/update-outlet/:id',
  tokenVerification,
  allowRoles('admin'),
  parseJSONFields(['address', 'hours']),
  controller.updateOutlet,
);

router.patch(
  '/update/:id',
  tokenVerification,
  allowRoles('superadmin', 'admin', 'manager'),
  uploadAdminImages.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 },
  ]),
  parseJSONFields(['socialLinks', 'hours', 'address', 'gst']),
  validate(updateAdminValidator),
  controller.updateAdmin,
);

router.delete(
  '/delete/:id',
  tokenVerification,
  allowRoles('superadmin'),
  validate(deleteAdminValidator),
  controller.deleteAdmin,
);

router.get(
  '/get-users',
  tokenVerification,
  allowRoles('superadmin'),
  controller.listAdmins,
);

router.get(
  '/get-user/:id',
  tokenVerification,
  allowRoles('superadmin'),
  controller.getByAdmin,
);
//only for super admin
router.patch(
  '/superadmin/:id',
  tokenVerification,
  allowRoles('superadmin'),
  uploadAdminImages.fields([{ name: 'profileImage', maxCount: 1 }]),
  validate(updateSuperAdmin),
  controller.updateSuperAdmin,
);

router.patch(
  '/update-status/:id',
  tokenVerification,
  allowRoles('superadmin'),
  controller.updateAdminStatus,
);
router.get(
  '/dashboard/stats',
  tokenVerification,
  allowRoles('admin', 'manager', 'superadmin'),
  validate(dashboardStatsValidator),
  dashboardController.getStats,
);

router.get(
  '/dashboard/sales',
  tokenVerification,
  allowRoles('admin', 'manager', 'superadmin'),
  validate(dashboardSalesValidator),
  dashboardController.getSalesChart,
);

router.get(
  '/dashboard/items-performance',
  tokenVerification,
  allowRoles('admin', 'manager', 'superadmin'),
  validate(dashboardItemPerformanceValidator),
  dashboardController.getItemPerformance,
);

router.get(
  '/dashboard/peak-time',
  tokenVerification,
  allowRoles('admin', 'manager', 'superadmin'),
  validate(dashboardPeakTimeValidator),
  dashboardController.getPeakTime,
);

router.get(
  '/dashboard/tables',
  tokenVerification,
  allowRoles('admin', 'manager', 'superadmin'),
  validate(dashboardTablePerformanceValidator),
  dashboardController.getTablePerformance,
);
router.get(
  '/dashboard/top-customers',
  tokenVerification,
  allowRoles('admin', 'manager', 'superadmin'),
  validate(dashboardTopCustomersValidator),
  dashboardController.getTopCustomers,
);
router.get(
  '/dashboard/top-cafes',
  tokenVerification,
  allowRoles('superadmin'),
  validate(dashboardTopCafesValidator),
  dashboardController.getTopCafes,
);

router.get(
  '/dashboard/platform-sales',
  tokenVerification,
  allowRoles('superadmin'),
  validate(dashboardPlatformSalesValidator),
  dashboardController.getPlatformSales,
);
router.get(
  '/dashboard/admin-analytics',
  tokenVerification,
  allowRoles('superadmin'),
  validate(dashboardAdminAnalyticsValidator),
  dashboardController.getAdminAnalytics,
);
router.post('/track', visitController.trackVisit);
router.get(
  '/total',
  tokenVerification,
  allowRoles('superadmin'),
  visitController.getTotalVisits,
);

router.get(
  '/get-feedback',
  tokenVerification,
  allowRoles('admin', 'manager'),
  portfolioController.getCustomerFeedbacks,
);

router.delete(
  '/delete-feedback/:id',
  tokenVerification,
  allowRoles('admin', 'manager'),
  portfolioController.deleteCustomerFeedback,
);

router.patch(
  '/feedback-selection/:feedbackId',
  tokenVerification,
  allowRoles('admin', 'manager'),
  validate(updateFeedbackValidator),
  portfolioController.updateFeedback,
);

export default router;
