import express from "express";
import { demoController } from "../src/demoRequest/controller.js";
import { allowRoles } from "../middleware/permission.js";
import { tokenVerification } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createDemoRequest,
  updateDemoStatus,
  getDemoRequestById,
  getAllDemoRequests,
} from "../validations/demoRequestValidation.js";

export const demoRoute = express.Router();

demoRoute.post("/create", validate(createDemoRequest), demoController.createDemoRequest);

demoRoute.patch(
  "/status/:id",
 tokenVerification,
 allowRoles("superadmin"),
 validate(updateDemoStatus),
  demoController.updateDemoStatus
);

demoRoute.get(
  "/all",
 tokenVerification,
 allowRoles("superadmin"),
 validate(getAllDemoRequests),
 demoController.getAllDemoRequests
);
demoRoute.get(
  "/getbyid/:id",
 tokenVerification,
 allowRoles("superadmin"),
validate(getDemoRequestById),
 demoController.getDemoRequestById
)
