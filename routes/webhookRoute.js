import express from "express";
import webhookController from "../src/webhooks/controller.js";

const router = express.Router();

router.post(
  "/razorpay-webhook",
  express.raw({ type: "application/json" }),
  webhookController.razorpayWebhook
);

export default router;