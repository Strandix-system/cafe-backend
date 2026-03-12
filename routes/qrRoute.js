import express from "express";
import { qrController } from "../src/admin/qr/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import { validate } from "../middleware/validate.js";
import { createQrValidator, scanQrValidator, getAllQrQueryValidator, layoutIdParamValidator } from "../validations/qr.validation.js";

export const qrRoute = express.Router();

qrRoute.post(
  "/create",
  tokenVerification,
  allowRoles("admin"),
  validate(createQrValidator),
  qrController.createQr
);
qrRoute.get(
  "/scan/:qrId",     
  validate(scanQrValidator),
  qrController.scanQr
);
qrRoute.get(
  "/get-all",
  tokenVerification,
  allowRoles("admin"),
  validate(getAllQrQueryValidator),
  qrController.getAllQr
);
qrRoute.get(
  "/count/:layoutId",
  tokenVerification,
  allowRoles("admin"),
  validate(layoutIdParamValidator),
  qrController.getQrCountforLayout
);  

