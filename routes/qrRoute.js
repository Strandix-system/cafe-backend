import express from "express";
import qrController from "../src/admin/qr/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";

const router = express.Router();

router.post(
  "/create",
  tokenVerification,
  allowRoles("admin"),
  qrController.createQr
);
router.get(
  "/scan/:qrId",     
  qrController.scanQr
);
router.get(
  "/get-all",
  tokenVerification,
  allowRoles("admin"),
  qrController.getAllQr
);
router.get(
  "/count/:layoutId",
  tokenVerification,
  allowRoles("admin"),
  qrController.getQrCountforLayout
);  

export default router;