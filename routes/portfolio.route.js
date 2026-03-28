import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { portfolioController } from '../src/portfolio/controller.js';
import {
  aboutStatsValidator,
  createCustomerFeedbackValidator,
  topCustomerFeedbackValidator,
} from '../validations/portfolio.validation.js';

export const portfolioRoute = express.Router();

portfolioRoute.get(
  '/about-stats/:adminId',
  validate(aboutStatsValidator),
  portfolioController.aboutStats,
);

portfolioRoute.post(
  '/customer-feedback',
  (req, res, next) => tokenVerification(req, res, next, true),
  validate(createCustomerFeedbackValidator),
  portfolioController.createCustomerFeedback,
);

portfolioRoute.get(
  '/top-feedback/:adminId',
  validate(topCustomerFeedbackValidator),
  portfolioController.getTopCustomerFeedbacks,
);
