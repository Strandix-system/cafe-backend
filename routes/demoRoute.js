import express from "express";
import controller from "../src/demoRequest/controller.js";
import { allowRoles } from "../middleware/permission.js";
import { tokenVerification } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", controller.createDemoRequest);

router.patch(
  "/status/:id",
 tokenVerification,
 allowRoles("superadmin"),
  controller.updateDemoStatus
);

router.get(
  "/all",
 tokenVerification,
 allowRoles("superadmin"),
 controller.getAllDemoRequests
);
router.get(
  "/getbyid/:id",
 tokenVerification,
 allowRoles("superadmin"),
 controller.getDemoRequestById
)

export default router;