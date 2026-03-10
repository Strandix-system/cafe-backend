import express from "express";
import { portfolioController } from "../src/portfolio/controller.js";
import { validate } from "../middleware/validate.js";
import {
  aboutStatsValidator,
  createCustomerFeedbackValidator,
  topCustomerFeedbackValidator,
} from "../validations/portfolio.validation.js";

const router = express.Router();
export const portfolioRoute = router;

router.get(
  "/about-stats/:adminId",
  validate(aboutStatsValidator),
  portfolioController.aboutStats
);
router.post(
  "/customer-feedback",
  validate(createCustomerFeedbackValidator),
  portfolioController.createCustomerFeedback
);
router.get(
  "/top-feedback/:adminId",
  validate(topCustomerFeedbackValidator),
  portfolioController.getTopCustomerFeedbacks
);
