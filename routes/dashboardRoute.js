import express from "express";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import dashboardController from "../src/admin/dashboard/controller.js";
const router = express.Router();

router.get("/stats", tokenVerification, allowRoles("admin", "superadmin"), dashboardController.getStats);
router.get("/sales", tokenVerification, allowRoles("admin"), dashboardController.getSalesChart);
router.get("/items", tokenVerification, allowRoles("admin"), dashboardController.getItemPerformance);
router.get("/peak-time", tokenVerification, allowRoles("admin"), dashboardController.getPeakTime);
router.get("/tables", tokenVerification, allowRoles("admin"), dashboardController.getTablePerformance);

export default router;