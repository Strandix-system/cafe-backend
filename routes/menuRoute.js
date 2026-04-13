import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import { uploadMenu } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { menuController } from '../src/admin/menu/contoller.js';
import { STAFF_ROLE } from '../utils/constants.js';
import { menuSchema, updateMenuSchema } from '../validations/menuValidation.js';

const router = express.Router();

router.post(
  '/create',
  tokenVerification,
  allowRoles('admin', 'outlet_manager', 'superadmin'),
  uploadMenu.single('image'),
  validate(menuSchema),
  menuController.createMenu,
);
router.patch(
  '/update/:menuId',
  tokenVerification,
  allowRoles('admin', 'outlet_manager'),
  uploadMenu.single('image'),
  validate(updateMenuSchema),
  menuController.updateMenu,
);
router.get(
  '/all-menu',
  tokenVerification,
  allowRoles('admin', 'outlet_manager', 'superadmin'),
  menuController.getAllMenus,
);
router.get(
  '/my-menus', // Descriptive path
  tokenVerification,
  allowRoles('admin', 'outlet_manager', ...Object.values(STAFF_ROLE)),
  menuController.getMenusByAdmin,
);
router.get(
  '/get-by-id/:menuId',
  tokenVerification,
  allowRoles('admin', 'outlet_manager'),
  menuController.getMenuById,
);
// 🌍 PUBLIC MENU FOR PORTFOLIO
router.get('/public/:adminId', menuController.getPublicMenus);

export const menuRoutes = router;
