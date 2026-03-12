import express from "express";
import { webhookController } from "../src/webhooks/controller.js";
import { validate } from "../middleware/validate.js";
import { razorpayWebhookValidator } from "../validations/webhook.validation.js";

const router = express.Router();

router.post(
  "/razorpay-webhook",
  express.raw({ type: "application/json" }),
  validate(razorpayWebhookValidator),
  webhookController.razorpayWebhook
);

export const webhookRoutes = router;
