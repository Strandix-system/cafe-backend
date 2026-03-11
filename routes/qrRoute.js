import express from "express";
import { qrController } from "../src/admin/qr/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";

export const qrRoute = express.Router();

qrRoute.post(
  "/create",
  tokenVerification,
  allowRoles("admin"),
  qrController.createQr
);
qrRoute.get(
  "/scan/:qrId",     
  qrController.scanQr
);
qrRoute.get(
  "/get-all",
  tokenVerification,
  allowRoles("admin"),
  qrController.getAllQr
);
qrRoute.get(
  "/count/:layoutId",
  tokenVerification,
  allowRoles("admin"),
  qrController.getQrCountforLayout
);  

