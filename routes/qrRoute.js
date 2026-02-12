import express from "express";
import qrController from "../src/admin/qr/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";

const router = express.Router();

// Admin create QR
router.post(
  "/create",
  tokenVerification,
  allowRoles("admin"),
  qrController.createQr
);

/* Customer: Scan QR (Public) */
router.get(
  "/scan/:qrId",      // ✅ Make it unique
  qrController.scanQr
);

/* Admin: Get QR Details */
// router.get(
//   "/details/:id",     // ✅ Make it unique
//   tokenVerification,
//   allowRoles("admin"),
//   qrController.getQrDetails
// );
router.get(
  "/get-all",
  tokenVerification,
  allowRoles("admin"),
  qrController.getAllQr
);

export default router;