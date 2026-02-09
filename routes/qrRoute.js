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
  "/",
  tokenVerification,
  allowRoles("admin"),
  qrController.getMyQrs
);
router.delete(
  "/:id",
  tokenVerification,
  allowRoles("admin"),
  qrController.deleteQr
);
router.get(
  "/verify",
  qrController.verifyScan
);
router.get(
  "/get-all",
  tokenVerification,
  allowRoles("admin"),
  qrController.getAllQr
);

export default router;
