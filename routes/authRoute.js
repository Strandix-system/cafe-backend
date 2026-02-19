import express from "express";
import controller from "../src/auth/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { registerValidator, loginValidator, logoutValidator, } from "../validations/authValidation.js";
import { allowRoles } from "../middleware/permission.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerValidator),
  controller.register
);
router.post(
  "/login",
  validate(loginValidator),
  controller.login
);
router.post(
  "/logout",
  tokenVerification,
  validate(logoutValidator),
  controller.logout
);

router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password/:token", controller.resetPassword);
router.get("/me", tokenVerification, allowRoles("admin", "superadmin"), controller.me);
router.post("/change-password", tokenVerification, controller.changePassword);

export default router;
