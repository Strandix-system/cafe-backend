import express from "express";
import signUpController from "../src/signUp/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";

const router = express.Router();

router.post("/create-subscription", signUpController.createSubscription);
router.post("/verify-subscription", signUpController.verifySubscription);
router.post("/check-email", signUpController.checkEmail);
router.get("/plans", signUpController.getAllPlans);
router.get(
  "/transactions",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  signUpController.getTransactions
);
router.post(
  "/renew-subscription",
  tokenVerification,
  allowRoles("admin"),
  signUpController.renewSubscription
);
router.post(
  "/verify-renew-subscription",
  tokenVerification,
  allowRoles("admin"),
  signUpController.verifyRenewSubscription
);
export default router;
