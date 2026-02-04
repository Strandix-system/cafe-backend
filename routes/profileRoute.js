import express from "express";
import profileController from "../src/admin/profile/profileController.js";
import {tokenVerification} from "../middleware/auth.js";
import { uploadAdminImages } from "../middleware/index.js";

const router = express.Router();

// 🔐 Admin + Super Admin
router.get(
  "/me",
  tokenVerification,
  profileController.getMyProfile
);

router.put(
  "/update",
  tokenVerification,
  uploadAdminImages.single("profileImage"),
  profileController.updateMyProfile
);

export default router;
