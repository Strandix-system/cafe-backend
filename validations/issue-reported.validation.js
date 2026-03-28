import Joi from 'joi';
import { ISSUE_STATUSES } from '../utils/constants.js';

const raiseIssueValidator = {
  body: Joi.object({
    title: Joi.string().trim().min(3).max(100).required().messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 3 characters',
    }),
    description: Joi.string().trim().min(5).max(500).required().messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 5 characters',
    }),
  }),
};

const getIssueTicketsValidator = {
  query: Joi.object({
    search: Joi.string().trim().optional(),
    status: Joi.string()
      .trim()
      .valid(...Object.values(ISSUE_STATUSES))
      .optional(),
    ticketId: Joi.string().trim().optional(),
    adminId: Joi.string().hex().length(24).optional(),
    page: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().trim().optional(),
    populate: Joi.string().trim().optional(),
  }),
};

const updateIssueStatusValidator = {
  params: Joi.object({
    ticketId: Joi.string().trim().required(),
  }),
  body: Joi.object({
    status: Joi.string()
      .trim()
      .valid(...Object.values(ISSUE_STATUSES))
      .required(),
  }),
};

export {
  raiseIssueValidator,
  getIssueTicketsValidator,
  updateIssueStatusValidator,
};
