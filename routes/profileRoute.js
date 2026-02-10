import express from "express";
import profileController from "../src/admin/profile/profileController.js";
import {tokenVerification} from "../middleware/auth.js";
import { uploadAdminImages } from "../middleware/upload.js";
import {validate }from "../middleware/validate.js"
import {updateProfileValidator} from "../validations/createValidation.js";
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
  validate(updateProfileValidator),
  profileController.updateMyProfile
);
router.delete(
  "/profile-image",
  tokenVerification,
  profileController.deleteProfileImage
);

export default router;
