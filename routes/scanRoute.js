import express from "express";
import scanController from "../src/admin/scan/controller.js";

const router = express.Router();

router.get("/:token", scanController.verifyScan);
router.get("/", scanController.verifyScan);

export default router;
