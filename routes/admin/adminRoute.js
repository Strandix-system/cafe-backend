import express from 'express';

import { tokenVerification } from '../../middleware/auth.js';
import { allowRoles } from '../../middleware/permission.js';
import {
  blockOutletManager,
  requireAdminOnly,
} from '../../middleware/roles.js';
import {
  uploadAdminImages,
  uploadStaffImages,
} from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import controller from '../../src/admin/controller.js';
import { dashboardController } from '../../src/admin/Dashboard/controller.js';
import { outletController } from '../../src/admin/outlet/controller.js';
import { staffController } from '../../src/admin/staff/controller.js';
import visitController from '../../src/admin/visit/controller.js';
import { portfolioController } from '../../src/portfolio/controller.js';
import { parseJSONFields } from '../../utils/helper.js';
import {
  createAdminValidator,
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
import {
  createOutletManagerValidator,
  deleteOutletManagerValidator,
  listOutletsValidator,
  updateOutletManagerValidator,
} from '../../validations/outlet.validation.js';
import { updateFeedbackValidator } from '../../validations/portfolio.validation.js';
import {
  createStaffSchema,
  listStaffSchema,
  updateStaffSchema,
} from '../../validations/staff.validation.js';

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

router.patch(
  '/update/:id',
  tokenVerification,
  allowRoles('superadmin', 'admin', 'outlet_manager'),
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

// Outlet management (admin-only)
router.post(
  '/create-outlets',
  tokenVerification,
  blockOutletManager,
  requireAdminOnly,
  parseJSONFields(['outletAddress']),
  validate(createOutletManagerValidator),
  outletController.createOutletManager,
);

router.get(
  '/outlets',
  tokenVerification,
  blockOutletManager,
  requireAdminOnly,
  validate(listOutletsValidator),
  outletController.listOutlets,
);

router.patch(
  '/outlets/:outletId',
  tokenVerification,
  blockOutletManager,
  requireAdminOnly,
  parseJSONFields(['outletAddress']),
  validate(updateOutletManagerValidator),
  outletController.updateOutletManager,
);

router.delete(
  '/outlets/:outletId',
  tokenVerification,
  blockOutletManager,
  requireAdminOnly,
  validate(deleteOutletManagerValidator),
  outletController.deleteOutletManager,
);
router.get(
  '/dashboard/stats',
  tokenVerification,
  allowRoles('admin', 'outlet_manager', 'superadmin'),
  validate(dashboardStatsValidator),
  dashboardController.getStats,
);

router.get(
  '/dashboard/sales',
  tokenVerification,
  allowRoles('admin', 'outlet_manager', 'superadmin'),
  validate(dashboardSalesValidator),
  dashboardController.getSalesChart,
);

router.get(
  '/dashboard/items-performance',
  tokenVerification,
  allowRoles('admin', 'outlet_manager', 'superadmin'),
  validate(dashboardItemPerformanceValidator),
  dashboardController.getItemPerformance,
);

router.get(
  '/dashboard/peak-time',
  tokenVerification,
  allowRoles('admin', 'outlet_manager', 'superadmin'),
  validate(dashboardPeakTimeValidator),
  dashboardController.getPeakTime,
);

router.get(
  '/dashboard/tables',
  tokenVerification,
  allowRoles('admin', 'outlet_manager', 'superadmin'),
  validate(dashboardTablePerformanceValidator),
  dashboardController.getTablePerformance,
);
router.get(
  '/dashboard/top-customers',
  tokenVerification,
  allowRoles('admin', 'outlet_manager', 'superadmin'),
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
  allowRoles('admin', 'outlet_manager'),
  portfolioController.getCustomerFeedbacks,
);

router.delete(
  '/delete-feedback/:id',
  tokenVerification,
  allowRoles('admin', 'outlet_manager'),
  portfolioController.deleteCustomerFeedback,
);

router.patch(
  '/feedback-selection/:feedbackId',
  tokenVerification,
  allowRoles('admin', 'outlet_manager'),
  validate(updateFeedbackValidator),
  portfolioController.updateFeedback,
);

router.post(
  '/staff-create',
  tokenVerification,
  allowRoles('admin', 'outlet_manager'),
  uploadStaffImages.single('profileImage'),
  validate(createStaffSchema),
  staffController.createStaff,
);

router.get(
  '/staff-list',
  tokenVerification,
  allowRoles('admin', 'superadmin'),
  (req, _res, next) => {
    if (['admin', 'outlet_manager'].includes(req.user?.role)) {
      req.query.adminId =
        req.user.role === 'admin'
          ? req.user._id?.toString()
          : req.user.parentAdminId?.toString();
    }
    next();
  },
  validate(listStaffSchema),
  staffController.listStaff,
);

router.patch(
  '/staff-update/:id',
  tokenVerification,
  allowRoles('admin', 'outlet_manager'),
  uploadStaffImages.single('profileImage'),
  validate(updateStaffSchema),
  staffController.updateStaff,
);

export default router;
