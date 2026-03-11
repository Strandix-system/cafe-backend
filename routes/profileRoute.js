import express from "express";
import { profileController } from "../src/admin/profile/profileController.js";
import {tokenVerification} from "../middleware/auth.js";
import { uploadAdminImages } from "../middleware/upload.js";
import {validate }from "../middleware/validate.js"
import {updateProfileValidator} from "../validations/createValidation.js";

export const profileRoute = express.Router();

profileRoute.get(
  "/me",
  tokenVerification,
  profileController.getMyProfile
);
profileRoute.put(
  "/update",
  tokenVerification,
  uploadAdminImages.single("profileImage"),
  validate(updateProfileValidator),
  profileController.updateMyProfile
);
profileRoute.delete(
  "/profile-image",
  tokenVerification,
  profileController.deleteProfileImage
);

