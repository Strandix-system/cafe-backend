import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import { uploadQueryImage } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { issueController } from '../src/issueReported/controller.js';
import {
  raiseIssueValidator,
  getIssueTicketsValidator,
  updateIssueStatusValidator,
} from '../validations/issue-reported.validation.js';

export const issueReportedRoute = express.Router();

issueReportedRoute.post(
  '/raise',
  tokenVerification,
  allowRoles('admin', 'outlet_manager'),
  uploadQueryImage.array('images', 3),
  validate(raiseIssueValidator),
  issueController.raiseTicket,
);
issueReportedRoute.get(
  '/get-tickets',
  tokenVerification,
  allowRoles('admin', 'outlet_manager', 'superadmin'),
  validate(getIssueTicketsValidator),
  issueController.getTickets,
);
issueReportedRoute.patch(
  '/status/:ticketId',
  tokenVerification,
  allowRoles('superadmin'),
  validate(updateIssueStatusValidator),
  issueController.updateStatus,
);
