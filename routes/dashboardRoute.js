import express from "express";
import { tokenVerification } from "../middleware/auth.js";
import { getDashboardStats } from "../src/admin/Dashboard/controller.js";
import { allowRoles } from "../middleware/permission.js";
const router = express.Router();


// Dashboard Stats (SuperAdmin + Admin)
router.get(
    "/stats",
    tokenVerification,
     allowRoles("superadmin", "admin"),
    getDashboardStats
);

export default router;
