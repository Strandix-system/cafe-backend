import express from "express";
import { demoController } from "../src/demoRequest/controller.js";
import { allowRoles } from "../middleware/permission.js";
import { tokenVerification } from "../middleware/auth.js";

export const demoRoute = express.Router();

demoRoute.post("/create", demoController.createDemoRequest);

demoRoute.patch(
  "/status/:id",
 tokenVerification,
 allowRoles("superadmin"),
  demoController.updateDemoStatus
);

demoRoute.get(
  "/all",
 tokenVerification,
 allowRoles("superadmin"),
 demoController.getAllDemoRequests
);
demoRoute.get(
  "/getbyid/:id",
 tokenVerification,
 allowRoles("superadmin"),
 demoController.getDemoRequestById
)
