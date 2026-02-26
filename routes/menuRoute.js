import express from "express";
import menuController from "../src/admin/menu/contoller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import{ uploadMenu} from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { menuSchema , updateMenuSchema } from "../validations/menuValidation.js"; 

const router = express.Router();

router.post(
  "/create",
  tokenVerification,
  allowRoles("admin","superadmin"),
  uploadMenu.single("image"),
  validate(menuSchema),
  menuController.createMenu
);
router.patch(
  "/update/:menuId",
  tokenVerification,
  allowRoles("admin"),
  uploadMenu.single("image"),
  validate(updateMenuSchema),
  menuController.updateMenu
);
router.delete(
  "/delete/:menuId",
  tokenVerification,
  allowRoles("admin"),
  menuController.deleteMenu
);
router.get(
  "/all-menu",
  tokenVerification,
  allowRoles("admin","superadmin"),
  menuController.getAllMenus
);
router.get(
  "/my-menus", // Descriptive path
  tokenVerification,
  allowRoles("admin"),
  menuController.getMenusByAdmin
);
router.get(
  "/get-by-id/:menuId",
  tokenVerification,  
  allowRoles("admin"),
  menuController.getMenuById
);
// 🌍 PUBLIC MENU FOR PORTFOLIO
router.get(
  "/public/:adminId",
  menuController.getPublicMenus
);
router.get(
  "/used-categories",
   tokenVerification,  
  allowRoles("admin"),
  menuController.getAdminUsedCategories
);

export default router;
