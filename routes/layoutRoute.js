import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import { uploadLayoutImages } from '../middleware/upload.js';
import cafeLayoutController from '../src/admin/layout/controller.js';

const router = express.Router();
router.post(
  '/create',
  tokenVerification,
  allowRoles('superadmin', 'admin', 'manager'),
  uploadLayoutImages,
  cafeLayoutController.createCafeLayout,
);

// used by portfolio website
router.get(
  '/get-layout/:id',
  // tokenVerification,
  // allowRoles("superadmin", "admin"),
  cafeLayoutController.getLayoutById,
);

router.patch(
  '/update-status',
  tokenVerification,
  allowRoles('admin', 'manager', 'superadmin'),
  cafeLayoutController.updateLayoutStatus,
);
router.delete(
  '/delete/:id',
  tokenVerification,
  allowRoles('superadmin', 'admin', 'manager'),
  cafeLayoutController.deleteCafeLayout,
);
router.patch(
  '/update/:id',
  tokenVerification,
  allowRoles('admin', 'manager', 'superadmin'),
  uploadLayoutImages,
  cafeLayoutController.updateCafeLayout,
);
router.get(
  '/admin-layout',
  tokenVerification,
  allowRoles('admin', 'manager'),
  cafeLayoutController.getCafeLayoutByAdmin,
);
router.get('/active/:id', cafeLayoutController.getActiveLayout);
router.get(
  '/all-layouts',
  tokenVerification,
  allowRoles('superadmin', 'admin', 'manager'),
  cafeLayoutController.getAllLayout,
);
router.get(
  '/:id',
  tokenVerification,
  allowRoles('superadmin', 'admin', 'manager'),
  cafeLayoutController.getLayoutById,
);

export default router;
