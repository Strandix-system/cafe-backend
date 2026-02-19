import express from "express";
import { tokenVerification } from "../middleware/auth.js";
import { getDashboardStats } from "../src/admin/Dashboard/controller.js";
const router = express.Router();


// Dashboard Stats (SuperAdmin + Admin)
router.get(
    "/stats",
    tokenVerification,
    getDashboardStats
);

export default router;
