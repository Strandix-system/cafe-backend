import express from "express";
import menuController from "../src/admin/menu/contoller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import{ uploadMenu} from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/create",
  tokenVerification,
  allowRoles("admin"),
  uploadMenu.single("image"),
  menuController.createMenu
);
router.patch(
  "/:id",
  tokenVerification,
  allowRoles("admin"),
  uploadMenu.single("image"),
  menuController.updateMenu
);
router.delete(
  "/:id",
  tokenVerification,
  allowRoles("admin"),
  menuController.deleteMenu
);
router.get(
  "/",
  tokenVerification,
  allowRoles("admin"),
  menuController.getAllMenus
);

export default router;
